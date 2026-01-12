import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';
import { EmailAccount } from '../db/models/email-account.model.js';
import { Email, EmailFolder } from '../db/models/email.model.js';
import { v4 as uuidv4 } from 'uuid';

export interface SyncResult {
  synced: number;
  errors: string[];
}

/**
 * Connect to an IMAP server and fetch new emails
 */
export async function syncEmailsFromImapAccount(
  emailAccount: EmailAccount,
): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, errors: [] };

  const client = new ImapFlow({
    host: emailAccount.host,
    port: emailAccount.port,
    secure: emailAccount.useSsl,
    auth: {
      user: emailAccount.username,
      pass: emailAccount.password,
    },
    logger: false, // Disable verbose logging
  });

  try {
    // Connect to the server
    await client.connect();
    console.log(`Connected to IMAP server: ${emailAccount.host}`);

    // Select INBOX
    const mailbox = await client.mailboxOpen('INBOX');
    console.log(`Mailbox opened: ${mailbox.exists} messages total`);

    if (mailbox.exists === 0) {
      await client.logout();
      return result;
    }

    // Get the last synced date or default to 30 days ago
    const sinceDate = emailAccount.lastSyncedAt
      ? new Date(emailAccount.lastSyncedAt)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Search for messages since last sync
    const searchResult = await client.search({
      since: sinceDate,
    });

    // Handle case where search returns false (no results)
    const messages = searchResult === false ? [] : searchResult;

    console.log(`Found ${messages.length} messages since ${sinceDate.toISOString()}`);

    if (messages.length === 0) {
      await client.logout();
      return result;
    }

    // Fetch messages (limit to 100 at a time to avoid memory issues)
    const messagesToFetch = messages.slice(0, 100);

    for await (const message of client.fetch(messagesToFetch, {
      envelope: true,
      source: true,
      uid: true,
    })) {
      try {
        // Skip if no source data
        if (!message.source) {
          console.warn(`No source data for message UID ${message.uid}`);
          continue;
        }

        const envelope = message.envelope;
        const envelopeMessageId = envelope?.messageId || `uid-${message.uid}`;

        // Check if we already have this message
        const existingEmail = await Email.findOne({
          where: {
            emailAccountId: emailAccount.id,
            messageId: envelopeMessageId,
          },
        });

        if (existingEmail) {
          continue; // Skip already synced emails
        }

        // Parse the full message
        const parsed = await simpleParser(message.source);

        // Create email record
        await createEmailFromParsed(emailAccount.id, envelopeMessageId, parsed);
        result.synced++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push(`Failed to process message UID ${message.uid}: ${errorMsg}`);
        console.error(`Error processing message:`, err);
      }
    }

    await client.logout();
    console.log(`Sync complete: ${result.synced} emails synced`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(`IMAP connection error: ${errorMsg}`);
    console.error(`IMAP sync error for ${emailAccount.email}:`, err);

    try {
      await client.logout();
    } catch {
      // Ignore logout errors
    }
  }

  return result;
}

/**
 * Create an Email record from parsed mail data
 */
async function createEmailFromParsed(
  emailAccountId: string,
  envelopeMessageId: string | undefined,
  parsed: ParsedMail,
): Promise<Email> {
  // Extract from address
  const fromAddress = parsed.from?.value?.[0]?.address || 'unknown@unknown.com';
  const fromName = parsed.from?.value?.[0]?.name || null;

  // Extract to addresses
  const toAddresses = parsed.to
    ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
        .flatMap((addr) => addr.value.map((v) => v.address || ''))
        .filter(Boolean)
    : [];

  // Extract CC addresses
  const ccAddresses = parsed.cc
    ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc])
        .flatMap((addr) => addr.value.map((v) => v.address || ''))
        .filter(Boolean)
    : null;

  // Generate a message ID if not present
  const messageId = parsed.messageId || envelopeMessageId || `generated-${uuidv4()}`;

  const email = await Email.create({
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
    inReplyTo: parsed.inReplyTo || null,
    references: parsed.references
      ? Array.isArray(parsed.references)
        ? parsed.references
        : [parsed.references]
      : null,
  });

  return email;
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
    console.error('Failed to list mailboxes:', err);
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
