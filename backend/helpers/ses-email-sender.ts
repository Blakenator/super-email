/**
 * SES Email Sender
 *
 * Handles sending emails via AWS SES for custom domain send profiles.
 * Uses nodemailer's SES transport for proper RFC-compliant MIME construction.
 * In development, logs the email instead of actually sending via SES.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from './logger.js';
import type { SendEmailOptions } from './email.js';

let sesTransporter: Transporter | null = null;

async function getSesTransporter(): Promise<Transporter> {
  if (!sesTransporter) {
    const aws = await import('@aws-sdk/client-ses');
    const ses = new aws.SES({ region: config.ses.region });
    sesTransporter = nodemailer.createTransport({ SES: { ses, aws } });
  }
  return sesTransporter;
}

/**
 * Send an email via AWS SES (for custom domain send profiles).
 */
export async function sendEmailViaSes(
  fromEmail: string,
  fromName: string | null,
  options: SendEmailOptions,
): Promise<{ messageId: string }> {
  if (config.isDevelopment) {
    const messageId = `<dev-ses-${Date.now()}@${fromEmail.split('@')[1]}>`;
    logger.info('SES', `[Dev] Would send email via SES from ${fromEmail}`, {
      to: options.to,
      subject: options.subject,
      messageId,
    });
    return { messageId };
  }

  const transporter = await getSesTransporter();

  const from = fromName
    ? `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>`
    : fromEmail;

  try {
    const result = await transporter.sendMail({
      from,
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

    const messageId = result.messageId || `<ses-${Date.now()}@${fromEmail.split('@')[1]}>`;
    logger.info('SES', `Email sent via SES from ${fromEmail}`, {
      to: options.to,
      messageId,
    });

    return { messageId };
  } catch (error: any) {
    logger.error('SES', `Failed to send email via SES from ${fromEmail}`, {
      error: error.message,
    });
    throw error;
  }
}
