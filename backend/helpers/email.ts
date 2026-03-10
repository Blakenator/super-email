import nodemailer from 'nodemailer';
import type { SendProfile } from '../db/models/send-profile.model.js';
import { SendProfileType } from '../db/models/send-profile.model.js';
import type { SmtpAccountSettings } from '../db/models/smtp-account-settings.model.js';
import type { ImapAccountSettings } from '../db/models/imap-account-settings.model.js';
import {
  EmailAccount,
  EmailAccountType,
} from '../db/models/email-account.model.js';
import { startAsyncSync } from './imap-sync.js';
import { getSmtpCredentials } from './secrets.js';
import { sendEmailViaSes } from './ses-email-sender.js';
import { config } from '../config/env.js';
import { logger } from './logger.js';

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
 * Create a nodemailer transporter with correct SSL/TLS settings.
 * Requires SmtpAccountSettings for host/port and the SendProfile ID for credentials.
 * - Port 465: Use immediate TLS (secure: true)
 * - Port 587/25: Use STARTTLS (secure: false)
 */
async function createSmtpTransporter(
  sendProfileId: string,
  smtpSettings: SmtpAccountSettings,
) {
  const useImmediateTls = smtpSettings.port === 465;

  const credentials = await getSmtpCredentials(sendProfileId);
  if (!credentials) {
    throw new Error(
      `No SMTP credentials found for send profile ${sendProfileId}`,
    );
  }

  return nodemailer.createTransport({
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: useImmediateTls,
    auth: {
      user: credentials.username,
      pass: credentials.password,
    },
    requireTLS: !useImmediateTls && smtpSettings.useSsl,
    tls: {
      rejectUnauthorized: config.isProduction,
    },
  });
}

/**
 * Test SMTP connection without sending an email
 */
export async function testSmtpConnection(
  sendProfileId: string,
  smtpSettings: SmtpAccountSettings,
  overrideCredentials?: { username: string; password: string },
): Promise<TestConnectionResult> {
  try {
    let transporter;
    if (overrideCredentials) {
      const useImmediateTls = smtpSettings.port === 465;
      transporter = nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: useImmediateTls,
        auth: {
          user: overrideCredentials.username,
          pass: overrideCredentials.password,
        },
        tls: useImmediateTls ? undefined : { rejectUnauthorized: false },
      });
    } else {
      transporter = await createSmtpTransporter(sendProfileId, smtpSettings);
    }
    await transporter.verify();
    return { success: true, message: 'SMTP connection successful' };
  } catch (error: any) {
    logger.error('Email', 'SMTP connection test failed', {
      host: smtpSettings.host,
      port: smtpSettings.port,
      error: error.message,
    });
    return {
      success: false,
      message: `SMTP connection failed: ${error.message}`,
    };
  }
}

/**
 * Send an email using the appropriate transport based on profile type.
 * - SMTP profiles: use nodemailer via external SMTP server
 * - CUSTOM_DOMAIN profiles: use AWS SES
 */
export async function sendEmail(
  sendProfile: SendProfile,
  options: SendEmailOptions,
): Promise<{ messageId: string }> {
  if (sendProfile.type === SendProfileType.CUSTOM_DOMAIN) {
    return sendEmailViaSes(
      sendProfile.email,
      sendProfile.alias || sendProfile.name,
      options,
    );
  }

  // SMTP type — requires smtpSettings to be loaded
  const smtpSettings = sendProfile.smtpSettings;
  if (!smtpSettings) {
    throw new Error(
      `SMTP settings not loaded for send profile ${sendProfile.id}. ` +
        'Ensure smtpSettings association is included in the query.',
    );
  }

  const transporter = await createSmtpTransporter(sendProfile.id, smtpSettings);

  const result = await transporter.sendMail({
    from: `"${sendProfile.alias || sendProfile.name}" <${sendProfile.email}>`,
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
 * Start async sync for an IMAP email account.
 * Custom domain accounts don't use polling sync (they receive via SES/SQS).
 */
export async function startAsyncEmailSync(
  emailAccount: EmailAccount,
  imapSettings?: ImapAccountSettings,
): Promise<boolean> {
  if (emailAccount.type === EmailAccountType.CUSTOM_DOMAIN) {
    return false;
  }

  // For IMAP accounts, load imapSettings if not provided
  const settings = imapSettings || emailAccount.imapSettings;
  if (!settings) {
    logger.warn(
      'Email',
      `No IMAP settings found for account ${emailAccount.email}`,
    );
    return false;
  }

  return await startAsyncSync(emailAccount, settings);
}
