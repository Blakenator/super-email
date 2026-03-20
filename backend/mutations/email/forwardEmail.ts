import { makeMutation } from '../../types.js';
import { Email, EmailAccount, SendProfile, SmtpAccountSettings, EmailFolder } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { sendEmail } from '../../helpers/email.js';
import { publishMailboxUpdate } from '../../helpers/pubsub.js';
import { storeEmailBody, getEmailBody } from '../../helpers/body-storage.js';
import { upsertSearchIndex, generateBodyPreview } from '../../helpers/search-index.js';

export const forwardEmail = makeMutation(
  'forwardEmail',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const originalEmail = await Email.findByPk(input.emailId, {
      include: [EmailAccount],
    });

    if (!originalEmail) {
      throw new Error('Original email not found');
    }

    if (originalEmail.emailAccount?.userId !== userId) {
      throw new Error('Unauthorized');
    }

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

    // Fetch original body from S3
    let originalTextBody: string | null = null;
    let originalHtmlBody: string | null = null;
    if (originalEmail.bodyStorageKey) {
      try {
        const body = await getEmailBody(originalEmail.emailAccountId, originalEmail.id);
        originalTextBody = body.textBody;
        originalHtmlBody = body.htmlBody;
      } catch {
        // Fall back to empty if S3 fetch fails
      }
    }

    const forwardSubject = originalEmail.subject.startsWith('Fwd:')
      ? originalEmail.subject
      : `Fwd: ${originalEmail.subject}`;

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
    textBody += originalTextBody || '';

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
  ${originalHtmlBody || `<p>${(originalTextBody || '').replace(/\n/g, '<br>')}</p>`}
</div>
`;

    const result = await sendEmail(sendProfile, {
      to: input.toAddresses,
      cc: input.ccAddresses || undefined,
      bcc: input.bccAddresses || undefined,
      subject: forwardSubject,
      text: textBody,
      html: htmlBody,
    });

    const sentEmail = await Email.create({
      emailAccountId: input.emailAccountId,
      sendProfileId: input.sendProfileId,
      messageId: result.messageId,
      folder: EmailFolder.SENT,
      fromAddress: sendProfile.email,
      fromName: sendProfile.alias || sendProfile.name,
      toAddresses: input.toAddresses,
      ccAddresses: input.ccAddresses || null,
      bccAddresses: input.bccAddresses || null,
      subject: forwardSubject,
      bodyPreview: generateBodyPreview(textBody, htmlBody),
      receivedAt: new Date(),
      isRead: true,
      isStarred: false,
      isDraft: false,
      inReplyTo: null,
      references: originalEmail.messageId ? [originalEmail.messageId] : null,
    });

    // Store forwarded body in S3 and create search index
    const storageKey = `${input.emailAccountId}/${sentEmail.id}`;
    await sentEmail.update({ bodyStorageKey: storageKey });
    await Promise.all([
      storeEmailBody(input.emailAccountId, sentEmail.id, textBody, htmlBody),
      upsertSearchIndex({
        emailId: sentEmail.id,
        emailAccountId: input.emailAccountId,
        subject: forwardSubject,
        textBody,
        fromAddress: sendProfile.email,
        toAddresses: input.toAddresses,
        bodySize: (textBody?.length ?? 0) + (htmlBody?.length ?? 0),
      }),
    ]);

    publishMailboxUpdate(userId, {
      type: 'NEW_EMAILS',
      emailAccountId: input.emailAccountId,
    });

    return sentEmail;
  },
);
