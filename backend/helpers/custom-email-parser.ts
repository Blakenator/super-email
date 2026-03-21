/**
 * Custom Domain Email Parser
 *
 * Parses raw emails received via SES for custom domain accounts.
 * Reuses the existing email-parser utilities for message parsing and
 * attachment handling. Also handles archiving raw emails to a dedicated
 * S3 bucket (or local directory in development).
 *
 * Designed to be called from the Lambda function (or directly in dev).
 */

import { simpleParser } from 'mailparser';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { resolveBackendDataPath } from '../config/paths.js';
import { Email, EmailFolder } from '../db/models/email.model.js';
import { storeEmailBody } from './body-storage.js';
import { upsertSearchIndex, generateBodyPreview } from './search-index.js';
import { logger } from './logger.js';
import {
  uploadAttachmentsImmediately,
  createAttachmentRecords,
  headersToObject,
} from './email-parser.js';
import fs from 'fs/promises';
import path from 'path';

export interface CustomEmailParseResult {
  emailId: string;
  emailAccountId: string;
  messageId: string;
  fromAddress: string;
  subject: string;
  attachmentCount: number;
  rawStorageKey: string;
}

/**
 * Archive the raw email to the dedicated raw-emails bucket (not counted in storage budget).
 * Returns the storage key used.
 */
export async function archiveRawEmail(
  rawEmail: Buffer,
  emailAccountId: string,
  messageId: string,
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedMsgId = messageId.replace(/[<>]/g, '').replace(/[^a-zA-Z0-9@._-]/g, '_');
  const storageKey = `${emailAccountId}/${timestamp}_${sanitizedMsgId}.eml`;

  if (config.isProduction) {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({ region: config.aws.region });
    await s3.send(
      new PutObjectCommand({
        Bucket: config.rawEmails.s3Bucket,
        Key: storageKey,
        Body: rawEmail,
        ContentType: 'message/rfc822',
      }),
    );
    logger.info('CustomEmailParser', `Archived raw email to s3://${config.rawEmails.s3Bucket}/${storageKey}`);
  } else {
    const localPath = path.join(
      resolveBackendDataPath(config.rawEmails.localDir),
      storageKey,
    );
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, rawEmail);
    logger.info('CustomEmailParser', `Archived raw email locally: ${localPath}`);
  }

  return storageKey;
}

/**
 * Parse a raw email (Buffer) received via SES for a custom domain account.
 *
 * 1. Archives the raw email to raw-emails storage
 * 2. Parses the MIME content using mailparser
 * 3. Uploads attachments to the main attachments storage
 * 4. Creates Email + Attachment records in the database
 */
export async function parseAndStoreCustomEmail(
  rawEmail: Buffer,
  emailAccountId: string,
  recipientAddress: string,
): Promise<CustomEmailParseResult> {
  const parsed = await simpleParser(rawEmail);

  const messageId = parsed.messageId || `custom-${uuidv4()}@${recipientAddress.split('@')[1]}`;

  const existing = await Email.findOne({
    where: { emailAccountId, messageId },
  });
  if (existing) {
    logger.info('CustomEmailParser', `Email already exists: ${messageId}`);
    return {
      emailId: existing.id,
      emailAccountId,
      messageId,
      fromAddress: existing.fromAddress,
      subject: existing.subject,
      attachmentCount: 0,
      rawStorageKey: '',
    };
  }

  const rawStorageKey = await archiveRawEmail(rawEmail, emailAccountId, messageId);

  const preProcessedAttachments = await uploadAttachmentsImmediately(parsed, emailAccountId);

  const fromAddress = parsed.from?.value?.[0]?.address || 'unknown@unknown.com';
  const fromName = parsed.from?.value?.[0]?.name || null;

  const toAddresses = parsed.to
    ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
        .flatMap((addr) => addr.value.map((v) => v.address || ''))
        .filter(Boolean)
    : [recipientAddress];

  const ccAddresses = parsed.cc
    ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc])
        .flatMap((addr) => addr.value.map((v) => v.address || ''))
        .filter(Boolean)
    : null;

  const headers = headersToObject(parsed.headers);

  const referencesArray = parsed.references
    ? Array.isArray(parsed.references)
      ? parsed.references
      : [parsed.references]
    : null;

  const threadId = referencesArray?.[0] || parsed.inReplyTo || messageId;

  const textBody = parsed.text || null;
  const htmlBody = parsed.html || null;

  const emailData = {
    emailAccountId,
    messageId,
    folder: EmailFolder.INBOX,
    fromAddress,
    fromName,
    toAddresses,
    ccAddresses: ccAddresses && ccAddresses.length > 0 ? ccAddresses : null,
    bccAddresses: null,
    subject: parsed.subject || '(No Subject)',
    bodyPreview: generateBodyPreview(textBody, htmlBody),
    receivedAt: parsed.date || new Date(),
    isRead: false,
    isStarred: false,
    inReplyTo: parsed.inReplyTo || null,
    references: referencesArray,
    threadId,
    isDraft: false,
    headers,
    isUnsubscribed: false,
    unsubscribeUrl: null,
    unsubscribeEmail: null,
  };

  const newEmail = await Email.create(emailData as any);

  // Set bodyStorageKey and store body in S3
  const storageKey = `${emailAccountId}/${newEmail.id}`;
  const { bodySizeBytes } = await storeEmailBody(
    emailAccountId,
    newEmail.id,
    textBody,
    htmlBody,
  );
  await newEmail.update({ bodyStorageKey: storageKey, bodySizeBytes });

  await upsertSearchIndex({
    emailId: newEmail.id,
    emailAccountId,
    subject: parsed.subject || '(No Subject)',
    textBody,
    fromAddress,
    toAddresses,
    bodySize: bodySizeBytes,
  });

  if (preProcessedAttachments.length > 0) {
    await createAttachmentRecords(newEmail.id, preProcessedAttachments);
  }

  logger.info(
    'CustomEmailParser',
    `Stored custom domain email: ${newEmail.id} from=${fromAddress} subject="${parsed.subject || '(No Subject)'}" attachments=${preProcessedAttachments.length}`,
  );

  return {
    emailId: newEmail.id,
    emailAccountId,
    messageId,
    fromAddress,
    subject: parsed.subject || '(No Subject)',
    attachmentCount: preProcessedAttachments.length,
    rawStorageKey,
  };
}
