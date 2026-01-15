import nodemailer from 'nodemailer';
import type { SmtpProfile } from '../db/models/smtp-profile.model.js';
import {
  EmailAccount,
  EmailAccountType,
} from '../db/models/email-account.model.js';
import {
  syncEmailsFromImapAccount,
  startAsyncSync,
  type SyncResult,
} from './imap-sync.js';
import { getSmtpCredentials } from './secrets.js';
import { config } from '../config/env.js';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendEmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  inReplyTo?: string;
  references?: string[];
  attachments?: EmailAttachment[];
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

/**
 * Create a nodemailer transporter with correct SSL/TLS settings
 * - Port 465: Use immediate TLS (secure: true)
 * - Port 587/25: Use STARTTLS (secure: false)
 */
async function createSmtpTransporter(smtpProfile: SmtpProfile) {
  // Port 465 uses immediate TLS, other ports use STARTTLS
  const useImmediateTls = smtpProfile.port === 465;

  // Get credentials from secure store
  const credentials = await getSmtpCredentials(smtpProfile.id);

  // Fall back to DB credentials if not in secrets store (migration period)
  const username = credentials?.username || smtpProfile.username;
  const password = credentials?.password || smtpProfile.password;

  return nodemailer.createTransport({
    host: smtpProfile.host,
    port: smtpProfile.port,
    secure: useImmediateTls,
    auth: {
      user: username,
      pass: password,
    },
    // For STARTTLS ports, require TLS upgrade if useSsl is true
    requireTLS: !useImmediateTls && smtpProfile.useSsl,
    tls: {
      // Allow self-signed certificates in development
      rejectUnauthorized: config.isProduction,
    },
  });
}

/**
 * Test SMTP connection without sending an email
 */
export async function testSmtpConnection(
  smtpProfile: SmtpProfile,
): Promise<TestConnectionResult> {
  try {
    const transporter = await createSmtpTransporter(smtpProfile);
    await transporter.verify();
    return { success: true, message: 'SMTP connection successful' };
  } catch (error: any) {
    console.error('SMTP connection test failed:', error.message);
    return {
      success: false,
      message: `SMTP connection failed: ${error.message}`,
    };
  }
}

export async function sendEmail(
  smtpProfile: SmtpProfile,
  options: SendEmailOptions,
): Promise<{ messageId: string }> {
  const transporter = await createSmtpTransporter(smtpProfile);

  const result = await transporter.sendMail({
    from: `"${smtpProfile.name}" <${smtpProfile.email}>`,
    to: options.to.join(', '),
    cc: options.cc?.join(', '),
    bcc: options.bcc?.join(', '),
    subject: options.subject,
    text: options.text,
    html: options.html,
    inReplyTo: options.inReplyTo,
    references: options.references?.join(' '),
    attachments: options.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    })),
  });

  return { messageId: result.messageId };
}

/**
 * Check if a sync has expired (expiration time has passed)
 */
function isSyncExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

/**
 * Start async sync - returns immediately while sync continues in background
 */
export async function startAsyncEmailSync(
  emailAccount: EmailAccount,
): Promise<boolean> {
  // Check if already syncing using syncId
  if (emailAccount.syncId) {
    // Check if the sync has expired (stuck/stale)
    if (isSyncExpired(emailAccount.syncExpiresAt)) {
      console.log(
        `[Email] Sync for ${emailAccount.email} has expired, clearing stale sync`,
      );
      // Clear the stale sync before starting a new one
      await emailAccount.update({
        syncId: null,
        syncProgress: null,
        syncStatus: null,
        syncExpiresAt: null,
      });
    } else {
      console.log(`[Email] Account ${emailAccount.email} is already syncing`);
      return false;
    }
  }

  if (emailAccount.accountType === EmailAccountType.IMAP) {
    return await startAsyncSync(emailAccount);
  } else if (emailAccount.accountType === EmailAccountType.POP3) {
    await emailAccount.update({
      syncStatus: 'POP3 sync not yet implemented',
    });
    return false;
  }

  return false;
}
