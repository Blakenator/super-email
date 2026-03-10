import { makeMutation } from '../../types.js';
import {
  SendProfile,
  SmtpAccountSettings,
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
import { publishMailboxUpdate } from '../../helpers/pubsub.js';

export const sendEmail = makeMutation(
  'sendEmail',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const emailAccount = await EmailAccount.findOne({
      where: { id: input.emailAccountId, userId },
    });

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    const sendProfile = await SendProfile.findOne({
      where: { id: input.sendProfileId, userId },
      include: [{ model: SmtpAccountSettings, as: 'smtpSettings' }],
    });

    if (!sendProfile) {
      throw new Error('Send profile not found');
    }

    const emailAttachments: EmailAttachment[] = [];
    const attachmentMetadata: Array<{
      filename: string;
      mimeType: string;
      size: number;
      storageKey: string;
      extension: string | null;
    }> = [];

    if (input.attachments && input.attachments.length > 0) {
      const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;
      const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

      let totalSize = 0;

      for (const attachment of input.attachments) {
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

        attachmentMetadata.push({
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size,
          storageKey: '',
          extension:
            attachment.filename.split('.').pop()?.toLowerCase() || null,
        });
      }
    }

    const { messageId } = await sendEmailHelper(sendProfile, {
      to: input.toAddresses,
      cc: input.ccAddresses ?? undefined,
      bcc: input.bccAddresses ?? undefined,
      subject: input.subject,
      text: input.textBody ?? undefined,
      html: input.htmlBody ?? undefined,
      inReplyTo: input.inReplyTo ?? undefined,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
    });

    if (input.draftId) {
      await Email.destroy({
        where: {
          id: input.draftId,
          emailAccountId: emailAccount.id,
          isDraft: true,
        },
      });
    }

    const email = await Email.create({
      emailAccountId: emailAccount.id,
      sendProfileId: sendProfile.id,
      messageId,
      folder: EmailFolder.SENT,
      fromAddress: sendProfile.email,
      fromName: sendProfile.alias || sendProfile.name,
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

    if (emailAttachments.length > 0) {
      const CONCURRENCY_LIMIT = 5;

      const uploadPromises = emailAttachments.map(
        async (emailAttachment, i) => {
          const metadata = attachmentMetadata[i];

          try {
            const attachmentId = crypto.randomUUID();
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
            return null;
          }
        },
      );

      const attachmentsToCreate: Array<Partial<Attachment>> = [];
      for (let i = 0; i < uploadPromises.length; i += CONCURRENCY_LIMIT) {
        const batch = uploadPromises.slice(i, i + CONCURRENCY_LIMIT);
        const results = await Promise.all(batch);
        attachmentsToCreate.push(...results.filter((r) => r !== null));
      }

      if (attachmentsToCreate.length > 0) {
        await Attachment.bulkCreate(attachmentsToCreate);
      }
    }

    publishMailboxUpdate(userId, {
      type: 'NEW_EMAILS',
      emailAccountId: emailAccount.id,
    });

    return email;
  },
);
