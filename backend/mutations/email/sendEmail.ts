import { makeMutation } from '../../types.js';
import {
  SmtpProfile,
  Email,
  EmailAccount,
  Attachment,
} from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import {
  sendEmail as sendEmailHelper,
  type EmailAttachment,
} from '../../helpers/email.js';
import { EmailFolder } from '../../db/models/email.model.js';
import { uploadAttachment } from '../../helpers/attachment-storage.js';
import { Readable } from 'stream';
import { AttachmentType } from '../../db/models/attachment.model.js';
import { logger } from '../../helpers/logger.js';

export const sendEmail = makeMutation(
  'sendEmail',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // Validate email account
    const emailAccount = await EmailAccount.findOne({
      where: { id: input.emailAccountId, userId },
    });

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    // Validate SMTP profile
    const smtpProfile = await SmtpProfile.findOne({
      where: { id: input.smtpProfileId, userId },
    });

    if (!smtpProfile) {
      throw new Error('SMTP profile not found');
    }

    // Process attachments if provided
    const emailAttachments: EmailAttachment[] = [];
    const attachmentMetadata: Array<{
      filename: string;
      mimeType: string;
      size: number;
      storageKey: string;
      extension: string | null;
    }> = [];

    if (input.attachments && input.attachments.length > 0) {
      const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB per attachment
      const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total

      let totalSize = 0;

      for (const attachment of input.attachments) {
        // Decode base64 attachment data
        const buffer = Buffer.from(attachment.data, 'base64');
        const size = buffer.length;

        if (size > MAX_ATTACHMENT_SIZE) {
          throw new Error(
            `Attachment "${attachment.filename}" exceeds maximum size of 25MB`,
          );
        }

        totalSize += size;
        if (totalSize > MAX_TOTAL_SIZE) {
          throw new Error('Total attachment size exceeds maximum of 50MB');
        }

        emailAttachments.push({
          filename: attachment.filename,
          content: buffer,
          contentType: attachment.mimeType,
        });

        // We'll upload to storage after creating the email record
        attachmentMetadata.push({
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size,
          storageKey: '', // Will be set after upload
          extension:
            attachment.filename.split('.').pop()?.toLowerCase() || null,
        });
      }
    }

    // Send the email
    const { messageId } = await sendEmailHelper(smtpProfile, {
      to: input.toAddresses,
      cc: input.ccAddresses ?? undefined,
      bcc: input.bccAddresses ?? undefined,
      subject: input.subject,
      text: input.textBody ?? undefined,
      html: input.htmlBody ?? undefined,
      inReplyTo: input.inReplyTo ?? undefined,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
    });

    // If sending from a draft, delete the draft
    if (input.draftId) {
      await Email.destroy({
        where: {
          id: input.draftId,
          emailAccountId: emailAccount.id,
          isDraft: true,
        },
      });
    }

    // Store the sent email in the database
    const email = await Email.create({
      emailAccountId: emailAccount.id,
      smtpProfileId: smtpProfile.id,
      messageId,
      folder: EmailFolder.SENT,
      fromAddress: smtpProfile.email,
      fromName: smtpProfile.name,
      toAddresses: input.toAddresses,
      ccAddresses: input.ccAddresses ?? null,
      bccAddresses: input.bccAddresses ?? null,
      subject: input.subject,
      textBody: input.textBody ?? null,
      htmlBody: input.htmlBody ?? null,
      receivedAt: new Date(),
      isRead: true,
      isStarred: false,
      isDraft: false,
      inReplyTo: input.inReplyTo ?? null,
    });

    // Upload attachments to storage and save metadata in parallel
    if (emailAttachments.length > 0) {
      // Upload all attachments in parallel with concurrency control
      const CONCURRENCY_LIMIT = 5; // Upload max 5 attachments simultaneously

      const uploadPromises = emailAttachments.map(
        async (emailAttachment, i) => {
          const metadata = attachmentMetadata[i];

          try {
            // Generate a UUID for this attachment (used as storage key)
            const attachmentId = crypto.randomUUID();

            // Upload to storage using the attachment UUID
            const stream = Readable.from(emailAttachment.content);
            const uploadResult = await uploadAttachment({
              attachmentId,
              mimeType: emailAttachment.contentType,
              stream,
            });

            return {
              id: attachmentId,
              emailId: email.id,
              filename: metadata.filename,
              mimeType: metadata.mimeType,
              extension: metadata.extension,
              size: uploadResult.size,
              storageKey: uploadResult.storageKey,
              attachmentType: AttachmentType.ATTACHMENT,
              contentId: null,
              contentDisposition: 'attachment',
              isSafe: true,
            };
          } catch (error) {
            logger.error('sendEmail', `Failed to upload attachment: ${emailAttachment.filename}`, { error: error instanceof Error ? error.message : error });
            return null; // Return null for failed uploads
          }
        },
      );

      // Process uploads with concurrency control
      const attachmentsToCreate: Array<Partial<Attachment>> = [];
      for (let i = 0; i < uploadPromises.length; i += CONCURRENCY_LIMIT) {
        const batch = uploadPromises.slice(i, i + CONCURRENCY_LIMIT);
        const results = await Promise.all(batch);
        attachmentsToCreate.push(...results.filter((r) => r !== null));
      }

      // Bulk create successfully uploaded attachments
      if (attachmentsToCreate.length > 0) {
        await Attachment.bulkCreate(attachmentsToCreate);
      }
    }

    return email;
  },
);
