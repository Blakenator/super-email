/**
 * SES Email Sender
 *
 * Handles sending emails via AWS SES for custom domain send profiles.
 * In development, logs the email instead of actually sending via SES.
 */

import { config } from '../config/env.js';
import { logger } from './logger.js';
import type { SendEmailOptions } from './email.js';

let sesClient: any = null;

async function getSesClient() {
  if (!sesClient) {
    const { SESv2Client } = await import('@aws-sdk/client-sesv2');
    sesClient = new SESv2Client({ region: config.ses.region });
  }
  return sesClient;
}

/**
 * Build a raw MIME email message for SES SendRawEmail.
 */
function buildRawEmail(
  fromEmail: string,
  fromName: string | null,
  options: SendEmailOptions,
): Buffer {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const mixedBoundary = `----=_Mixed_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const fromHeader = fromName
    ? `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>`
    : fromEmail;

  const lines: string[] = [
    `From: ${fromHeader}`,
    `To: ${options.to.join(', ')}`,
  ];

  if (options.cc?.length) {
    lines.push(`Cc: ${options.cc.join(', ')}`);
  }
  if (options.bcc?.length) {
    lines.push(`Bcc: ${options.bcc.join(', ')}`);
  }

  lines.push(`Subject: ${options.subject}`);

  if (options.inReplyTo) {
    lines.push(`In-Reply-To: ${options.inReplyTo}`);
  }
  if (options.references?.length) {
    lines.push(`References: ${options.references.join(' ')}`);
  }

  lines.push(`MIME-Version: 1.0`);
  lines.push(`Date: ${new Date().toUTCString()}`);
  lines.push(`Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@${fromEmail.split('@')[1]}>`);

  const hasAttachments = options.attachments && options.attachments.length > 0;

  if (hasAttachments) {
    lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
    lines.push('');
    lines.push(`--${mixedBoundary}`);
  }

  // Body parts
  if (options.text && options.html) {
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    lines.push('');
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(options.text);
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(options.html);
    lines.push(`--${boundary}--`);
  } else if (options.html) {
    lines.push('Content-Type: text/html; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(options.html);
  } else {
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    lines.push(options.text || '');
  }

  // Attachments
  if (hasAttachments && options.attachments) {
    for (const att of options.attachments) {
      lines.push(`--${mixedBoundary}`);
      lines.push(
        `Content-Type: ${att.contentType}; name="${att.filename}"`,
      );
      lines.push('Content-Transfer-Encoding: base64');
      lines.push(
        `Content-Disposition: attachment; filename="${att.filename}"`,
      );
      lines.push('');
      lines.push(att.content.toString('base64'));
    }
    lines.push(`--${mixedBoundary}--`);
  }

  return Buffer.from(lines.join('\r\n'));
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

  const client = await getSesClient();
  const { SendRawEmailCommand } = await import('@aws-sdk/client-ses');

  const rawMessage = buildRawEmail(fromEmail, fromName, options);

  try {
    const result = await client.send(
      new SendRawEmailCommand({
        RawMessage: { Data: rawMessage },
        Source: fromEmail,
        Destinations: [
          ...options.to,
          ...(options.cc || []),
          ...(options.bcc || []),
        ],
      }),
    );

    const messageId = result.MessageId || `<ses-${Date.now()}@${fromEmail.split('@')[1]}>`;
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
