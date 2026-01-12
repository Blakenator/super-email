import nodemailer from 'nodemailer';
import type { SmtpProfile } from '../db/models/smtp-profile.model.js';
import {
  EmailAccount,
  EmailAccountType,
} from '../db/models/email-account.model.js';
import { syncEmailsFromImapAccount, type SyncResult } from './imap-sync.js';

export interface SendEmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  inReplyTo?: string;
  references?: string[];
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
function createSmtpTransporter(smtpProfile: SmtpProfile) {
  // Port 465 uses immediate TLS, other ports use STARTTLS
  const useImmediateTls = smtpProfile.port === 465;

  return nodemailer.createTransport({
    host: smtpProfile.host,
    port: smtpProfile.port,
    secure: useImmediateTls,
    auth: {
      user: smtpProfile.username,
      pass: smtpProfile.password,
    },
    // For STARTTLS ports, require TLS upgrade if useSsl is true
    requireTLS: !useImmediateTls && smtpProfile.useSsl,
    tls: {
      // Allow self-signed certificates in development
      rejectUnauthorized: process.env.NODE_ENV === 'production',
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
    const transporter = createSmtpTransporter(smtpProfile);
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
  const transporter = createSmtpTransporter(smtpProfile);

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
  });

  return { messageId: result.messageId };
}

/**
 * Sync emails from a configured email account (IMAP or POP3)
 */
export async function syncEmailsFromAccount(
  accountId: string,
): Promise<SyncResult> {
  const emailAccount = await EmailAccount.findByPk(accountId);

  if (!emailAccount) {
    return { synced: 0, skipped: 0, errors: ['Email account not found'] };
  }

  if (emailAccount.accountType === EmailAccountType.IMAP) {
    return syncEmailsFromImapAccount(emailAccount);
  } else if (emailAccount.accountType === EmailAccountType.POP3) {
    // TODO: Implement POP3 sync
    console.log(`POP3 sync not yet implemented for account ${accountId}`);
    return { synced: 0, skipped: 0, errors: ['POP3 sync not yet implemented'] };
  }

  return { synced: 0, skipped: 0, errors: ['Unknown account type'] };
}
