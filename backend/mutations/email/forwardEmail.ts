import { makeMutation } from '../../types.js';
import { Email, EmailAccount, SmtpProfile, EmailFolder } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { sendEmail } from '../../helpers/email.js';

export const forwardEmail = makeMutation(
  'forwardEmail',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // Get the original email
    const originalEmail = await Email.findByPk(input.emailId, {
      include: [EmailAccount],
    });

    if (!originalEmail) {
      throw new Error('Original email not found');
    }

    // Verify user owns this email account
    if (originalEmail.emailAccount?.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Get the sending account and SMTP profile
    const emailAccount = await EmailAccount.findOne({
      where: { id: input.emailAccountId, userId },
    });

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    const smtpProfile = await SmtpProfile.findOne({
      where: { id: input.smtpProfileId, userId },
    });

    if (!smtpProfile) {
      throw new Error('SMTP profile not found');
    }

    // Build the forwarded message
    const forwardSubject = originalEmail.subject.startsWith('Fwd:')
      ? originalEmail.subject
      : `Fwd: ${originalEmail.subject}`;

    // Build forwarded body with original message
    const originalDate = new Date(originalEmail.receivedAt).toLocaleString();
    const forwardedHeader = `
---------- Forwarded message ----------
From: ${originalEmail.fromName || ''} <${originalEmail.fromAddress}>
Date: ${originalDate}
Subject: ${originalEmail.subject}
To: ${originalEmail.toAddresses.join(', ')}
`;

    let textBody = '';
    if (input.additionalText) {
      textBody += input.additionalText + '\n\n';
    }
    textBody += forwardedHeader + '\n\n';
    textBody += originalEmail.textBody || '';

    let htmlBody = '';
    if (input.additionalText) {
      htmlBody += `<p>${input.additionalText.replace(/\n/g, '<br>')}</p><br>`;
    }
    htmlBody += `
<div style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 10px;">
  <p style="color: #666; font-size: 12px;">
    <strong>---------- Forwarded message ----------</strong><br>
    From: ${originalEmail.fromName || ''} &lt;${originalEmail.fromAddress}&gt;<br>
    Date: ${originalDate}<br>
    Subject: ${originalEmail.subject}<br>
    To: ${originalEmail.toAddresses.join(', ')}
  </p>
  <br>
  ${originalEmail.htmlBody || `<p>${(originalEmail.textBody || '').replace(/\n/g, '<br>')}</p>`}
</div>
`;

    // Send the email
    const result = await sendEmail(smtpProfile, {
      to: input.toAddresses,
      cc: input.ccAddresses || undefined,
      bcc: input.bccAddresses || undefined,
      subject: forwardSubject,
      text: textBody,
      html: htmlBody,
    });

    // Store the sent email
    const sentEmail = await Email.create({
      emailAccountId: input.emailAccountId,
      smtpProfileId: input.smtpProfileId,
      messageId: result.messageId,
      folder: EmailFolder.SENT,
      fromAddress: smtpProfile.email,
      fromName: smtpProfile.alias || smtpProfile.name,
      toAddresses: input.toAddresses,
      ccAddresses: input.ccAddresses || null,
      bccAddresses: input.bccAddresses || null,
      subject: forwardSubject,
      textBody,
      htmlBody,
      receivedAt: new Date(),
      isRead: true,
      isStarred: false,
      isDraft: false,
      inReplyTo: null, // Forwards don't use inReplyTo
      references: originalEmail.messageId ? [originalEmail.messageId] : null,
    });

    return sentEmail;
  },
);
