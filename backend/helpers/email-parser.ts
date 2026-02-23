import type { FetchMessageObject } from 'imapflow';
import type { ParsedMail, Headers } from 'mailparser';
import { EmailFolder } from '../db/models/email.model.js';
import { Attachment, AttachmentType } from '../db/models/attachment.model.js';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { uploadAttachment } from './attachment-storage.js';
import { logger } from './logger.js';

/**
 * Pre-processed attachment metadata (content already uploaded to storage).
 * This allows us to clear the attachment content from memory immediately after upload.
 */
export interface PreProcessedAttachment {
  id: string;
  filename: string;
  mimeType: string;
  extension: string | null;
  size: number;
  storageKey: string;
  attachmentType: AttachmentType;
  contentId: string | null;
  contentDisposition: string | null;
  isSafe: boolean;
}

/** Email data paired with pre-processed attachment metadata (memory-efficient). */
export interface EmailWithAttachments {
  emailData: Record<string, unknown>;
  attachments: PreProcessedAttachment[];
}

/**
 * Upload attachments immediately and return metadata (without content).
 * Each attachment is streamed to storage and freed before the next.
 */
export async function uploadAttachmentsImmediately(
  parsedEmail: ParsedMail,
): Promise<PreProcessedAttachment[]> {
  if (!parsedEmail.attachments || parsedEmail.attachments.length === 0) {
    return [];
  }

  const results: PreProcessedAttachment[] = [];

  for (const attachment of parsedEmail.attachments) {
    try {
      const attachmentId = uuidv4();

      const isInline =
        attachment.contentDisposition === 'inline' || !!attachment.cid;

      const extension = attachment.filename
        ? attachment.filename.split('.').pop()?.toLowerCase() || null
        : null;

      const stream = Readable.from(attachment.content);

      const uploadResult = await uploadAttachment({
        attachmentId,
        mimeType: attachment.contentType || 'application/octet-stream',
        stream,
      });

      results.push({
        id: attachmentId,
        filename: attachment.filename || 'untitled',
        mimeType: attachment.contentType || 'application/octet-stream',
        extension,
        size: uploadResult.size,
        storageKey: uploadResult.storageKey,
        attachmentType: isInline
          ? AttachmentType.INLINE
          : AttachmentType.ATTACHMENT,
        contentId: attachment.cid || null,
        contentDisposition: attachment.contentDisposition || null,
        isSafe: true,
      });
    } catch (error) {
      logger.error('IMAP', `Failed to upload attachment: ${attachment.filename}`, { error: error instanceof Error ? error.message : error });
    }
  }

  return results;
}

/** Create attachment records in the database from pre-processed metadata. */
export async function createAttachmentRecords(
  emailId: string,
  attachments: PreProcessedAttachment[],
): Promise<void> {
  if (attachments.length === 0) {
    return;
  }

  const attachmentRecords = attachments.map((att) => ({
    ...att,
    emailId,
  }));

  await Attachment.bulkCreate(attachmentRecords);
  logger.debug('IMAP', `Saved ${attachments.length} attachments for email ${emailId}`);
}

// ---------------------------------------------------------------------------
// Header / unsubscribe parsing utilities
// ---------------------------------------------------------------------------

export function headersToObject(headers: Headers): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};

  headers.forEach((value, key) => {
    if (typeof value === 'string') {
      result[key] = value;
    } else if (Array.isArray(value)) {
      result[key] = value.map((v) =>
        typeof v === 'string' ? v : JSON.stringify(v),
      );
    } else if (value && typeof value === 'object') {
      result[key] = JSON.stringify(value);
    }
  });

  return result;
}

function parseUnsubscribeHeader(header: string | undefined): {
  url?: string;
  email?: string;
} {
  if (!header) {
    return {};
  }

  const result: { url?: string; email?: string } = {};

  const matches = header.match(/<([^>]+)>/g);
  if (matches) {
    for (const match of matches) {
      const value = match.slice(1, -1);
      if (value.startsWith('http://') || value.startsWith('https://')) {
        result.url = value;
      } else if (value.startsWith('mailto:')) {
        result.email = value.replace('mailto:', '');
      }
    }
  }

  return result;
}

/**
 * Decode Q-encoded (MIME) strings like =?us-ascii?Q?=3Chttps=3A=2F=2F...?=
 * These are used in email headers for non-ASCII or special characters.
 */
function decodeMimeEncodedString(encoded: string): string {
  if (!encoded || !encoded.includes('=?')) {
    return encoded;
  }

  const mimeWordPattern = /=\?([^?]+)\?([QqBb])\?([^?]*)\?=/g;

  const parts: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mimeWordPattern.exec(encoded)) !== null) {
    if (match.index > lastIndex) {
      const between = encoded.slice(lastIndex, match.index);
      if (between.trim()) {
        parts.push(between);
      }
    }

    const [, , encoding, text] = match;

    if (encoding.toUpperCase() === 'Q') {
      const decodedPart = text
        .replace(/_/g, ' ')
        .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16)),
        );
      parts.push(decodedPart);
    } else if (encoding.toUpperCase() === 'B') {
      try {
        parts.push(Buffer.from(text, 'base64').toString('utf-8'));
      } catch {
        parts.push(text);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < encoded.length) {
    parts.push(encoded.slice(lastIndex));
  }

  if (parts.length > 0) {
    return parts.join('');
  }

  return encoded;
}

/**
 * Extract unsubscribe info from both list-unsubscribe and list headers.
 */
function extractUnsubscribeInfo(headers: Headers): {
  url?: string;
  email?: string;
} {
  const result: { url?: string; email?: string } = {};

  const listUnsubscribeRaw = headers.get('list-unsubscribe');
  if (listUnsubscribeRaw) {
    let listUnsubscribeStr: string | undefined;
    if (typeof listUnsubscribeRaw === 'string') {
      listUnsubscribeStr = listUnsubscribeRaw;
    } else if (Array.isArray(listUnsubscribeRaw)) {
      listUnsubscribeStr = listUnsubscribeRaw.join(', ');
    } else if (typeof listUnsubscribeRaw === 'object') {
      const rawObj = listUnsubscribeRaw as any;
      listUnsubscribeStr = rawObj.text || rawObj.value || rawObj.name;
      if (listUnsubscribeStr) {
        listUnsubscribeStr = decodeMimeEncodedString(listUnsubscribeStr);
      }
    }
    if (listUnsubscribeStr) {
      const parsed = parseUnsubscribeHeader(listUnsubscribeStr);
      if (parsed.url) {
        result.url = parsed.url;
      }
      if (parsed.email) {
        result.email = parsed.email;
      }
    }
  }

  const listHeaderRaw = headers.get('list');
  if (listHeaderRaw && typeof listHeaderRaw === 'object') {
    const listHeader = listHeaderRaw as any;

    if (listHeader.unsubscribe) {
      const unsub = listHeader.unsubscribe;

      if (unsub.url && !result.url) {
        result.url = unsub.url;
      } else if (unsub.name && !result.url) {
        const decoded = decodeMimeEncodedString(unsub.name);
        const parsed = parseUnsubscribeHeader(decoded);
        if (parsed.url) {
          result.url = parsed.url;
        }
        if (parsed.email && !result.email) {
          result.email = parsed.email;
        }
      }

      if (unsub.mail && !result.email) {
        const mailValue = unsub.mail;
        if (typeof mailValue === 'string') {
          const emailMatch = mailValue.match(/^([^?]+)/);
          if (emailMatch) {
            result.email = emailMatch[1];
          }
        }
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Email data construction
// ---------------------------------------------------------------------------

/** Build a flat email data object from a parsed IMAP message. */
export function createEmailDataFromParsed(
  emailAccountId: string,
  messageId: string,
  parsed: ParsedMail,
  folder: EmailFolder,
  message: FetchMessageObject,
): Record<string, unknown> {
  const fromAddress = parsed.from?.value?.[0]?.address || 'unknown@unknown.com';
  const fromName = parsed.from?.value?.[0]?.name || null;

  const toAddresses = parsed.to
    ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
        .flatMap((addr) => addr.value.map((v) => v.address || ''))
        .filter(Boolean)
    : [];

  const ccAddresses = parsed.cc
    ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc])
        .flatMap((addr) => addr.value.map((v) => v.address || ''))
        .filter(Boolean)
    : null;

  const finalMessageId =
    parsed.messageId || messageId || `generated-${uuidv4()}`;

  const headers = headersToObject(parsed.headers);
  const unsubscribeInfo = extractUnsubscribeInfo(parsed.headers);

  const referencesArray = parsed.references
    ? Array.isArray(parsed.references)
      ? parsed.references
      : [parsed.references]
    : null;

  const receivedAtRaw =
    message.internalDate || parsed.date || message.envelope?.date || new Date();
  const receivedAt =
    receivedAtRaw instanceof Date ? receivedAtRaw : new Date(receivedAtRaw);

  // threadId: first reference (original thread root), else inReplyTo, else self
  const threadId = referencesArray?.[0] || parsed.inReplyTo || finalMessageId;

  return {
    emailAccountId,
    messageId: finalMessageId,
    folder,
    fromAddress,
    fromName,
    toAddresses: toAddresses.length > 0 ? toAddresses : [fromAddress],
    ccAddresses: ccAddresses && ccAddresses.length > 0 ? ccAddresses : null,
    bccAddresses: null,
    subject: parsed.subject || '(No Subject)',
    textBody: parsed.text || null,
    htmlBody: parsed.html || null,
    receivedAt,
    isRead: folder === EmailFolder.SENT || message.flags?.has('\\Seen'),
    isStarred: message.flags?.has('\\Flagged'),
    inReplyTo: parsed.inReplyTo || null,
    references: referencesArray,
    threadId,
    isDraft: false,
    headers,
    isUnsubscribed: false,
    unsubscribeUrl: unsubscribeInfo.url || null,
    unsubscribeEmail: unsubscribeInfo.email || null,
  };
}
