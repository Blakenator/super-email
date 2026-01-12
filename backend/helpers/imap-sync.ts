import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';
import { EmailAccount } from '../db/models/email-account.model.js';
import { Email, EmailFolder } from '../db/models/email.model.js';
import { v4 as uuidv4 } from 'uuid';

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
 * Connect to an IMAP server and fetch new emails with bulk-friendly processing
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
    let allMessages: number[];

    await emailAccount.update({ 
      syncStatus: isFullSync 
        ? 'Fetching all messages (first sync)...' 
        : 'Searching for new messages...' 
    });

    if (isFullSync) {
      // Full history sync - get all message UIDs
      const searchResult = await client.search({ all: true });
      allMessages = searchResult === false ? [] : searchResult;
      console.log(`[IMAP] Full sync: found ${allMessages.length} messages total`);
    } else {
      // Incremental sync - only get messages since last sync
      const sinceDate = new Date(emailAccount.lastSyncedAt!);
      const searchResult = await client.search({ since: sinceDate });
      allMessages = searchResult === false ? [] : searchResult;
      console.log(`[IMAP] Incremental sync: found ${allMessages.length} messages since ${sinceDate.toISOString()}`);
    }

    if (allMessages.length === 0) {
      await client.logout();
      return result;
    }

    // Process all messages (no limit)
    const messagesToProcess = allMessages;

    await emailAccount.update({
      syncStatus: `Found ${messagesToProcess.length} messages to process...`,
    });

    // Get existing message IDs in one query to avoid N+1
    const existingEmails = await Email.findAll({
      where: {
        emailAccountId: emailAccount.id,
        folder: EmailFolder.INBOX,
      },
      attributes: ['messageId'],
    });
    const existingMessageIds = new Set(existingEmails.map((e) => e.messageId));

    // Process messages in batches
    const totalBatches = Math.ceil(messagesToProcess.length / BATCH_SIZE);

    for (let i = 0; i < messagesToProcess.length; i += BATCH_SIZE) {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const progress = Math.round((i / messagesToProcess.length) * 100);

      await emailAccount.update({
        syncProgress: progress,
        syncStatus: `Processing batch ${batchNum}/${totalBatches}...`,
      });

      const batchMessages = messagesToProcess.slice(i, i + BATCH_SIZE);
      const emailsToCreate: Array<Record<string, unknown>> = [];

      for await (const message of client.fetch(batchMessages, {
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

          // Skip if we already have this message (using in-memory set)
          if (existingMessageIds.has(envelopeMessageId)) {
            result.skipped++;
            continue;
          }

          // Parse the message
          const parsed = await simpleParser(message.source);

          // Prepare email data for batch insert
          const emailData = createEmailDataFromParsed(
            emailAccount.id,
            envelopeMessageId,
            parsed,
          );

          emailsToCreate.push(emailData);
          existingMessageIds.add(envelopeMessageId); // Prevent duplicates in same sync
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          result.errors.push(`Failed to process message UID ${message.uid}: ${errorMsg}`);
          console.error(`[IMAP] Error processing message:`, err);
        }
      }

      // Bulk insert emails in sub-batches for better DB performance
      if (emailsToCreate.length > 0) {
        for (let j = 0; j < emailsToCreate.length; j += DB_BATCH_SIZE) {
          const dbBatch = emailsToCreate.slice(j, j + DB_BATCH_SIZE);
          try {
            await Email.bulkCreate(dbBatch as any);
            result.synced += dbBatch.length;
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            result.errors.push(`Failed to insert batch: ${errorMsg}`);
            console.error('[IMAP] Batch insert failed:', err);
          }
        }
      }

      console.log(
        `[IMAP] Batch ${batchNum}/${totalBatches}: ${result.synced} synced, ${result.skipped} skipped`,
      );
    }

    await client.logout();
    console.log(
      `[IMAP] Sync complete: ${result.synced} emails synced, ${result.skipped} skipped${result.hasMore ? ' (more available)' : ''}`,
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
 * Create email data object from parsed mail (without DB insert)
 */
function createEmailDataFromParsed(
  emailAccountId: string,
  envelopeMessageId: string | undefined,
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

  const messageId = parsed.messageId || envelopeMessageId || `generated-${uuidv4()}`;

  return {
    id: uuidv4(),
    emailAccountId,
    messageId,
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
    isDraft: false,
    inReplyTo: parsed.inReplyTo || null,
    references: parsed.references
      ? Array.isArray(parsed.references)
        ? parsed.references
        : [parsed.references]
      : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Get available mailboxes/folders from an IMAP account
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
    console.error('[IMAP] Failed to list mailboxes:', err);
    try {
      await client.logout();
    } catch {
      // Ignore
    }
    throw err;
  }
}

/**
 * Test IMAP connection credentials
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
