import type { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { EmailAccount } from '../db/models/email-account.model.js';
import { ImapAccountSettings } from '../db/models/imap-account-settings.model.js';
import { Email, EmailFolder } from '../db/models/email.model.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { createImapClient, withRetry } from './imap-client.js';
import {
  createEmailDataFromParsed,
  uploadAttachmentsImmediately,
  createAttachmentRecords,
  type EmailWithAttachments,
} from './email-parser.js';
import {
  type SyncResult,
  type SyncType,
  SYNC_EXPIRATION_UPDATE_INTERVAL,
  getSyncFields,
  isSyncExpired,
  clearExpiredSync,
  markSyncStarted,
  markSyncCompleted,
  markSyncFailed,
  shouldContinueSync,
  updateSyncExpiration,
} from './imap-sync-state.js';
import { publishMailboxUpdate } from './pubsub.js';
import { checkBillingLimits } from './billing-checks.js';
import { recalculateUserUsage } from './usage-calculator.js';
import { sendNewEmailNotifications } from './push-notifications.js';
import { logger } from './logger.js';

const BATCH_SIZE = 100;
const DB_BATCH_SIZE = 50;

// ---------------------------------------------------------------------------
// Folder sync configuration
// ---------------------------------------------------------------------------

interface FolderSyncConfig {
  folder: EmailFolder;
  folderLabel: string;
  resumeUidField: 'historicalSyncLastUidInbox' | 'historicalSyncLastUidSent';
  totalField: 'historicalSyncTotalInbox' | 'historicalSyncTotalSent';
  uidNextField: 'lastSyncUidNextInbox' | 'lastSyncUidNextSent';
  /** When true, write progress/status to syncProgress & syncStatus DB fields */
  reportProgress: boolean;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Start an async sync for an email account.
 * Historical syncs (first-time full import) and update syncs (new emails only)
 * run independently.
 */
export async function startAsyncSync(
  emailAccount: EmailAccount,
  imapSettings: ImapAccountSettings,
): Promise<boolean> {
  await imapSettings.reload();

  const billingCheck = await checkBillingLimits(emailAccount.userId);
  if (!billingCheck.canSync) {
    logger.warn('IMAP', `Sync blocked for ${emailAccount.email}: ${billingCheck.reason}`);
    publishMailboxUpdate(emailAccount.userId, {
      type: 'ERROR',
      emailAccountId: emailAccount.id,
      message: billingCheck.reason || 'Usage limit exceeded',
    });
    return false;
  }

  const needsHistoricalSync =
    !imapSettings.historicalSyncLastAt && !imapSettings.historicalSyncComplete;
  const syncType: SyncType = needsHistoricalSync ? 'historical' : 'update';
  const fields = getSyncFields(syncType);

  const existingSyncId = imapSettings[fields.syncIdField];
  const existingExpiresAt = imapSettings[fields.expiresAtField];

  if (existingSyncId) {
    if (isSyncExpired(existingExpiresAt)) {
      logger.info('IMAP', `${syncType} sync for ${emailAccount.email} has expired (syncId: ${existingSyncId}), starting new sync`);
      await clearExpiredSync(imapSettings, syncType);
    } else {
      logger.debug('IMAP', `${syncType} sync already in progress for ${emailAccount.email} (syncId: ${existingSyncId}), skipping`);
      return false;
    }
  }

  const syncId = uuidv4();

  const started = await markSyncStarted(imapSettings, syncType, syncId);
  if (!started) {
    logger.debug('IMAP', `${syncType} sync lost race for ${emailAccount.email}, another sync started first`);
    return false;
  }

  publishMailboxUpdate(emailAccount.userId, {
    type: 'SYNC_STARTED',
    emailAccountId: emailAccount.id,
    message:
      syncType === 'historical'
        ? 'Starting historical sync...'
        : 'Starting email sync...',
  });

  // Run sync in background (fire-and-forget)
  syncEmailsFromImapAccount(emailAccount, imapSettings, syncId, syncType)
    .then(async (result) => {
      const updated = await markSyncCompleted(imapSettings, syncType, syncId, result);
      if (!updated) {
        logger.info('IMAP', `${syncType} sync ${syncId} was superseded, not updating status`);
        return;
      }

      logger.info('IMAP', `${syncType} sync complete for ${emailAccount.email}: ${result.synced} synced`);

      try {
        await recalculateUserUsage(emailAccount.userId);
      } catch (usageError) {
        logger.error('IMAP', 'Failed to recalculate usage after sync', { error: usageError instanceof Error ? usageError.message : usageError });
      }

      publishMailboxUpdate(emailAccount.userId, {
        type: 'SYNC_COMPLETED',
        emailAccountId: emailAccount.id,
        message: result.cancelled
          ? 'Sync cancelled'
          : `Synced ${result.synced} new email(s)`,
      });

      if (syncType === 'update' && result.synced > 0 && !result.cancelled) {
        try {
          const recentEmails = await Email.findAll({
            where: { emailAccountId: emailAccount.id, folder: EmailFolder.INBOX },
            order: [['receivedAt', 'DESC']],
            limit: Math.min(result.synced, 20),
          });

          await sendNewEmailNotifications(
            emailAccount.userId,
            recentEmails,
            emailAccount.email,
          );
        } catch (pushError) {
          logger.error('IMAP', 'Failed to send push notification after sync', { error: pushError instanceof Error ? pushError.message : pushError });
        }
      }

      // Clear status after a short delay
      setTimeout(async () => {
        try {
          await imapSettings.reload();
          if (!imapSettings[fields.syncIdField]) {
            await imapSettings.update({
              [fields.progressField]: null,
              [fields.statusField]: null,
            });
          }
        } catch (cleanupErr) {
          logger.debug('IMAP', 'Error during post-sync cleanup (10s timeout)', { error: cleanupErr instanceof Error ? cleanupErr.message : cleanupErr });
        }
      }, 10000);
    })
    .catch(async (err) => {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';

      await markSyncFailed(imapSettings, syncType, syncId, errorMsg);
      logger.error('IMAP', `${syncType} sync failed for ${emailAccount.email}`, { error: err instanceof Error ? err.message : err });

      publishMailboxUpdate(emailAccount.userId, {
        type: 'ERROR',
        emailAccountId: emailAccount.id,
        message: `Sync failed: ${errorMsg}`,
      });

      setTimeout(async () => {
        try {
          await imapSettings.reload();
          if (!imapSettings[fields.syncIdField]) {
            await imapSettings.update({
              [fields.statusField]: null,
            });
          }
        } catch (cleanupErr) {
          logger.debug('IMAP', 'Error during post-failure cleanup (30s timeout)', { error: cleanupErr instanceof Error ? cleanupErr.message : cleanupErr });
        }
      }, 30000);
    });

  return true;
}

// ---------------------------------------------------------------------------
// Main sync orchestrator
// ---------------------------------------------------------------------------

export async function syncEmailsFromImapAccount(
  emailAccount: EmailAccount,
  imapSettings: ImapAccountSettings,
  syncId: string,
  syncType: SyncType = 'update',
): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    skipped: 0,
    errors: [],
    cancelled: false,
  };

  const client = await createImapClient(imapSettings);
  const expirationTracker = { lastUpdate: Date.now() };
  const fields = getSyncFields(syncType);

  try {
    await imapSettings.update({
      [fields.statusField]: 'Connecting to server...',
    });
    await updateSyncExpiration(imapSettings, syncId, syncType);

    await withRetry(() => client.connect(), `Connect to ${imapSettings.host}`);
    logger.info('IMAP', `Connected to ${imapSettings.host}`);

    await imapSettings.update({
      [fields.statusField]: 'Opening mailbox...',
    });
    await updateSyncExpiration(imapSettings, syncId, syncType);

    const mailbox = await withRetry(
      () => client.mailboxOpen('INBOX'),
      'Open INBOX mailbox',
    );
    logger.info('IMAP', `Mailbox opened: ${mailbox.exists} messages total`);

    if (mailbox.exists === 0) {
      await client.logout();
      return result;
    }

    const isFullSync = syncType === 'historical' || !imapSettings.lastSyncedAt;
    const statusMsg = isFullSync
      ? 'Fetching message list (first sync)...'
      : 'Searching for new messages...';

    await imapSettings.update({
      [fields.statusField]: statusMsg,
    });

    // Sync INBOX
    await syncFolderMessages(client, emailAccount, imapSettings, syncId, syncType, {
      folder: EmailFolder.INBOX,
      folderLabel: 'INBOX',
      resumeUidField: 'historicalSyncLastUidInbox',
      totalField: 'historicalSyncTotalInbox',
      uidNextField: 'lastSyncUidNextInbox',
      reportProgress: true,
    }, result, expirationTracker);

    logger.info('IMAP', `${emailAccount.email} INBOX sync complete: ${result.synced} synced, ${result.skipped} skipped`);

    // Sync Sent folder
    await syncSentFolder(client, emailAccount, imapSettings, syncId, syncType, result, expirationTracker);

    await client.logout();
    logger.info('IMAP', `Sync complete for ${emailAccount.email}: ${result.synced} emails synced, ${result.skipped} skipped`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(`IMAP connection error: ${errorMsg}`);
    logger.error('IMAP', `Sync error for ${emailAccount.email}`, { error: err instanceof Error ? err.message : err });

    try {
      await client.logout();
    } catch (logoutErr) {
      logger.debug('IMAP', `Logout failed after sync error for ${emailAccount.email}`, { error: logoutErr instanceof Error ? logoutErr.message : logoutErr });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Unified folder sync (DRY: replaces duplicated INBOX/Sent loops)
// ---------------------------------------------------------------------------

/**
 * Sync messages for a single folder (historical or incremental).
 * The mailbox must already be open on `client`.
 */
async function syncFolderMessages(
  client: ImapFlow,
  emailAccount: EmailAccount,
  imapSettings: ImapAccountSettings,
  syncId: string,
  syncType: SyncType,
  config: FolderSyncConfig,
  result: SyncResult,
  expirationTracker: { lastUpdate: number },
): Promise<void> {
  const fields = getSyncFields(syncType);
  const isFullSync = syncType === 'historical' || !imapSettings.lastSyncedAt;

  if (isFullSync) {
    await imapSettings.reload();
    const isResuming =
      syncType === 'historical' &&
      imapSettings[config.resumeUidField] !== null;

    const lastProcessedUid = isResuming
      ? (imapSettings[config.resumeUidField] as number)
      : null;

    if (isResuming) {
      logger.info('IMAP', `${emailAccount.email} Resuming ${config.folderLabel} sync from UID ${lastProcessedUid}`);
    }

    const searchResult = await withRetry(
      () => client.search({ all: true }, { uid: true }),
      `Search for all ${config.folderLabel} messages`,
    );
    const allUids = searchResult === false ? [] : searchResult;

    if (allUids.length === 0) {
      logger.info('IMAP', `${emailAccount.email} No ${config.folderLabel} messages to sync`);
      return;
    }

    const sortedUids = [...allUids].sort((a, b) => b - a);

    let uidsToProcess: number[];
    if (isResuming && lastProcessedUid !== null) {
      uidsToProcess = sortedUids.filter((uid) => uid < lastProcessedUid);
      logger.info('IMAP', `${emailAccount.email} ${config.folderLabel} resuming: ${uidsToProcess.length} UIDs remaining (of ${sortedUids.length} total)`);
    } else {
      uidsToProcess = sortedUids;
    }

    const totalUids = sortedUids.length;
    const totalRemaining = uidsToProcess.length;

    if (syncType === 'historical' && !isResuming) {
      await imapSettings.update({ [config.totalField]: totalUids });
    }

    const savedTotal =
      (imapSettings[config.totalField] as number | null) || totalUids;

    logger.info('IMAP', `${emailAccount.email} ${config.folderLabel}: ${totalRemaining} messages to process`);

    let batchNumber = 0;
    let processedInSession = 0;

    for (let i = 0; i < uidsToProcess.length; i += BATCH_SIZE) {
      if (!(await shouldContinueSync(imapSettings, syncId, syncType))) {
        logger.info('IMAP', `${syncType} sync ${syncId} cancelled`);
        result.cancelled = true;
        break;
      }

      batchNumber++;
      const batchUids = uidsToProcess.slice(i, i + BATCH_SIZE);
      const lowestUidInBatch = Math.min(...batchUids);

      if (config.reportProgress) {
        const totalProcessed = savedTotal - totalRemaining + processedInSession;
        const progress = Math.min(
          99,
          Math.round((totalProcessed / Math.max(1, savedTotal)) * 100),
        );
        const progressMsg = `Processing batch ${batchNumber} (${result.synced + result.skipped} processed, ${result.synced} new)...`;
        await imapSettings.update({
          [fields.progressField]: progress,
          [fields.statusField]: progressMsg,
        });
      }

      const now = Date.now();
      if (now - expirationTracker.lastUpdate > SYNC_EXPIRATION_UPDATE_INTERVAL * 1000) {
        await updateSyncExpiration(imapSettings, syncId, syncType);
        expirationTracker.lastUpdate = now;
      }

      const batchResult = await processBatchByUids(
        client,
        emailAccount.id,
        batchUids,
        config.folder,
        emailAccount.userId,
      );

      result.synced += batchResult.synced;
      result.skipped += batchResult.skipped;
      result.errors.push(...batchResult.errors);
      processedInSession += batchResult.synced + batchResult.skipped;

      if (syncType === 'historical') {
        await imapSettings.update({
          [config.resumeUidField]: lowestUidInBatch,
        });
      }

      logger.debug('IMAP', `${emailAccount.email} ${config.folderLabel} batch ${batchNumber}: ${batchResult.synced} new, ${batchResult.skipped} skipped`);
    }

    if (syncType === 'historical' && !result.cancelled) {
      await imapSettings.update({
        [config.resumeUidField]: null,
        [config.totalField]: null,
      });
      // Store uidNext so the first incremental sync can use UID-based search
      await storeUidNext(client, imapSettings, config);
      logger.info('IMAP', `${emailAccount.email} ${config.folderLabel} historical sync completed, cleared resume point`);
    }
  } else {
    // Incremental sync — prefer UID-based search over date-based IMAP SINCE,
    // which is unreliable on some servers (date-only comparison, search index lag).
    const sinceDate = new Date(imapSettings.lastSyncedAt!);

    const storedUidNext = imapSettings[config.uidNextField];
    let messageUids: number[];

    if (storedUidNext) {
      const searchResult = await withRetry(
        () => client.search({ uid: `${storedUidNext}:*` }, { uid: true }),
        `Search ${config.folderLabel} by UID range`,
      );
      if (searchResult === false) {
        logger.warn('IMAP', `${emailAccount.email} ${config.folderLabel} UID range search failed, will scan recent messages`);
        messageUids = await fetchRecentMessageUids(client, sinceDate, config.folderLabel, emailAccount.email);
      } else {
        messageUids = searchResult.filter(uid => uid >= storedUidNext);
      }
      logger.info('IMAP', `${emailAccount.email} Incremental ${config.folderLabel} sync: ${messageUids.length} messages (UID >= ${storedUidNext})`);
    } else {
      // No stored uidNext yet — scan recent messages by sequence number and
      // filter by internalDate. This bypasses IMAP SEARCH SINCE entirely.
      messageUids = await fetchRecentMessageUids(client, sinceDate, config.folderLabel, emailAccount.email);
      logger.info('IMAP', `${emailAccount.email} Incremental ${config.folderLabel} sync: ${messageUids.length} messages since ${sinceDate.toISOString()} (scanned recent messages)`);
    }

    if (messageUids.length === 0) {
      // Still store uidNext even when nothing new so future syncs use UID path
      await storeUidNext(client, imapSettings, config);
      return;
    }

    const totalToProcess = messageUids.length;

    for (let i = 0; i < messageUids.length; i += BATCH_SIZE) {
      if (!(await shouldContinueSync(imapSettings, syncId, syncType))) {
        logger.info('IMAP', `${syncType} sync ${syncId} cancelled`);
        result.cancelled = true;
        break;
      }

      const batchUids = messageUids.slice(i, i + BATCH_SIZE);

      if (config.reportProgress) {
        const progress = Math.round((i / totalToProcess) * 100);
        const progressMsg = `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`;
        await imapSettings.update({
          [fields.progressField]: Math.min(99, progress),
          [fields.statusField]: progressMsg,
        });
      }

      const now = Date.now();
      if (now - expirationTracker.lastUpdate > SYNC_EXPIRATION_UPDATE_INTERVAL * 1000) {
        await updateSyncExpiration(imapSettings, syncId, syncType);
        expirationTracker.lastUpdate = now;
      }

      const batchResult = await processBatchByUids(
        client,
        emailAccount.id,
        batchUids,
        config.folder,
        emailAccount.userId,
      );

      result.synced += batchResult.synced;
      result.skipped += batchResult.skipped;
      result.errors.push(...batchResult.errors);

      logger.debug('IMAP', `${emailAccount.email} ${config.folderLabel} batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchResult.synced} new, ${batchResult.skipped} skipped`);
    }

    if (!result.cancelled) {
      await storeUidNext(client, imapSettings, config);
    }
  }

  logger.info('IMAP', `${emailAccount.email} ${config.folderLabel} sync complete`);
}

// ---------------------------------------------------------------------------
// Sent folder discovery + sync
// ---------------------------------------------------------------------------

const SENT_FOLDER_NAMES = [
  '[Gmail]/Sent Mail',
  'Sent',
  'Sent Items',
  'INBOX.Sent',
  'Sent Messages',
];

async function syncSentFolder(
  client: ImapFlow,
  emailAccount: EmailAccount,
  imapSettings: ImapAccountSettings,
  syncId: string,
  syncType: SyncType,
  result: SyncResult,
  expirationTracker: { lastUpdate: number },
): Promise<void> {
  const fields = getSyncFields(syncType);

  // Try to open one of the common sent folder names
  let sentMailbox: any = null;
  for (const folderName of SENT_FOLDER_NAMES) {
    try {
      sentMailbox = await withRetry(
        () => client.mailboxOpen(folderName),
        `Open Sent folder: ${folderName}`,
      );
      logger.info('IMAP', `${emailAccount.email} Opened Sent folder: ${folderName} (${sentMailbox.exists} messages)`);
      break;
    } catch {
      continue;
    }
  }

  if (!sentMailbox) {
    logger.info('IMAP', `${emailAccount.email} No Sent folder found, skipping sent mail sync`);
    return;
  }

  if (sentMailbox.exists === 0) {
    logger.info('IMAP', `${emailAccount.email} Sent folder is empty`);
    return;
  }

  const sentStatusMsg = 'Syncing sent mail...';
  await imapSettings.update({
    [fields.statusField]: sentStatusMsg,
  });

  await updateSyncExpiration(imapSettings, syncId, syncType);

  await syncFolderMessages(client, emailAccount, imapSettings, syncId, syncType, {
    folder: EmailFolder.SENT,
    folderLabel: 'SENT',
    resumeUidField: 'historicalSyncLastUidSent',
    totalField: 'historicalSyncTotalSent',
    uidNextField: 'lastSyncUidNextSent',
    reportProgress: false,
  }, result, expirationTracker);
}

// ---------------------------------------------------------------------------
// UID-based incremental sync helpers
// ---------------------------------------------------------------------------

const RECENT_FETCH_LIMIT = 500;

/**
 * Fallback when no stored uidNext is available or UID search fails.
 * Fetches the last N messages by sequence number (lightweight: uid + internalDate)
 * and returns UIDs of messages received on or after `sinceDate`.
 */
async function fetchRecentMessageUids(
  client: ImapFlow,
  sinceDate: Date,
  folderLabel: string,
  email: string,
): Promise<number[]> {
  const mailboxInfo = client.mailbox;
  const exists = mailboxInfo && typeof mailboxInfo !== 'boolean' ? mailboxInfo.exists : 0;
  if (exists === 0) return [];

  const fetchCount = Math.min(RECENT_FETCH_LIMIT, exists);
  const startSeq = Math.max(1, exists - fetchCount + 1);

  const uids: number[] = [];
  for await (const msg of client.fetch(`${startSeq}:*`, { uid: true, internalDate: true })) {
    if (msg.internalDate && msg.internalDate >= sinceDate) {
      uids.push(msg.uid);
    }
  }

  logger.debug('IMAP', `${email} ${folderLabel} scanned ${fetchCount} recent messages, ${uids.length} match since ${sinceDate.toISOString()}`);
  return uids;
}

/**
 * Persist the current mailbox uidNext so the next incremental sync
 * can use UID-range search instead of date-based SINCE.
 */
async function storeUidNext(
  client: ImapFlow,
  imapSettings: ImapAccountSettings,
  config: FolderSyncConfig,
): Promise<void> {
  const mailboxInfo = client.mailbox;
  const uidNext = mailboxInfo && typeof mailboxInfo !== 'boolean'
    ? (mailboxInfo as any).uidNext as number | undefined
    : undefined;
  if (uidNext) {
    await imapSettings.update({ [config.uidNextField]: uidNext });
  }
}

// ---------------------------------------------------------------------------
// Batch processing
// ---------------------------------------------------------------------------

async function processBatch(
  client: ImapFlow,
  emailAccountId: string,
  range: string | number[],
  useUid: boolean,
  folder: EmailFolder = EmailFolder.INBOX,
  userId?: string,
): Promise<{ synced: number; skipped: number; errors: string[] }> {
  const batchResult = { synced: 0, skipped: 0, errors: [] as string[] };
  const emailsWithAttachments: EmailWithAttachments[] = [];
  const messageIdsInBatch: string[] = [];

  const fetchOptions = {
    envelope: true,
    source: true,
    uid: true,
    internalDate: true,
    flags: true,
  };

  try {
    const messages = client.fetch(range, fetchOptions, { uid: useUid });

    for await (const message of messages) {
      try {
        if (!message.source) {
          logger.warn('IMAP', `No source data for message UID ${message.uid}`);
          continue;
        }

        const envelope = message.envelope;
        const envelopeMessageId = envelope?.messageId || `uid-${message.uid}`;
        messageIdsInBatch.push(envelopeMessageId);

        const parsed = await simpleParser(message.source);
        const attachments = await uploadAttachmentsImmediately(parsed);

        const emailData = createEmailDataFromParsed(
          emailAccountId,
          envelopeMessageId,
          parsed,
          folder,
          message,
        );

        emailsWithAttachments.push({ emailData, attachments });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        batchResult.errors.push(
          `Failed to process message UID ${message.uid}: ${errorMsg}`,
        );
        logger.error('IMAP', `Error processing message UID ${message.uid}`, { error: errorMsg });
      }
    }

    const insertResult = await insertEmailBatch(
      emailAccountId,
      emailsWithAttachments,
      messageIdsInBatch,
      userId,
    );
    batchResult.synced = insertResult.synced;
    batchResult.skipped = insertResult.skipped;
    batchResult.errors.push(...insertResult.errors);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    batchResult.errors.push(`Failed to fetch messages: ${errorMsg}`);
    logger.error('IMAP', 'Fetch failed in processBatch', { error: errorMsg });
  }

  return batchResult;
}

function processBatchByUids(
  client: ImapFlow,
  emailAccountId: string,
  uids: number[],
  folder: EmailFolder = EmailFolder.INBOX,
  userId?: string,
): Promise<{ synced: number; skipped: number; errors: string[] }> {
  return processBatch(client, emailAccountId, uids, true, folder, userId);
}

// ---------------------------------------------------------------------------
// Database insert + rule application
// ---------------------------------------------------------------------------

async function insertEmailBatch(
  emailAccountId: string,
  emailsWithAttachments: EmailWithAttachments[],
  messageIdsInBatch: string[],
  userId?: string,
): Promise<{
  synced: number;
  skipped: number;
  errors: string[];
  newEmailIds: string[];
}> {
  const result = {
    synced: 0,
    skipped: 0,
    errors: [] as string[],
    newEmailIds: [] as string[],
  };

  if (messageIdsInBatch.length === 0) {
    return result;
  }

  const existingEmails = await Email.findAll({
    where: {
      emailAccountId,
      messageId: { [Op.in]: messageIdsInBatch },
    },
    attributes: ['messageId'],
  });
  const existingIds = new Set(existingEmails.map((e) => e.messageId));

  const newEmailsData: EmailWithAttachments[] = [];
  for (const emailWithAtt of emailsWithAttachments) {
    if (!existingIds.has(emailWithAtt.emailData.messageId as string)) {
      newEmailsData.push(emailWithAtt);
    }
  }
  result.skipped = emailsWithAttachments.length - newEmailsData.length;

  if (newEmailsData.length > 0) {
    for (let j = 0; j < newEmailsData.length; j += DB_BATCH_SIZE) {
      const dbBatch = newEmailsData.slice(j, j + DB_BATCH_SIZE);
      try {
        const createdEmails = await Email.bulkCreate(
          dbBatch.map((d) => d.emailData) as any,
        );
        result.synced += dbBatch.length;
        result.newEmailIds.push(...createdEmails.map((e) => e.id));

        for (let k = 0; k < createdEmails.length; k++) {
          const email = createdEmails[k];
          const attachments = dbBatch[k].attachments;
          try {
            await createAttachmentRecords(email.id, attachments);
          } catch (err) {
            logger.error('IMAP', `Failed to create attachment records for email ${email.id}`, { error: err instanceof Error ? err.message : err });
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push(`Failed to insert batch: ${errorMsg}`);
        logger.error('IMAP', 'Batch insert failed', { error: err instanceof Error ? err.message : err });
      }
    }
  }

  if (result.newEmailIds.length > 0 && userId) {
    try {
      const { applyRulesToEmail } = await import('./rule-matcher.js');
      const newlyCreatedEmails = await Email.findAll({
        where: { id: { [Op.in]: result.newEmailIds } },
      });
      for (const email of newlyCreatedEmails) {
        await applyRulesToEmail(email, userId);
      }
    } catch (err) {
      logger.error('IMAP', 'Error applying rules to new emails', { error: err instanceof Error ? err.message : err });
    }
  }

  return result;
}
