import { makeMutation } from '../../types.js';
import { Email, EmailAccount, SendProfile, SmtpAccountSettings } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { sendEmail } from '../../helpers/email.js';
import { logger } from '../../helpers/logger.js';

export const unsubscribe = makeMutation(
  'unsubscribe',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const email = await Email.findByPk(input.emailId, {
      include: [EmailAccount],
    });

    if (!email) {
      throw new Error('Email not found');
    }

    if (email.emailAccount?.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (!email.unsubscribeUrl && !email.unsubscribeEmail) {
      throw new Error('No unsubscribe option available for this email');
    }

    let unsubscribeSuccess = false;
    let unsubscribeError: string | null = null;

    if (email.unsubscribeUrl) {
      try {
        logger.info('Unsubscribe', `Sending POST request to: ${email.unsubscribeUrl}`);

        const response = await fetch(email.unsubscribeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'SuperMail/1.0 (Unsubscribe)',
          },
          body: 'List-Unsubscribe=One-Click',
        });

        if (response.ok || response.status === 200 || response.status === 202) {
          logger.info('Unsubscribe', `HTTP unsubscribe successful for: ${email.unsubscribeUrl}`);
          unsubscribeSuccess = true;
        } else {
          logger.info('Unsubscribe', `POST returned ${response.status}, trying GET for: ${email.unsubscribeUrl}`);
          const getResponse = await fetch(email.unsubscribeUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'SuperMail/1.0 (Unsubscribe)',
            },
          });

          if (getResponse.ok) {
            logger.info('Unsubscribe', `GET unsubscribe successful for: ${email.unsubscribeUrl}`);
            unsubscribeSuccess = true;
          } else {
            unsubscribeError = `HTTP unsubscribe failed with status ${getResponse.status}`;
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Unsubscribe', `HTTP request failed for ${email.unsubscribeUrl}`, { error: errorMsg });
        unsubscribeError = `Failed to contact unsubscribe URL: ${errorMsg}`;
      }
    }

    if (!unsubscribeSuccess && email.unsubscribeEmail) {
      try {
        logger.info('Unsubscribe', `Sending unsubscribe email to: ${email.unsubscribeEmail}`);

        const sendProfile = await SendProfile.findOne({
          where: { userId },
          include: [{ model: SmtpAccountSettings, as: 'smtpSettings' }],
          order: [['isDefault', 'DESC']],
        });

        if (sendProfile) {
          await sendEmail(sendProfile, {
            to: [email.unsubscribeEmail],
            subject: 'Unsubscribe',
            text: 'Please unsubscribe this email address from your mailing list.',
          });

          logger.info('Unsubscribe', `Unsubscribe email sent successfully to: ${email.unsubscribeEmail}`);
          unsubscribeSuccess = true;
        } else {
          unsubscribeError =
            'No send profile configured to send unsubscribe email';
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Unsubscribe', `Failed to send unsubscribe email to ${email.unsubscribeEmail}`, { error: errorMsg });
        unsubscribeError = `Failed to send unsubscribe email: ${errorMsg}`;
      }
    }

    await email.update({
      isUnsubscribed: true,
    });

    if (!unsubscribeSuccess && unsubscribeError) {
      logger.warn('Unsubscribe', `Marked email ${input.emailId} as unsubscribed but actual unsubscribe may have failed: ${unsubscribeError}`);
    }

    return email;
  },
);
