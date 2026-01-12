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
 * Start async sync - returns immediately while sync continues in background
 */
export async function startAsyncEmailSync(
  emailAccount: EmailAccount,
): Promise<boolean> {
  // Check if already syncing using syncId
  if (emailAccount.syncId) {
    console.log(`[Email] Account ${emailAccount.email} is already syncing`);
    return false;
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
