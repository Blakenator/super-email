import { makeMutation } from '../../types.js';
import { Email, EmailAccount, SendProfile } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { EmailFolder } from '../../db/models/email.model.js';
import { v4 as uuidv4 } from 'uuid';

export const saveDraft = makeMutation(
  'saveDraft',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const emailAccount = await EmailAccount.findOne({
      where: { id: input.emailAccountId, userId },
    });

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    if (input.sendProfileId) {
      const sendProfile = await SendProfile.findOne({
        where: { id: input.sendProfileId, userId },
      });

      if (!sendProfile) {
        throw new Error('Send profile not found');
      }
    }

    if (input.id) {
      const existingDraft = await Email.findOne({
        where: { id: input.id, emailAccountId: emailAccount.id, isDraft: true },
      });

      if (!existingDraft) {
        throw new Error('Draft not found');
      }

      await existingDraft.update({
        sendProfileId: input.sendProfileId ?? existingDraft.sendProfileId,
        toAddresses: input.toAddresses ?? existingDraft.toAddresses,
        ccAddresses: input.ccAddresses ?? existingDraft.ccAddresses,
        bccAddresses: input.bccAddresses ?? existingDraft.bccAddresses,
        subject: input.subject ?? existingDraft.subject,
        textBody: input.textBody ?? existingDraft.textBody,
        htmlBody: input.htmlBody ?? existingDraft.htmlBody,
        inReplyTo: input.inReplyTo ?? existingDraft.inReplyTo,
      });

      return existingDraft;
    }

    const draft = await Email.create({
      emailAccountId: emailAccount.id,
      sendProfileId: input.sendProfileId ?? null,
      messageId: `draft-${uuidv4()}`,
      folder: EmailFolder.DRAFTS,
      fromAddress: emailAccount.email,
      fromName: emailAccount.name,
      toAddresses: input.toAddresses ?? [],
      ccAddresses: input.ccAddresses ?? null,
      bccAddresses: input.bccAddresses ?? null,
      subject: input.subject ?? '(No Subject)',
      textBody: input.textBody ?? null,
      htmlBody: input.htmlBody ?? null,
      receivedAt: new Date(),
      isRead: true,
      isStarred: false,
      isDraft: true,
      inReplyTo: input.inReplyTo ?? null,
    });

    return draft;
  },
);
