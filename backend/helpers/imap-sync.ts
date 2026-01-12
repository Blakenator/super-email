import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';
import { EmailAccount } from '../db/models/email-account.model.js';
import { Email, EmailFolder } from '../db/models/email.model.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
  hasMore: boolean;
}

// Configurable batch sizes for bulk-friendly processing
const BATCH_SIZE = 50; // Messages to process per batch
const DB_BATCH_SIZE = 20; // Emails to insert in a single DB transaction

/**
 * Start an async sync for an email account
 * Updates progress in the database for UI polling
 */
export async function startAsyncSync(emailAccount: EmailAccount): Promise<boolean> {
  // Check if already syncing - prevent duplicate syncs
  if (emailAccount.isSyncing) {
    console.log(`[IMAP] Sync already in progress for ${emailAccount.email}, skipping`);
    return false;
  }

  // Mark as syncing
  await emailAccount.update({
    isSyncing: true,
    syncProgress: 0,
    syncStatus: 'Starting sync...',
  });

  // Run sync in background
  syncEmailsFromImapAccount(emailAccount)
    .then(async (result) => {
      await emailAccount.update({
        isSyncing: false,
        syncProgress: 100,
        syncStatus: `Synced ${result.synced} emails`,
        lastSyncedAt: new Date(),
      });
      console.log(`[IMAP] Sync complete for ${emailAccount.email}: ${result.synced} synced`);

      // Clear status after 10 seconds
      setTimeout(async () => {
        try {
          await emailAccount.reload();
          if (!emailAccount.isSyncing) {
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
      await emailAccount.update({
        isSyncing: false,
        syncProgress: null,
        syncStatus: `Sync failed: ${errorMsg}`,
      });
      console.error(`[IMAP] Sync failed for ${emailAccount.email}:`, err);

      // Clear error status after 30 seconds
      setTimeout(async () => {
        try {
          await emailAccount.reload();
          if (!emailAccount.isSyncing) {
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
 * Connect to an IMAP server and fetch new emails with memory-efficient streaming
 * Uses pagination to avoid loading all emails into memory at once
 */
export async function syncEmailsFromImapAccount(
  emailAccount: EmailAccount,
): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, skipped: 0, errors: [], hasMore: false };

  const client = new ImapFlow({
    host: emailAccount.host,
    port: emailAccount.port,
    secure: emailAccount.useSsl,
    auth: {
      user: emailAccount.username,
      pass: emailAccount.password,
    },
    logger: false,
  });

  try {
    await emailAccount.update({ syncStatus: 'Connecting to server...' });
    await client.connect();
    console.log(`[IMAP] Connected to ${emailAccount.host}`);

    await emailAccount.update({ syncStatus: 'Opening mailbox...' });
    const mailbox = await client.mailboxOpen('INBOX');
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
        : 'Searching for new messages...' 
    });

    // Use IMAP sequence set for pagination instead of loading all UIDs
    // For full sync, we process in reverse order (newest first) using sequence numbers
    // For incremental sync, we use date-based search
    
    let totalToProcess = 0;
    let processedCount = 0;

    if (isFullSync) {
      // Full sync: process from newest to oldest using sequence numbers
      // This avoids loading all UIDs into memory
      totalToProcess = mailbox.exists;
      
      await emailAccount.update({
        syncStatus: `Processing ${totalToProcess} messages...`,
      });

      // Process in batches from newest (highest seq) to oldest (1)
      for (let start = mailbox.exists; start >= 1; start -= BATCH_SIZE) {
        const end = Math.max(1, start - BATCH_SIZE + 1);
        const seqRange = `${end}:${start}`;
        
        const progress = Math.round(((mailbox.exists - start + 1) / totalToProcess) * 100);
        await emailAccount.update({
          syncProgress: Math.min(99, progress),
          syncStatus: `Processing messages ${end}-${start} of ${totalToProcess}...`,
        });

        const batchResult = await processBatch(
          client,
          emailAccount.id,
          seqRange,
          false, // use sequence numbers, not UIDs
        );

        result.synced += batchResult.synced;
        result.skipped += batchResult.skipped;
        result.errors.push(...batchResult.errors);
        processedCount += batchResult.synced + batchResult.skipped;
      }
    } else {
      // Incremental sync: search for messages since last sync
      const sinceDate = new Date(emailAccount.lastSyncedAt!);
      const searchResult = await client.search({ since: sinceDate });
      const messageUids = searchResult === false ? [] : searchResult;
      
      console.log(`[IMAP] Incremental sync: found ${messageUids.length} messages since ${sinceDate.toISOString()}`);

      if (messageUids.length === 0) {
        await client.logout();
        return result;
      }

      totalToProcess = messageUids.length;

      // Process UIDs in batches
      for (let i = 0; i < messageUids.length; i += BATCH_SIZE) {
        const batchUids = messageUids.slice(i, i + BATCH_SIZE);
        const progress = Math.round((i / totalToProcess) * 100);
        
        await emailAccount.update({
          syncProgress: Math.min(99, progress),
          syncStatus: `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`,
        });

        const batchResult = await processBatchByUids(
          client,
          emailAccount.id,
          batchUids,
        );

        result.synced += batchResult.synced;
        result.skipped += batchResult.skipped;
        result.errors.push(...batchResult.errors);
      }
    }

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
 * Process a batch of messages by sequence range
 * Memory efficient - doesn't load all messages at once
 */
async function processBatch(
  client: ImapFlow,
  emailAccountId: string,
  seqRange: string,
  useUid: boolean,
): Promise<{ synced: number; skipped: number; errors: string[] }> {
  const batchResult = { synced: 0, skipped: 0, errors: [] as string[] };
  const emailsToCreate: Array<Record<string, unknown>> = [];
  const messageIdsInBatch: string[] = [];

  try {
    for await (const message of client.fetch(seqRange, {
      envelope: true,
      source: true,
      uid: true,
    }, { uid: useUid })) {
      try {
        if (!message.source) {
          console.warn(`[IMAP] No source data for message UID ${message.uid}`);
          continue;
        }

        const envelope = message.envelope;
        const envelopeMessageId = envelope?.messageId || `uid-${message.uid}`;
        messageIdsInBatch.push(envelopeMessageId);

        // Parse the message
        const parsed = await simpleParser(message.source);

        // Prepare email data for batch insert
        const emailData = createEmailDataFromParsed(
          emailAccountId,
          envelopeMessageId,
          parsed,
        );

        emailsToCreate.push(emailData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        batchResult.errors.push(`Failed to process message UID ${message.uid}: ${errorMsg}`);
        console.error(`[IMAP] Error processing message:`, err);
      }
    }

    // Check which messages already exist in DB (per-batch query)
    if (messageIdsInBatch.length > 0) {
      const existingEmails = await Email.findAll({
        where: {
          emailAccountId,
          messageId: { [Op.in]: messageIdsInBatch },
        },
        attributes: ['messageId'],
      });
      const existingIds = new Set(existingEmails.map((e) => e.messageId));

      // Filter out existing emails
      const newEmails = emailsToCreate.filter(
        (e) => !existingIds.has(e.messageId as string),
      );
      batchResult.skipped = emailsToCreate.length - newEmails.length;

      // Bulk insert new emails
      if (newEmails.length > 0) {
        for (let j = 0; j < newEmails.length; j += DB_BATCH_SIZE) {
          const dbBatch = newEmails.slice(j, j + DB_BATCH_SIZE);
          try {
            await Email.bulkCreate(dbBatch as any);
            batchResult.synced += dbBatch.length;
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            batchResult.errors.push(`Failed to insert batch: ${errorMsg}`);
            console.error('[IMAP] Batch insert failed:', err);
          }
        }
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    batchResult.errors.push(`Failed to fetch messages: ${errorMsg}`);
    console.error('[IMAP] Fetch failed:', err);
  }

  return batchResult;
}

/**
 * Process a batch of messages by UIDs
 */
async function processBatchByUids(
  client: ImapFlow,
  emailAccountId: string,
  uids: number[],
): Promise<{ synced: number; skipped: number; errors: string[] }> {
  const batchResult = { synced: 0, skipped: 0, errors: [] as string[] };
  const emailsToCreate: Array<Record<string, unknown>> = [];
  const messageIdsInBatch: string[] = [];

  try {
    for await (const message of client.fetch(uids, {
      envelope: true,
      source: true,
      uid: true,
    })) {
      try {
        if (!message.source) {
          console.warn(`[IMAP] No source data for message UID ${message.uid}`);
          continue;
        }

        const envelope = message.envelope;
        const envelopeMessageId = envelope?.messageId || `uid-${message.uid}`;
        messageIdsInBatch.push(envelopeMessageId);

        // Parse the message
        const parsed = await simpleParser(message.source);

        // Prepare email data for batch insert
        const emailData = createEmailDataFromParsed(
          emailAccountId,
          envelopeMessageId,
          parsed,
        );

        emailsToCreate.push(emailData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        batchResult.errors.push(`Failed to process message UID ${message.uid}: ${errorMsg}`);
        console.error(`[IMAP] Error processing message:`, err);
      }
    }

    // Check which messages already exist in DB (per-batch query)
    if (messageIdsInBatch.length > 0) {
      const existingEmails = await Email.findAll({
        where: {
          emailAccountId,
          messageId: { [Op.in]: messageIdsInBatch },
        },
        attributes: ['messageId'],
      });
      const existingIds = new Set(existingEmails.map((e) => e.messageId));

      // Filter out existing emails
      const newEmails = emailsToCreate.filter(
        (e) => !existingIds.has(e.messageId as string),
      );
      batchResult.skipped = emailsToCreate.length - newEmails.length;

      // Bulk insert new emails
      if (newEmails.length > 0) {
        for (let j = 0; j < newEmails.length; j += DB_BATCH_SIZE) {
          const dbBatch = newEmails.slice(j, j + DB_BATCH_SIZE);
          try {
            await Email.bulkCreate(dbBatch as any);
            batchResult.synced += dbBatch.length;
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            batchResult.errors.push(`Failed to insert batch: ${errorMsg}`);
            console.error('[IMAP] Batch insert failed:', err);
          }
        }
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    batchResult.errors.push(`Failed to fetch messages: ${errorMsg}`);
    console.error('[IMAP] Fetch failed:', err);
  }

  return batchResult;
}

/**
 * Create email data object from parsed mail
 */
function createEmailDataFromParsed(
  emailAccountId: string,
  messageId: string,
  parsed: ParsedMail,
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

  const finalMessageId = parsed.messageId || messageId || `generated-${uuidv4()}`;

  return {
    emailAccountId,
    messageId: finalMessageId,
    folder: EmailFolder.INBOX,
    fromAddress,
    fromName,
    toAddresses: toAddresses.length > 0 ? toAddresses : [fromAddress],
    ccAddresses: ccAddresses && ccAddresses.length > 0 ? ccAddresses : null,
    bccAddresses: null,
    subject: parsed.subject || '(No Subject)',
    textBody: parsed.text || null,
    htmlBody: parsed.html || null,
    receivedAt: parsed.date || new Date(),
    isRead: false,
    isStarred: false,
    inReplyTo: parsed.inReplyTo || null,
    references: parsed.references
      ? Array.isArray(parsed.references)
        ? parsed.references
        : [parsed.references]
      : null,
    isDraft: false,
  };
}

/**
 * Test IMAP connection
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
    await client.connect();
    await client.logout();
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * List mailboxes for an account
 */
export async function listImapMailboxes(
  emailAccount: EmailAccount,
): Promise<string[]> {
  const client = new ImapFlow({
    host: emailAccount.host,
    port: emailAccount.port,
    secure: emailAccount.useSsl,
    auth: {
      user: emailAccount.username,
      pass: emailAccount.password,
    },
    logger: false,
  });

  try {
    await client.connect();
    const mailboxes = await client.list();
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
