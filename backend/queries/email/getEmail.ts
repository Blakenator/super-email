import { makeQuery } from '../../types.js';
import { Email, EmailAccount, Attachment } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { getEmailBody } from '../../helpers/body-storage.js';
import { logger } from '../../helpers/logger.js';

export const getEmail = makeQuery(
  'getEmail',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const email = await Email.findByPk(input.id, {
      include: [
        {
          model: EmailAccount,
          where: { userId },
          required: true,
        },
        Attachment,
      ],
    });

    if (!email) return null;

    // Fetch body from S3 and attach to response
    if (email.bodyStorageKey) {
      try {
        const body = await getEmailBody(email.emailAccountId, email.id);
        (email as any).dataValues.textBody = body.textBody;
        (email as any).dataValues.htmlBody = body.htmlBody;
      } catch (err) {
        logger.error('getEmail', 'Failed to fetch email body from S3', {
          emailId: email.id,
          error: err instanceof Error ? err.message : err,
        });
        (email as any).dataValues.textBody = null;
        (email as any).dataValues.htmlBody = null;
      }
    }

    return email;
  },
);
