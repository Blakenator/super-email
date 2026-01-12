import { makeMutation } from '../../types.js';
import { SmtpProfile, Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { sendEmail as sendEmailHelper } from '../../helpers/email.js';
import { EmailFolder } from '../../db/models/email.model.js';

export const sendEmail = makeMutation(
  'sendEmail',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const smtpProfile = await SmtpProfile.findOne({
      where: { id: input.smtpProfileId, userId },
    });

    if (!smtpProfile) {
      throw new Error('SMTP profile not found');
    }

    // Find or create an email account for storing sent emails
    let emailAccount = await EmailAccount.findOne({
      where: { userId, email: smtpProfile.email },
    });
    console.log({ emailAccount });

    // If no matching email account exists, we'll still send but not store
    const { messageId } = await sendEmailHelper(smtpProfile, {
      to: input.toAddresses,
      cc: input.ccAddresses ?? undefined,
      bcc: input.bccAddresses ?? undefined,
      subject: input.subject,
      text: input.textBody ?? undefined,
      html: input.htmlBody ?? undefined,
      inReplyTo: input.inReplyTo ?? undefined,
    });

    // Store the sent email in the database if we have an email account
    if (emailAccount) {
      const email = await Email.create({
        emailAccountId: emailAccount.id,
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
        inReplyTo: input.inReplyTo ?? null,
      });

      return email;
    }

    // Return a mock email object if we couldn't store it
    return {
      id: messageId,
      emailAccountId: '',
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
      inReplyTo: input.inReplyTo ?? null,
      references: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
);
