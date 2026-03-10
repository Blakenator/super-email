import type { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { EmailAccount, Email, EmailFolder } from '../db/models/index.js';
import { EmailAccountType } from '../db/models/email-account.model.js';
import { ImapAccountSettings } from '../db/models/imap-account-settings.model.js';
import { logger } from './logger.js';
import { applyRulesToEmail } from './rule-matcher.js';
import { sendNewEmailNotifications } from './push-notifications.js';
import { createImapClient } from './imap-client.js';
import { createEmailDataFromParsed } from './email-parser.js';

// Connection timeout - 4.5 minutes (server will close, client should reconnect)
const CONNECTION_TIMEOUT_MS = 4.5 * 60 * 1000;

// Map to store active IDLE connections per user
const userIdleConnections = new Map<
  string,
  {
    connections: Map<string, ImapFlow>;
    timeout: NodeJS.Timeout;
    onUpdate: (update: MailboxUpdateEvent) => void;
    activeSyncs: Set<string>;
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
  if (userIdleConnections.has(userId)) {
    logger.info('IMAP-IDLE', `User ${userId} already has active IDLE connections`);
    return;
  }

  logger.info('IMAP-IDLE', `Starting IDLE connections for user ${userId}`);

  const accounts = await EmailAccount.findAll({
    where: { userId, type: EmailAccountType.IMAP },
    include: [{ model: ImapAccountSettings, as: 'imapSettings', required: true }],
  });

  if (accounts.length === 0) {
    logger.info('IMAP-IDLE', `No email accounts found for user ${userId}`);
    return;
  }

  const connections = new Map<string, ImapFlow>();

  const timeout = setTimeout(() => {
    logger.info('IMAP-IDLE', `Connection timeout for user ${userId}, closing all connections`);
    stopIdleForUser(userId);
    onUpdate({
      type: 'CONNECTION_CLOSED',
      emailAccountId: 'all',
      message: 'Connection timeout - please reconnect',
    });
  }, CONNECTION_TIMEOUT_MS);

  userIdleConnections.set(userId, { connections, timeout, onUpdate, activeSyncs: new Set() });

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

  const client = await createImapClient(account.imapSettings!);

  client.on('mailboxOpen', (mailbox: any) => {
    logger.info('IMAP-IDLE', `[${account.email}] Mailbox opened: ${mailbox.path}, ${mailbox.exists} messages`);
  });

  client.on('exists', async (data: { path: string; count: number; prevCount: number }) => {
    logger.info('IMAP-IDLE', `[${account.email}] EXISTS event received: path=${data.path}, count=${data.count}, prevCount=${data.prevCount}`);
    const newCount = data.count - data.prevCount;
    if (newCount > 0) {
      logger.info('IMAP-IDLE', `[${account.email}] New mail detected: ${newCount} new message(s)`);
      
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
        const startSeq = data.prevCount + 1;
        const endSeq = data.count;
        const seqRange = `${startSeq}:${endSeq}`;
        
        logger.info('IMAP-IDLE', `[${account.email}] Fetching messages ${seqRange}`);
        
        const savedEmails: Email[] = [];
        
        for await (const message of client.fetch(seqRange, {
          envelope: true,
          source: true,
          uid: true,
          internalDate: true,
          flags: true,
        })) {
          try {
            if (!message.source) {
              logger.error('IMAP-IDLE', `[${account.email}] No source for message`);
              continue;
            }
            
            const parsed = await simpleParser(message.source);
            const envelopeMessageId = message.envelope?.messageId || `uid-${message.uid}`;
            
            // Check if email already exists
            const finalMessageId = parsed.messageId || envelopeMessageId;
            const existingEmail = await Email.findOne({
              where: {
                emailAccountId: account.id,
                messageId: finalMessageId,
              },
            });
            
            if (existingEmail) {
              logger.info('IMAP-IDLE', `[${account.email}] Email already exists: ${parsed.subject || '(No Subject)'}`);
              continue;
            }
            
            const emailData = createEmailDataFromParsed(
              account.id,
              envelopeMessageId,
              parsed,
              EmailFolder.INBOX,
              message,
            );
            
            const newEmail = await Email.create(emailData as any);
            
            const verified = await Email.findByPk(newEmail.id);
            if (!verified) {
              logger.error('IMAP-IDLE', `[${account.email}] Email save verification failed for: ${parsed.subject || '(No Subject)'}`);
              continue;
            }
            
            logger.info('IMAP-IDLE', `[${account.email}] Saved new email (id=${newEmail.id}): ${parsed.subject || '(No Subject)'}`);
            
            try {
              await applyRulesToEmail(newEmail, userId);
            } catch (ruleError: any) {
              logger.error('IMAP-IDLE', `[${account.email}] Error applying rules: ${ruleError.message}`);
            }
            
            const reloadedEmail = await Email.findByPk(newEmail.id);
            if (reloadedEmail && reloadedEmail.folder === EmailFolder.INBOX) {
              savedEmails.push(reloadedEmail);
            } else {
              logger.info('IMAP-IDLE', `[${account.email}] Email moved by rules, not in inbox: ${parsed.subject || '(No Subject)'}`);
            }
          } catch (parseError: any) {
            logger.error('IMAP-IDLE', `[${account.email}] Error parsing message: ${parseError.message}`);
          }
        }
        
        logger.info('IMAP-IDLE', `[${account.email}] Saved ${savedEmails.length} new email(s) to inbox`);

        if (savedEmails.length > 0) {
          try {
            await sendNewEmailNotifications(userId, savedEmails, account.email);
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
        const currentState = userIdleConnections.get(userId);
        if (currentState) {
          currentState.activeSyncs.delete(syncId);
        }
      }
    }
  });

  client.on('close', () => {
    logger.info('IMAP-IDLE', `IDLE connection closed for ${account.email}`);
    userConnections.connections.delete(account.id);
  });

  client.on('error', (err: Error) => {
    logger.error('IMAP-IDLE', `IDLE error for ${account.email}: ${err.message}`);
    onUpdate({
      type: 'ERROR',
      emailAccountId: account.id,
      message: `Connection error: ${err.message}`,
    });
  });

  try {
    logger.info('IMAP-IDLE', `[${account.email}] Connecting to IMAP server...`);
    await client.connect();
    logger.info('IMAP-IDLE', `[${account.email}] Connected, opening INBOX...`);
    const mailbox = await client.mailboxOpen('INBOX');
    logger.info('IMAP-IDLE', `[${account.email}] INBOX opened with ${mailbox.exists} messages`);
    
    userConnections.connections.set(account.id, client);
    
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

  clearTimeout(userConnections.timeout);

  const maxWait = 10000;
  const startTime = Date.now();
  while (userConnections.activeSyncs.size > 0 && Date.now() - startTime < maxWait) {
    logger.info('IMAP-IDLE', `Waiting for ${userConnections.activeSyncs.size} active sync(s) to complete...`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (userConnections.activeSyncs.size > 0) {
    logger.warn('IMAP-IDLE', `Forcing cleanup with ${userConnections.activeSyncs.size} active sync(s) still running`);
  }

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

export function hasActiveIdleConnections(userId: string): boolean {
  return userIdleConnections.has(userId);
}

export function getActiveConnectionCount(userId: string): number {
  const userConnections = userIdleConnections.get(userId);
  return userConnections?.connections.size ?? 0;
}
