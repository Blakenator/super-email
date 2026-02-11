import { makeMutation } from '../../types.js';
import { Email, EmailAccount, SmtpProfile } from '../../db/models/index.js';
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

    // Verify user owns this email account
    if (email.emailAccount?.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Check if unsubscribe is available
    if (!email.unsubscribeUrl && !email.unsubscribeEmail) {
      throw new Error('No unsubscribe option available for this email');
    }

    let unsubscribeSuccess = false;
    let unsubscribeError: string | null = null;

    // Try HTTP unsubscribe first (RFC 8058 one-click unsubscribe)
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
          // Some servers require just a POST with no body
          // Try with the RFC 8058 standard body first
        });

        if (response.ok || response.status === 200 || response.status === 202) {
          logger.info('Unsubscribe', `HTTP unsubscribe successful for: ${email.unsubscribeUrl}`);
          unsubscribeSuccess = true;
        } else {
          // Some unsubscribe endpoints return 3xx redirects, try GET as fallback
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

    // If HTTP didn't work and we have an email address, try mailto unsubscribe
    if (!unsubscribeSuccess && email.unsubscribeEmail) {
      try {
        logger.info('Unsubscribe', `Sending unsubscribe email to: ${email.unsubscribeEmail}`);

        // Find a default SMTP profile for the user
        const smtpProfile = await SmtpProfile.findOne({
          where: { userId },
          order: [['isDefault', 'DESC']],
        });

        if (smtpProfile) {
          await sendEmail(smtpProfile, {
            to: [email.unsubscribeEmail],
            subject: 'Unsubscribe',
            text: 'Please unsubscribe this email address from your mailing list.',
          });

          logger.info('Unsubscribe', `Unsubscribe email sent successfully to: ${email.unsubscribeEmail}`);
          unsubscribeSuccess = true;
        } else {
          unsubscribeError =
            'No SMTP profile configured to send unsubscribe email';
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Unsubscribe', `Failed to send unsubscribe email to ${email.unsubscribeEmail}`, { error: errorMsg });
        unsubscribeError = `Failed to send unsubscribe email: ${errorMsg}`;
      }
    }

    // Mark as unsubscribed in the database regardless of success
    // This prevents repeated attempts and lets the user know they tried
    await email.update({
      isUnsubscribed: true,
    });

    if (!unsubscribeSuccess && unsubscribeError) {
      logger.warn('Unsubscribe', `Marked email ${input.emailId} as unsubscribed but actual unsubscribe may have failed: ${unsubscribeError}`);
    }

    return email;
  },
);
