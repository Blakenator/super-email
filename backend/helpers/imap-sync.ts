import { ImapFlow } from 'imapflow';
import {
  simpleParser,
  type ParsedMail,
  type Headers,
  type Attachment as MailAttachment,
} from 'mailparser';
import { EmailAccount } from '../db/models/email-account.model.js';
import { Email, EmailFolder } from '../db/models/email.model.js';
import { Attachment, AttachmentType } from '../db/models/attachment.model.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { uploadAttachment } from './attachment-storage.js';
import { getImapCredentials } from './secrets.js';
import { Readable } from 'stream';

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
  cancelled: boolean;
}

// Sync expiration settings
const SYNC_EXPIRATION_MINUTES = 60; // Sync expires after 10 minutes of inactivity
const SYNC_EXPIRATION_UPDATE_INTERVAL = 30; // Update expiration every 30 seconds during sync

// Larger batch sizes for faster imports
const BATCH_SIZE = 200; // Messages to fetch from IMAP per batch
const DB_BATCH_SIZE = 50; // Emails to insert in a single DB transaction

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Check if an error is a timeout or connection error that should be retried
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('etimedout') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('socket hang up') ||
    message.includes('connection closed') ||
    message.includes('network error')
  );
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an IMAP operation with retry logic for timeout errors
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isRetryableError(error) && attempt < maxRetries) {
        console.log(
          `[IMAP] ${operationName} failed (attempt ${attempt}/${maxRetries}): ${lastError.message}. Retrying in ${RETRY_DELAY_MS}ms...`,
        );
        await sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
      } else {
        throw lastError;
      }
    }
  }

  throw lastError;
}

/**
 * Get the expiration time for a sync (now + SYNC_EXPIRATION_MINUTES)
 */
function getSyncExpirationTime(): Date {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + SYNC_EXPIRATION_MINUTES);
  return expiresAt;
}

/**
 * Check if a sync has expired (expiration time has passed)
 */
function isSyncExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

/**
 * Start an async sync for an email account
 * Uses syncId to prevent overlapping syncs and allow cancellation
 * Uses syncExpiresAt to detect and recover from stale/stuck syncs
 */
export async function startAsyncSync(
  emailAccount: EmailAccount,
): Promise<boolean> {
  // Reload to get latest sync state
  await emailAccount.reload();

  // Check if already syncing
  if (emailAccount.syncId) {
    // Check if the sync has expired (stuck/stale)
    if (isSyncExpired(emailAccount.syncExpiresAt)) {
      console.log(
        `[IMAP] Sync for ${emailAccount.email} has expired (syncId: ${emailAccount.syncId}), starting new sync`,
      );
      // Clear the stale sync
      await emailAccount.update({
        syncId: null,
        syncProgress: null,
        syncStatus: null,
        syncExpiresAt: null,
      });
    } else {
      console.log(
        `[IMAP] Sync already in progress for ${emailAccount.email} (syncId: ${emailAccount.syncId}), skipping`,
      );
      return false;
    }
  }

  // Generate unique sync ID
  const syncId = uuidv4();

  // Mark as syncing with our sync ID and initial expiration time
  await emailAccount.update({
    syncId,
    syncProgress: 0,
    syncStatus: 'Starting sync...',
    syncExpiresAt: getSyncExpirationTime(),
  });

  // Run sync in background
  syncEmailsFromImapAccount(emailAccount, syncId)
    .then(async (result) => {
      // Check if we're still the active sync
      await emailAccount.reload();
      if (emailAccount.syncId !== syncId) {
        console.log(
          `[IMAP] Sync ${syncId} was superseded, not updating status`,
        );
        return;
      }

      await emailAccount.update({
        syncId: null,
        syncProgress: 100,
        syncStatus: result.cancelled
          ? 'Sync cancelled'
          : `Synced ${result.synced} emails`,
        lastSyncedAt: new Date(),
        syncExpiresAt: null,
      });
      console.log(
        `[IMAP] Sync complete for ${emailAccount.email}: ${result.synced} synced`,
      );

      // Clear status after 10 seconds
      setTimeout(async () => {
        try {
          await emailAccount.reload();
          if (!emailAccount.syncId) {
            await emailAccount.update({
              syncProgress: null,
              syncStatus: null,
            });
          }
        } catch {
          // Ignore errors during cleanup
        }
      }, 10000);
    })
    .catch(async (err) => {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';

      // Check if we're still the active sync
      await emailAccount.reload();
      if (emailAccount.syncId !== syncId) {
        console.log(`[IMAP] Sync ${syncId} failed but was superseded`);
        return;
      }

      await emailAccount.update({
        syncId: null,
        syncProgress: null,
        syncStatus: `Sync failed: ${errorMsg}`,
        syncExpiresAt: null,
      });
      console.error(`[IMAP] Sync failed for ${emailAccount.email}:`, err);

      // Clear error status after 30 seconds
      setTimeout(async () => {
        try {
          await emailAccount.reload();
          if (!emailAccount.syncId) {
            await emailAccount.update({
              syncStatus: null,
            });
          }
        } catch {
          // Ignore errors during cleanup
        }
      }, 30000);
    });

  return true;
}

/**
 * Check if sync should continue (sync ID still matches)
 */
async function shouldContinueSync(
  emailAccount: EmailAccount,
  syncId: string,
): Promise<boolean> {
  await emailAccount.reload();
  return emailAccount.syncId === syncId;
}

/**
 * Update sync expiration time to keep the sync alive
 * Should be called periodically during an active sync
 */
async function updateSyncExpiration(
  emailAccount: EmailAccount,
  syncId: string,
): Promise<void> {
  // Only update if we're still the active sync
  await emailAccount.reload();
  if (emailAccount.syncId === syncId) {
    await emailAccount.update({
      syncExpiresAt: getSyncExpirationTime(),
    });
  }
}

/**
 * Connect to an IMAP server and fetch new emails with memory-efficient streaming
 */
export async function syncEmailsFromImapAccount(
  emailAccount: EmailAccount,
  syncId: string,
): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    skipped: 0,
    errors: [],
    cancelled: false,
  };

  // Get credentials from secure store, fall back to DB during migration
  const credentials = await getImapCredentials(emailAccount.id);
  const username = credentials?.username || emailAccount.username;
  const password = credentials?.password || emailAccount.password;

  const client = new ImapFlow({
    host: emailAccount.host,
    port: emailAccount.port,
    secure: emailAccount.useSsl,
    auth: {
      user: username,
      pass: password,
    },
    logger: false,
  });

  // Track last expiration update time
  let lastExpirationUpdate = Date.now();

  try {
    await emailAccount.update({ syncStatus: 'Connecting to server...' });
    await updateSyncExpiration(emailAccount, syncId);

    await withRetry(() => client.connect(), `Connect to ${emailAccount.host}`);
    console.log(`[IMAP] Connected to ${emailAccount.host}`);

    await emailAccount.update({ syncStatus: 'Opening mailbox...' });
    await updateSyncExpiration(emailAccount, syncId);

    const mailbox = await withRetry(
      () => client.mailboxOpen('INBOX'),
      'Open INBOX mailbox',
    );
    console.log(`[IMAP] Mailbox opened: ${mailbox.exists} messages total`);

    if (mailbox.exists === 0) {
      await client.logout();
      return result;
    }

    // Get the last synced date - if null, sync entire history
    const isFullSync = !emailAccount.lastSyncedAt;

    await emailAccount.update({
      syncStatus: isFullSync
        ? 'Fetching message list (first sync)...'
        : 'Searching for new messages...',
    });

    let totalToProcess = 0;

    if (isFullSync) {
      // Full sync: process from newest to oldest using sequence numbers
      totalToProcess = mailbox.exists;

      await emailAccount.update({
        syncStatus: `Processing ${totalToProcess} messages...`,
      });

      // Process in batches from newest (highest seq) to oldest (1)
      for (let start = mailbox.exists; start >= 1; start -= BATCH_SIZE) {
        // Check if sync was cancelled
        if (!(await shouldContinueSync(emailAccount, syncId))) {
          console.log(`[IMAP] Sync ${syncId} cancelled`);
          result.cancelled = true;
          break;
        }

        const end = Math.max(1, start - BATCH_SIZE + 1);
        const seqRange = `${end}:${start}`;

        const progress = Math.round(
          ((mailbox.exists - start + 1) / totalToProcess) * 100,
        );
        await emailAccount.update({
          syncProgress: Math.min(99, progress),
          syncStatus: `Processing messages ${end}-${start} of ${totalToProcess}...`,
        });

        // Update expiration time every SYNC_EXPIRATION_UPDATE_INTERVAL seconds
        const now = Date.now();
        if (
          now - lastExpirationUpdate >
          SYNC_EXPIRATION_UPDATE_INTERVAL * 1000
        ) {
          await updateSyncExpiration(emailAccount, syncId);
          lastExpirationUpdate = now;
        }

        const batchResult = await processBatch(
          client,
          emailAccount.id,
          seqRange,
          false,
          EmailFolder.INBOX,
          emailAccount.userId,
        );

        result.synced += batchResult.synced;
        result.skipped += batchResult.skipped;
        result.errors.push(...batchResult.errors);

        console.log(
          `[IMAP] ${emailAccount.email} INBOX batch ${end}-${start}: ${batchResult.synced} new, ${batchResult.skipped} skipped`,
        );
      }
    } else {
      // Incremental sync: search for messages since last sync
      const sinceDate = new Date(emailAccount.lastSyncedAt!);
      const searchResult = await withRetry(
        () => client.search({ since: sinceDate }),
        'Search for new messages',
      );
      const messageUids = searchResult === false ? [] : searchResult;

      console.log(
        `[IMAP] Incremental sync: found ${messageUids.length} messages since ${sinceDate.toISOString()}`,
      );

      if (messageUids.length === 0) {
        await client.logout();
        return result;
      }

      totalToProcess = messageUids.length;

      // Process UIDs in batches
      for (let i = 0; i < messageUids.length; i += BATCH_SIZE) {
        // Check if sync was cancelled
        if (!(await shouldContinueSync(emailAccount, syncId))) {
          console.log(`[IMAP] Sync ${syncId} cancelled`);
          result.cancelled = true;
          break;
        }

        const batchUids = messageUids.slice(i, i + BATCH_SIZE);
        const progress = Math.round((i / totalToProcess) * 100);

        await emailAccount.update({
          syncProgress: Math.min(99, progress),
          syncStatus: `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`,
        });

        // Update expiration time every SYNC_EXPIRATION_UPDATE_INTERVAL seconds
        const now = Date.now();
        if (
          now - lastExpirationUpdate >
          SYNC_EXPIRATION_UPDATE_INTERVAL * 1000
        ) {
          await updateSyncExpiration(emailAccount, syncId);
          lastExpirationUpdate = now;
        }

        const batchResult = await processBatchByUids(
          client,
          emailAccount.id,
          batchUids,
          EmailFolder.INBOX,
          emailAccount.userId,
        );

        result.synced += batchResult.synced;
        result.skipped += batchResult.skipped;
        result.errors.push(...batchResult.errors);

        console.log(
          `[IMAP] ${emailAccount.email} INBOX batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchResult.synced} new, ${batchResult.skipped} skipped`,
        );
      }
    }

    console.log(
      `[IMAP] ${emailAccount.email} INBOX sync complete: ${result.synced} synced, ${result.skipped} skipped`,
    );

    // Now sync Sent mail folder
    await syncSentFolder(client, emailAccount, syncId, result);

    await client.logout();
    console.log(
      `[IMAP] Sync complete for ${emailAccount.email}: ${result.synced} emails synced, ${result.skipped} skipped`,
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(`IMAP connection error: ${errorMsg}`);
    console.error(`[IMAP] Sync error for ${emailAccount.email}:`, err);

    try {
      await client.logout();
    } catch {
      // Ignore logout errors
    }
  }

  return result;
}

/**
 * Sync the Sent mail folder
 */
async function syncSentFolder(
  client: ImapFlow,
  emailAccount: EmailAccount,
  syncId: string,
  result: SyncResult,
): Promise<void> {
  // Common sent folder names across providers
  const sentFolderNames = [
    '[Gmail]/Sent Mail',
    'Sent',
    'Sent Items',
    'INBOX.Sent',
    'Sent Messages',
  ];

  let sentMailbox: any = null;
  let sentFolderName = '';

  // Try to open one of the sent folders
  for (const folderName of sentFolderNames) {
    try {
      sentMailbox = await withRetry(
        () => client.mailboxOpen(folderName),
        `Open Sent folder: ${folderName}`,
      );
      sentFolderName = folderName;
      console.log(
        `[IMAP] ${emailAccount.email} Opened Sent folder: ${folderName} (${sentMailbox.exists} messages)`,
      );
      break;
    } catch {
      // Folder doesn't exist, try next
      continue;
    }
  }

  if (!sentMailbox) {
    console.log(
      `[IMAP] ${emailAccount.email} No Sent folder found, skipping sent mail sync`,
    );
    return;
  }

  if (sentMailbox.exists === 0) {
    console.log(`[IMAP] ${emailAccount.email} Sent folder is empty`);
    return;
  }

  await emailAccount.update({
    syncStatus: 'Syncing sent mail...',
  });

  // Update expiration since we're moving to a new phase
  await updateSyncExpiration(emailAccount, syncId);

  const isFullSync = !emailAccount.lastSyncedAt;

  if (isFullSync) {
    // Full sync: process from newest to oldest
    const totalToProcess = sentMailbox.exists;
    console.log(
      `[IMAP] ${emailAccount.email} Full sync of ${totalToProcess} sent messages`,
    );

    for (let start = sentMailbox.exists; start >= 1; start -= BATCH_SIZE) {
      if (!(await shouldContinueSync(emailAccount, syncId))) {
        result.cancelled = true;
        break;
      }

      const end = Math.max(1, start - BATCH_SIZE + 1);
      const seqRange = `${end}:${start}`;

      const batchResult = await processBatch(
        client,
        emailAccount.id,
        seqRange,
        false,
        EmailFolder.SENT,
        emailAccount.userId,
      );

      result.synced += batchResult.synced;
      result.skipped += batchResult.skipped;
      result.errors.push(...batchResult.errors);

      console.log(
        `[IMAP] ${emailAccount.email} SENT batch ${end}-${start}: ${batchResult.synced} new, ${batchResult.skipped} skipped`,
      );
    }
  } else {
    // Incremental sync
    const sinceDate = new Date(emailAccount.lastSyncedAt!);
    const searchResult = await withRetry(
      () => client.search({ since: sinceDate }),
      'Search Sent folder for new messages',
    );
    const messageUids = searchResult === false ? [] : searchResult;

    console.log(
      `[IMAP] ${emailAccount.email} Incremental Sent sync: ${messageUids.length} messages since ${sinceDate.toISOString()}`,
    );

    if (messageUids.length > 0) {
      for (let i = 0; i < messageUids.length; i += BATCH_SIZE) {
        if (!(await shouldContinueSync(emailAccount, syncId))) {
          result.cancelled = true;
          break;
        }

        const batchUids = messageUids.slice(i, i + BATCH_SIZE);

        const batchResult = await processBatchByUids(
          client,
          emailAccount.id,
          batchUids,
          EmailFolder.SENT,
          emailAccount.userId,
        );

        result.synced += batchResult.synced;
        result.skipped += batchResult.skipped;
        result.errors.push(...batchResult.errors);

        console.log(
          `[IMAP] ${emailAccount.email} SENT batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchResult.synced} new, ${batchResult.skipped} skipped`,
        );
      }
    }
  }

  console.log(`[IMAP] ${emailAccount.email} Sent folder sync complete`);
}

/**
 * Process attachments from a parsed email and save to storage
 */
async function processEmailAttachments(
  emailId: string,
  parsedEmail: ParsedMail,
): Promise<void> {
  if (!parsedEmail.attachments || parsedEmail.attachments.length === 0) {
    return;
  }

  // Upload attachments in parallel with concurrency control
  const CONCURRENCY_LIMIT = 5; // Upload max 5 attachments simultaneously

  const uploadPromises = parsedEmail.attachments.map(async (attachment) => {
    try {
      // Generate a UUID for this attachment (used as storage key)
      const attachmentId = uuidv4();

      // Determine if inline or regular attachment
      const isInline =
        attachment.contentDisposition === 'inline' || !!attachment.cid;

      // Get file extension from filename
      const extension = attachment.filename
        ? attachment.filename.split('.').pop()?.toLowerCase() || null
        : null;

      // Create a readable stream from the attachment content
      const stream = Readable.from(attachment.content);

      // Upload to storage (S3 or local disk) using the attachment UUID
      const uploadResult = await uploadAttachment({
        attachmentId,
        mimeType: attachment.contentType || 'application/octet-stream',
        stream,
      });

      return {
        id: attachmentId,
        emailId,
        filename: attachment.filename || 'untitled',
        mimeType: attachment.contentType || 'application/octet-stream',
        extension,
        size: uploadResult.size,
        storageKey: uploadResult.storageKey,
        attachmentType: isInline
          ? AttachmentType.INLINE
          : AttachmentType.ATTACHMENT,
        contentId: attachment.cid || null,
        contentDisposition: attachment.contentDisposition || null,
        isSafe: true, // TODO: Add virus scanning in the future
      };
    } catch (error) {
      console.error(
        `[IMAP] Failed to process attachment: ${attachment.filename}`,
        error,
      );
      return null; // Return null for failed uploads
    }
  });

  // Process uploads with concurrency control
  const attachmentsToCreate: Array<Partial<Attachment>> = [];
  for (let i = 0; i < uploadPromises.length; i += CONCURRENCY_LIMIT) {
    const batch = uploadPromises.slice(i, i + CONCURRENCY_LIMIT);
    const results = await Promise.all(batch);
    attachmentsToCreate.push(...results.filter((r) => r !== null));
  }

  // Bulk create successfully uploaded attachments
  if (attachmentsToCreate.length > 0) {
    // TypeScript doesn't recognize Sequelize model static methods from base Model class
    // @ts-expect-error - bulkCreate exists on all Sequelize models
    await Attachment.bulkCreate(attachmentsToCreate);
    console.log(
      `[IMAP] Saved ${attachmentsToCreate.length} attachments for email ${emailId}`,
    );
  }
}

/**
 * Insert parsed emails into the database, skipping duplicates
 */
async function insertEmailBatch(
  emailAccountId: string,
  emailsToCreate: Array<Record<string, unknown>>,
  parsedEmails: ParsedMail[],
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

  // Check which messages already exist in DB (per-batch query)
  const existingEmails = await Email.findAll({
    where: {
      emailAccountId,
      messageId: { [Op.in]: messageIdsInBatch },
    },
    attributes: ['messageId'],
  });
  const existingIds = new Set(existingEmails.map((e) => e.messageId));

  // Filter out existing emails and their corresponding parsed emails
  const newEmailsData: Array<{
    emailData: Record<string, unknown>;
    parsed: ParsedMail;
  }> = [];
  for (let i = 0; i < emailsToCreate.length; i++) {
    if (!existingIds.has(emailsToCreate[i].messageId as string)) {
      newEmailsData.push({
        emailData: emailsToCreate[i],
        parsed: parsedEmails[i],
      });
    }
  }
  result.skipped = emailsToCreate.length - newEmailsData.length;

  // Bulk insert new emails
  if (newEmailsData.length > 0) {
    for (let j = 0; j < newEmailsData.length; j += DB_BATCH_SIZE) {
      const dbBatch = newEmailsData.slice(j, j + DB_BATCH_SIZE);
      try {
        const createdEmails = await Email.bulkCreate(
          dbBatch.map((d) => d.emailData) as any,
        );
        result.synced += dbBatch.length;
        result.newEmailIds.push(...createdEmails.map((e) => e.id));

        // Process attachments for newly created emails
        for (let k = 0; k < createdEmails.length; k++) {
          const email = createdEmails[k];
          const parsed = dbBatch[k].parsed;
          try {
            await processEmailAttachments(email.id, parsed);
          } catch (err) {
            console.error(
              `[IMAP] Failed to process attachments for email ${email.id}:`,
              err,
            );
            // Don't fail the whole batch, just log the error
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push(`Failed to insert batch: ${errorMsg}`);
        console.error('[IMAP] Batch insert failed:', err);
      }
    }
  }

  // Apply mail rules to newly created emails
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
      console.error('[IMAP] Error applying rules to new emails:', err);
    }
  }

  return result;
}

/**
 * Process a batch of messages from IMAP and insert into database
 * @param range - Either a sequence range string (e.g., "1:100") or array of UIDs
 * @param useUid - Whether to use UID mode for fetch (only applies to string ranges)
 */
async function processBatch(
  client: ImapFlow,
  emailAccountId: string,
  range: string | number[],
  useUid: boolean,
  folder: EmailFolder = EmailFolder.INBOX,
  userId?: string,
): Promise<{ synced: number; skipped: number; errors: string[] }> {
  const batchResult = { synced: 0, skipped: 0, errors: [] as string[] };
  const emailsToCreate: Array<Record<string, unknown>> = [];
  const parsedEmails: ParsedMail[] = [];
  const messageIdsInBatch: string[] = [];

  const fetchOptions = {
    envelope: true,
    source: true,
    uid: true,
    internalDate: true,
  };

  try {
    // Determine fetch call based on range type
    const messages =
      typeof range === 'string'
        ? client.fetch(range, fetchOptions, { uid: useUid })
        : client.fetch(range, fetchOptions);

    for await (const message of messages) {
      try {
        if (!message.source) {
          console.warn(`[IMAP] No source data for message UID ${message.uid}`);
          continue;
        }

        const envelope = message.envelope;
        const envelopeMessageId = envelope?.messageId || `uid-${message.uid}`;
        messageIdsInBatch.push(envelopeMessageId);

        // Parse the message (includes headers and attachments)
        const parsed = await simpleParser(message.source);

        // Use IMAP internalDate (when server received email) as receivedAt
        const receivedAtRaw =
          message.internalDate || parsed.date || envelope?.date || new Date();
        const receivedAt =
          receivedAtRaw instanceof Date
            ? receivedAtRaw
            : new Date(receivedAtRaw);

        // Prepare email data for batch insert
        const emailData = createEmailDataFromParsed(
          emailAccountId,
          envelopeMessageId,
          parsed,
          receivedAt,
          folder,
        );

        emailsToCreate.push(emailData);
        parsedEmails.push(parsed);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        batchResult.errors.push(
          `Failed to process message UID ${message.uid}: ${errorMsg}`,
        );
        console.error(`[IMAP] Error processing message:`, err);
      }
    }

    // Insert emails into database and apply rules
    const insertResult = await insertEmailBatch(
      emailAccountId,
      emailsToCreate,
      parsedEmails,
      messageIdsInBatch,
      userId,
    );
    batchResult.synced = insertResult.synced;
    batchResult.skipped = insertResult.skipped;
    batchResult.errors.push(...insertResult.errors);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    batchResult.errors.push(`Failed to fetch messages: ${errorMsg}`);
    console.error('[IMAP] Fetch failed:', err);
  }

  return batchResult;
}

/**
 * Process a batch of messages by UIDs (convenience wrapper)
 */
async function processBatchByUids(
  client: ImapFlow,
  emailAccountId: string,
  uids: number[],
  folder: EmailFolder = EmailFolder.INBOX,
  userId?: string,
): Promise<{ synced: number; skipped: number; errors: string[] }> {
  return processBatch(client, emailAccountId, uids, true, folder, userId);
}

/**
 * Extract headers to a plain object for storage
 */
function headersToObject(headers: Headers): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};

  headers.forEach((value, key) => {
    if (typeof value === 'string') {
      result[key] = value;
    } else if (Array.isArray(value)) {
      result[key] = value.map((v) => (typeof v === 'string' ? v : String(v)));
    } else if (value && typeof value === 'object') {
      result[key] = JSON.stringify(value);
    }
  });

  return result;
}

/**
 * Parse List-Unsubscribe header to extract URL and mailto
 */
function parseUnsubscribeHeader(header: string | undefined): {
  url?: string;
  email?: string;
} {
  if (!header) return {};

  const result: { url?: string; email?: string } = {};

  // Parse comma-separated values in angle brackets: <http://...>, <mailto:...>
  const matches = header.match(/<([^>]+)>/g);
  if (matches) {
    for (const match of matches) {
      const value = match.slice(1, -1); // Remove < and >
      if (value.startsWith('http://') || value.startsWith('https://')) {
        result.url = value;
      } else if (value.startsWith('mailto:')) {
        result.email = value.replace('mailto:', '');
      }
    }
  }

  return result;
}

/**
 * Extract unsubscribe info from both list-unsubscribe and list headers
 * The list header can contain structured unsubscribe info like:
 * { "unsubscribe": { "url": "...", "mail": "..." } }
 */
function extractUnsubscribeInfo(headers: Headers): {
  url?: string;
  email?: string;
} {
  const result: { url?: string; email?: string } = {};

  // First try the standard list-unsubscribe header
  const listUnsubscribeRaw = headers.get('list-unsubscribe');
  if (listUnsubscribeRaw) {
    let listUnsubscribeStr: string | undefined;
    if (typeof listUnsubscribeRaw === 'string') {
      listUnsubscribeStr = listUnsubscribeRaw;
    } else if (Array.isArray(listUnsubscribeRaw)) {
      listUnsubscribeStr = listUnsubscribeRaw.join(', ');
    } else if (typeof listUnsubscribeRaw === 'object') {
      const rawObj = listUnsubscribeRaw as any;
      listUnsubscribeStr =
        rawObj.text || rawObj.value || JSON.stringify(rawObj);
    }
    const parsed = parseUnsubscribeHeader(listUnsubscribeStr);
    if (parsed.url) result.url = parsed.url;
    if (parsed.email) result.email = parsed.email;
  }

  // Also check the "list" header which can contain structured unsubscribe info
  const listHeaderRaw = headers.get('list');
  if (listHeaderRaw && typeof listHeaderRaw === 'object') {
    const listHeader = listHeaderRaw as any;

    // Check for unsubscribe object: { unsubscribe: { url: "...", mail: "..." } }
    if (listHeader.unsubscribe) {
      const unsub = listHeader.unsubscribe;
      if (unsub.url && !result.url) {
        result.url = unsub.url;
      }
      if (unsub.mail && !result.email) {
        // Parse the mail field - it may contain email?subject=...&body=...
        const mailValue = unsub.mail;
        if (typeof mailValue === 'string') {
          // Extract just the email address (before the ?)
          const emailMatch = mailValue.match(/^([^?]+)/);
          if (emailMatch) {
            result.email = emailMatch[1];
          }
        }
      }
    }
  }

  return result;
}

/**
 * Create email data object from parsed mail
 */
function createEmailDataFromParsed(
  emailAccountId: string,
  messageId: string,
  parsed: ParsedMail,
  receivedAt: Date,
  folder: EmailFolder = EmailFolder.INBOX,
): Record<string, unknown> {
  const fromAddress = parsed.from?.value?.[0]?.address || 'unknown@unknown.com';
  const fromName = parsed.from?.value?.[0]?.name || null;

  const toAddresses = parsed.to
    ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
        .flatMap((addr) => addr.value.map((v) => v.address || ''))
        .filter(Boolean)
    : [];

  const ccAddresses = parsed.cc
    ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc])
        .flatMap((addr) => addr.value.map((v) => v.address || ''))
        .filter(Boolean)
    : null;

  const finalMessageId =
    parsed.messageId || messageId || `generated-${uuidv4()}`;

  // Extract all headers
  const headers = headersToObject(parsed.headers);

  // Parse unsubscribe header - check both list-unsubscribe and list headers
  const unsubscribeInfo = extractUnsubscribeInfo(parsed.headers);

  // Compute references array
  const referencesArray = parsed.references
    ? Array.isArray(parsed.references)
      ? parsed.references
      : [parsed.references]
    : null;

  // Compute threadId:
  // 1. First element in references (the original message that started the thread)
  // 2. Otherwise use inReplyTo (direct reply)
  // 3. Otherwise use this message's ID (it's the start of a new thread)
  const threadId = referencesArray?.[0] || parsed.inReplyTo || finalMessageId;

  return {
    emailAccountId,
    messageId: finalMessageId,
    folder,
    fromAddress,
    fromName,
    toAddresses: toAddresses.length > 0 ? toAddresses : [fromAddress],
    ccAddresses: ccAddresses && ccAddresses.length > 0 ? ccAddresses : null,
    bccAddresses: null,
    subject: parsed.subject || '(No Subject)',
    textBody: parsed.text || null,
    htmlBody: parsed.html || null,
    receivedAt,
    isRead: folder === EmailFolder.SENT, // Sent mail is always read
    isStarred: false,
    inReplyTo: parsed.inReplyTo || null,
    references: referencesArray,
    threadId,
    isDraft: false,
    headers,
    isUnsubscribed: false,
    unsubscribeUrl: unsubscribeInfo.url || null,
    unsubscribeEmail: unsubscribeInfo.email || null,
  };
}

/**
 * Test IMAP connection with provided credentials
 */
export async function testImapConnection(
  host: string,
  port: number,
  username: string,
  password: string,
  useSsl: boolean,
): Promise<{ success: boolean; error?: string }> {
  const client = new ImapFlow({
    host,
    port,
    secure: useSsl,
    auth: {
      user: username,
      pass: password,
    },
    logger: false,
  });

  try {
    await withRetry(() => client.connect(), `Test connect to ${host}`);
    await client.logout();
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    try {
      await client.logout();
    } catch {
      // Ignore logout errors
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Test IMAP connection for an existing account using secure credentials
 */
export async function testImapConnectionForAccount(
  emailAccount: EmailAccount,
): Promise<{ success: boolean; error?: string }> {
  // Get credentials from secure store, fall back to DB during migration
  const credentials = await getImapCredentials(emailAccount.id);
  const username = credentials?.username || emailAccount.username;
  const password = credentials?.password || emailAccount.password;

  return testImapConnection(
    emailAccount.host,
    emailAccount.port,
    username,
    password,
    emailAccount.useSsl,
  );
}

/**
 * List mailboxes for an account
 */
export async function listImapMailboxes(
  emailAccount: EmailAccount,
): Promise<string[]> {
  // Get credentials from secure store, fall back to DB during migration
  const credentials = await getImapCredentials(emailAccount.id);
  const username = credentials?.username || emailAccount.username;
  const password = credentials?.password || emailAccount.password;

  const client = new ImapFlow({
    host: emailAccount.host,
    port: emailAccount.port,
    secure: emailAccount.useSsl,
    auth: {
      user: username,
      pass: password,
    },
    logger: false,
  });

  try {
    await withRetry(
      () => client.connect(),
      `Connect to ${emailAccount.host} for listing`,
    );
    const mailboxes = await withRetry(() => client.list(), 'List mailboxes');
    await client.logout();

    return mailboxes.map((mb) => mb.path);
  } catch (err) {
    console.error('Failed to list mailboxes:', err);
    try {
      await client.logout();
    } catch {
      // Ignore
    }
    throw err;
  }
}
