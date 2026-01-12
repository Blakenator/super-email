import { makeMutation } from '../../types.js';
import { SmtpProfile, Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { sendEmail as sendEmailHelper } from '../../helpers/email.js';
import { EmailFolder } from '../../db/models/email.model.js';

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

    // Send the email
    const { messageId } = await sendEmailHelper(smtpProfile, {
      to: input.toAddresses,
      cc: input.ccAddresses ?? undefined,
      bcc: input.bccAddresses ?? undefined,
      subject: input.subject,
      text: input.textBody ?? undefined,
      html: input.htmlBody ?? undefined,
      inReplyTo: input.inReplyTo ?? undefined,
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

    return email;
  },
);
