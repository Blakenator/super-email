import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail, type Headers } from 'mailparser';
import { EmailAccount } from '../db/models/email-account.model.js';
import { Email, EmailFolder } from '../db/models/email.model.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
  cancelled: boolean;
}

// Larger batch sizes for faster imports
const BATCH_SIZE = 200; // Messages to fetch from IMAP per batch
const DB_BATCH_SIZE = 50; // Emails to insert in a single DB transaction

/**
 * Start an async sync for an email account
 * Uses syncId to prevent overlapping syncs and allow cancellation
 */
export async function startAsyncSync(
  emailAccount: EmailAccount,
): Promise<boolean> {
  // Reload to get latest sync state
  await emailAccount.reload();

  // Check if already syncing
  if (emailAccount.syncId) {
    console.log(
      `[IMAP] Sync already in progress for ${emailAccount.email} (syncId: ${emailAccount.syncId}), skipping`,
    );
    return false;
  }

  // Generate unique sync ID
  const syncId = uuidv4();

  // Mark as syncing with our sync ID
  await emailAccount.update({
    syncId,
    syncProgress: 0,
    syncStatus: 'Starting sync...',
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

        const batchResult = await processBatch(
          client,
          emailAccount.id,
          seqRange,
          false,
          EmailFolder.INBOX,
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
      const searchResult = await client.search({ since: sinceDate });
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

        const batchResult = await processBatchByUids(
          client,
          emailAccount.id,
          batchUids,
          EmailFolder.INBOX,
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
      sentMailbox = await client.mailboxOpen(folderName);
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
    const searchResult = await client.search({ since: sinceDate });
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
 * Process a batch of messages by sequence range
 */
async function processBatch(
  client: ImapFlow,
  emailAccountId: string,
  seqRange: string,
  useUid: boolean,
  folder: EmailFolder = EmailFolder.INBOX,
): Promise<{ synced: number; skipped: number; errors: string[] }> {
  const batchResult = { synced: 0, skipped: 0, errors: [] as string[] };
  const emailsToCreate: Array<Record<string, unknown>> = [];
  const messageIdsInBatch: string[] = [];

  try {
    for await (const message of client.fetch(
      seqRange,
      {
        envelope: true,
        source: true,
        uid: true,
        internalDate: true, // IMAP INTERNALDATE - when server received the email
      },
      { uid: useUid },
    )) {
      try {
        if (!message.source) {
          console.warn(`[IMAP] No source data for message UID ${message.uid}`);
          continue;
        }

        const envelope = message.envelope;
        const envelopeMessageId = envelope?.messageId || `uid-${message.uid}`;
        messageIdsInBatch.push(envelopeMessageId);

        // Parse the message (includes headers)
        const parsed = await simpleParser(message.source);

        // Use IMAP internalDate (when server received email) as receivedAt
        // Fall back to parsed.date (Date header) or envelope.date, then current date
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
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        batchResult.errors.push(
          `Failed to process message UID ${message.uid}: ${errorMsg}`,
        );
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
            const errorMsg =
              err instanceof Error ? err.message : 'Unknown error';
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
  folder: EmailFolder = EmailFolder.INBOX,
): Promise<{ synced: number; skipped: number; errors: string[] }> {
  const batchResult = { synced: 0, skipped: 0, errors: [] as string[] };
  const emailsToCreate: Array<Record<string, unknown>> = [];
  const messageIdsInBatch: string[] = [];

  try {
    for await (const message of client.fetch(uids, {
      envelope: true,
      source: true,
      uid: true,
      internalDate: true, // IMAP INTERNALDATE - when server received the email
    })) {
      try {
        if (!message.source) {
          console.warn(`[IMAP] No source data for message UID ${message.uid}`);
          continue;
        }

        const envelope = message.envelope;
        const envelopeMessageId = envelope?.messageId || `uid-${message.uid}`;
        messageIdsInBatch.push(envelopeMessageId);

        // Parse the message (includes headers)
        const parsed = await simpleParser(message.source);

        // Use IMAP internalDate (when server received email) as receivedAt
        // Fall back to parsed.date (Date header) or envelope.date, then current date
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
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        batchResult.errors.push(
          `Failed to process message UID ${message.uid}: ${errorMsg}`,
        );
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
            const errorMsg =
              err instanceof Error ? err.message : 'Unknown error';
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
  console.log({
    listUnsubscribeRaw,
    listHeaderRaw,
    result,
    unsub: (listHeaderRaw as any).unsubscribe,
    url: (listHeaderRaw as any).unsubscribe?.url,
    mail: (listHeaderRaw as any).unsubscribe?.mail,
  });

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
