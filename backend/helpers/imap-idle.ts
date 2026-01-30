import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { EmailAccount, Email, EmailFolder } from '../db/models/index.js';
import { logger } from './logger.js';
import { applyRulesToEmail } from './rule-matcher.js';
import { getImapCredentials } from './secrets.js';
import { sendNewEmailNotification } from './push-notifications.js';

// Connection timeout - 4.5 minutes (server will close, client should reconnect)
const CONNECTION_TIMEOUT_MS = 4.5 * 60 * 1000;

// Map to store active IDLE connections per user
const userIdleConnections = new Map<
  string,
  {
    connections: Map<string, ImapFlow>;
    timeout: NodeJS.Timeout;
    onUpdate: (update: MailboxUpdateEvent) => void;
    activeSyncs: Set<string>; // Track in-progress sync operations
  }
>();

export interface MailboxUpdateEvent {
  type:
    | 'NEW_EMAILS'
    | 'EMAIL_UPDATED'
    | 'EMAIL_DELETED'
    | 'SYNC_STARTED'
    | 'SYNC_COMPLETED'
    | 'CONNECTION_ESTABLISHED'
    | 'CONNECTION_CLOSED'
    | 'ERROR';
  emailAccountId: string;
  emails?: Email[];
  message?: string;
}

/**
 * Start IDLE connections for all of a user's email accounts
 */
export async function startIdleForUser(
  userId: string,
  onUpdate: (update: MailboxUpdateEvent) => void,
): Promise<void> {
  // Check if user already has active connections
  if (userIdleConnections.has(userId)) {
    logger.info('IMAP-IDLE', `User ${userId} already has active IDLE connections`);
    return;
  }

  logger.info('IMAP-IDLE', `Starting IDLE connections for user ${userId}`);

  // Get all email accounts for the user
  const accounts = await EmailAccount.findAll({
    where: { userId },
  });

  if (accounts.length === 0) {
    logger.info('IMAP-IDLE', `No email accounts found for user ${userId}`);
    return;
  }

  const connections = new Map<string, ImapFlow>();

  // Set up connection timeout
  const timeout = setTimeout(() => {
    logger.info('IMAP-IDLE', `Connection timeout for user ${userId}, closing all connections`);
    stopIdleForUser(userId);
    onUpdate({
      type: 'CONNECTION_CLOSED',
      emailAccountId: 'all',
      message: 'Connection timeout - please reconnect',
    });
  }, CONNECTION_TIMEOUT_MS);

  // Store the connection set
  userIdleConnections.set(userId, { connections, timeout, onUpdate, activeSyncs: new Set() });

  // Start IDLE for each account
  for (const account of accounts) {
    try {
      await startIdleForAccount(userId, account, onUpdate);
    } catch (error: any) {
      logger.error('IMAP-IDLE', `Failed to start IDLE for account ${account.email}: ${error.message}`);
      onUpdate({
        type: 'ERROR',
        emailAccountId: account.id,
        message: `Failed to connect to ${account.email}: ${error.message}`,
      });
    }
  }

  // Notify client that connections are established
  onUpdate({
    type: 'CONNECTION_ESTABLISHED',
    emailAccountId: 'all',
    message: `Connected to ${connections.size} account(s)`,
  });
}

/**
 * Start IDLE for a specific email account
 */
async function startIdleForAccount(
  userId: string,
  account: EmailAccount,
  onUpdate: (update: MailboxUpdateEvent) => void,
): Promise<void> {
  const userConnections = userIdleConnections.get(userId);
  if (!userConnections) return;

  // Get credentials from secure store, fall back to DB during migration
  const credentials = await getImapCredentials(account.id);
  const username = credentials?.username || account.username;
  const password = credentials?.password || account.password;

  const client = new ImapFlow({
    host: account.host,
    port: account.port,
    secure: account.useSsl,
    auth: {
      user: username,
      pass: password,
    },
    logger: false,
  });

  // Handle mailbox events - this catches any changes to the mailbox
  client.on('mailboxOpen', (mailbox: any) => {
    logger.info('IMAP-IDLE', `[${account.email}] Mailbox opened: ${mailbox.path}, ${mailbox.exists} messages`);
  });

  // Handle new mail events
  client.on('exists', async (data: { path: string; count: number; prevCount: number }) => {
    logger.info('IMAP-IDLE', `[${account.email}] EXISTS event received: path=${data.path}, count=${data.count}, prevCount=${data.prevCount}`);
    const newCount = data.count - data.prevCount;
    if (newCount > 0) {
      logger.info('IMAP-IDLE', `[${account.email}] New mail detected: ${newCount} new message(s)`);
      
      // Track this sync operation to prevent cleanup during operation
      const syncId = `${account.id}-${Date.now()}`;
      const userConnState = userIdleConnections.get(userId);
      if (userConnState) {
        userConnState.activeSyncs.add(syncId);
      }
      
      onUpdate({
        type: 'SYNC_STARTED',
        emailAccountId: account.id,
        message: `Syncing ${newCount} new email(s)...`,
      });

      try {
        // Fetch the new emails directly using this connection
        // Calculate sequence range for new messages
        const startSeq = data.prevCount + 1;
        const endSeq = data.count;
        const seqRange = `${startSeq}:${endSeq}`;
        
        logger.info('IMAP-IDLE', `[${account.email}] Fetching messages ${seqRange}`);
        
        const savedEmails: Email[] = [];
        
        // Fetch messages using sequence numbers (not UIDs since we know the sequence)
        for await (const message of client.fetch(seqRange, {
          envelope: true,
          source: true,
          uid: true,
        })) {
          try {
            if (!message.source) {
              logger.error('IMAP-IDLE', `[${account.email}] No source for message`);
              continue;
            }
            
            const parsed = await simpleParser(message.source);
            
            const messageId = parsed.messageId || `${message.uid}@${account.host}`;
            const subject = parsed.subject || '(No Subject)';
            
            // Check if email already exists
            const existingEmail = await Email.findOne({
              where: {
                emailAccountId: account.id,
                messageId,
              },
            });
            
            if (existingEmail) {
              logger.info('IMAP-IDLE', `[${account.email}] Email already exists: ${subject}`);
              continue;
            }
            
            // Helper to extract addresses from AddressObject or AddressObject[]
            const getAddresses = (addrObj: any): string[] => {
              if (!addrObj) return [];
              const values = Array.isArray(addrObj) ? addrObj.flatMap((a: any) => a.value || []) : (addrObj.value || []);
              return values.map((a: any) => a.address).filter(Boolean);
            };
            
            const fromAddrs = getAddresses(parsed.from);
            const toAddrs = getAddresses(parsed.to);
            const ccAddrs = getAddresses(parsed.cc);
            const bccAddrs = getAddresses(parsed.bcc);
            
            // Create the email record
            const emailData = {
              emailAccountId: account.id,
              messageId,
              folder: EmailFolder.INBOX,
              fromAddress: fromAddrs[0] || '',
              fromName: (Array.isArray(parsed.from) ? parsed.from[0]?.value?.[0]?.name : parsed.from?.value?.[0]?.name) || null,
              toAddresses: toAddrs,
              ccAddresses: ccAddrs,
              bccAddresses: bccAddrs,
              subject,
              textBody: parsed.text || null,
              htmlBody: typeof parsed.html === 'string' ? parsed.html : null,
              receivedAt: parsed.date || new Date(),
              isRead: false,
              isStarred: false,
              inReplyTo: parsed.inReplyTo || null,
              threadId: parsed.references?.[0] || parsed.inReplyTo || messageId || null,
            };
            
            const newEmail = await Email.create(emailData);
            
            // Verify the email was actually saved
            const verified = await Email.findByPk(newEmail.id);
            if (!verified) {
              logger.error('IMAP-IDLE', `[${account.email}] Email save verification failed for: ${subject}`);
              continue;
            }
            
            logger.info('IMAP-IDLE', `[${account.email}] Saved new email (id=${newEmail.id}): ${subject}`);
            
            // Apply mail rules
            try {
              await applyRulesToEmail(newEmail, userId);
            } catch (ruleError: any) {
              logger.error('IMAP-IDLE', `[${account.email}] Error applying rules: ${ruleError.message}`);
            }
            
            // Reload the email to check if it's still in INBOX after rules
            const reloadedEmail = await Email.findByPk(newEmail.id);
            if (reloadedEmail && reloadedEmail.folder === EmailFolder.INBOX) {
              savedEmails.push(reloadedEmail);
            } else {
              logger.info('IMAP-IDLE', `[${account.email}] Email moved by rules, not in inbox: ${subject}`);
            }
          } catch (parseError: any) {
            logger.error('IMAP-IDLE', `[${account.email}] Error parsing message: ${parseError.message}`);
          }
        }
        
        logger.info('IMAP-IDLE', `[${account.email}] Saved ${savedEmails.length} new email(s) to inbox`);

        if (savedEmails.length > 0) {
          // Send push notification for new inbox emails
          try {
            const latestEmail = savedEmails[0];
            await sendNewEmailNotification(
              userId,
              savedEmails.length,
              account.email,
              latestEmail.subject ?? undefined,
              latestEmail.fromName ?? latestEmail.fromAddress ?? undefined,
              latestEmail.htmlBody ?? undefined,
              latestEmail.textBody ?? undefined,
            );
          } catch (pushError: any) {
            logger.error('IMAP-IDLE', `[${account.email}] Failed to send push notification: ${pushError.message}`);
          }

          onUpdate({
            type: 'NEW_EMAILS',
            emailAccountId: account.id,
            emails: savedEmails,
            message: `${savedEmails.length} new email(s) received`,
          });
        } else {
          onUpdate({
            type: 'SYNC_COMPLETED',
            emailAccountId: account.id,
            message: 'No new emails to sync',
          });
        }
      } catch (error: any) {
        logger.error('IMAP-IDLE', `[${account.email}] Failed to sync new emails: ${error.message}`);
        onUpdate({
          type: 'ERROR',
          emailAccountId: account.id,
          message: `Sync failed: ${error.message}`,
        });
      } finally {
        // Remove sync from active set
        const currentState = userIdleConnections.get(userId);
        if (currentState) {
          currentState.activeSyncs.delete(syncId);
        }
      }
    }
  });

  // Handle connection close
  client.on('close', () => {
    logger.info('IMAP-IDLE', `IDLE connection closed for ${account.email}`);
    userConnections.connections.delete(account.id);
  });

  // Handle errors
  client.on('error', (err: Error) => {
    logger.error('IMAP-IDLE', `IDLE error for ${account.email}: ${err.message}`);
    onUpdate({
      type: 'ERROR',
      emailAccountId: account.id,
      message: `Connection error: ${err.message}`,
    });
  });

  try {
    // Connect and start IDLE
    logger.info('IMAP-IDLE', `[${account.email}] Connecting to IMAP server...`);
    await client.connect();
    logger.info('IMAP-IDLE', `[${account.email}] Connected, opening INBOX...`);
    const mailbox = await client.mailboxOpen('INBOX');
    logger.info('IMAP-IDLE', `[${account.email}] INBOX opened with ${mailbox.exists} messages`);
    
    userConnections.connections.set(account.id, client);
    
    // Start IDLE in background - this keeps the connection open and listens for changes
    // The connection will notify us via the 'exists' event when new mail arrives
    // Note: idle() returns a promise that resolves when IDLE ends, so we don't await it
    logger.info('IMAP-IDLE', `[${account.email}] Starting IDLE mode...`);
    client.idle().then(() => {
      logger.info('IMAP-IDLE', `[${account.email}] IDLE mode ended normally`);
    }).catch((err: Error) => {
      logger.error('IMAP-IDLE', `[${account.email}] IDLE mode error: ${err.message}`);
    });
    
    logger.info('IMAP-IDLE', `[${account.email}] IDLE started successfully`);
  } catch (error: any) {
    logger.error('IMAP-IDLE', `[${account.email}] Failed to connect/idle: ${error.message}`);
    throw error;
  }
}

/**
 * Stop all IDLE connections for a user
 */
export async function stopIdleForUser(userId: string): Promise<void> {
  const userConnections = userIdleConnections.get(userId);
  if (!userConnections) return;

  logger.info('IMAP-IDLE', `Stopping IDLE connections for user ${userId}`);

  // Clear the timeout
  clearTimeout(userConnections.timeout);

  // Wait for any active syncs to complete (max 10 seconds)
  const maxWait = 10000;
  const startTime = Date.now();
  while (userConnections.activeSyncs.size > 0 && Date.now() - startTime < maxWait) {
    logger.info('IMAP-IDLE', `Waiting for ${userConnections.activeSyncs.size} active sync(s) to complete...`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (userConnections.activeSyncs.size > 0) {
    logger.warn('IMAP-IDLE', `Forcing cleanup with ${userConnections.activeSyncs.size} active sync(s) still running`);
  }

  // Close all connections
  for (const [accountId, client] of userConnections.connections) {
    try {
      await client.logout();
    } catch (error: any) {
      logger.error('IMAP-IDLE', `Error closing connection for account ${accountId}: ${error.message}`);
    }
  }

  userConnections.connections.clear();
  userIdleConnections.delete(userId);

  logger.info('IMAP-IDLE', `All IDLE connections closed for user ${userId}`);
}

/**
 * Check if a user has active IDLE connections
 */
export function hasActiveIdleConnections(userId: string): boolean {
  return userIdleConnections.has(userId);
}

/**
 * Get the number of active connections for a user
 */
export function getActiveConnectionCount(userId: string): number {
  const userConnections = userIdleConnections.get(userId);
  return userConnections?.connections.size ?? 0;
}
