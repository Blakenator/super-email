import { makeQuery } from '../../types.js';
import { Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { Op } from 'sequelize';
import { getEmailBodies } from '../../helpers/body-storage.js';
import { logger } from '../../helpers/logger.js';

export const getEmailsByThread = makeQuery(
  'getEmailsByThread',
  async (_parent, { threadId }, context) => {
    const userId = requireAuth(context);

    const userAccounts = await EmailAccount.findAll({
      where: { userId },
      attributes: ['id'],
    });

    if (userAccounts.length === 0) {
      return [];
    }

    const accountIds = userAccounts.map((a) => a.id);

    const emails = await Email.findAll({
      where: {
        threadId,
        emailAccountId: { [Op.in]: accountIds },
      },
      order: [['receivedAt', 'ASC']],
    });

    // Eager-parallel fetch all bodies from S3
    if (emails.length > 0) {
      const keys = emails
        .filter((e) => e.bodyStorageKey)
        .map((e) => ({ emailAccountId: e.emailAccountId, emailId: e.id }));

      try {
        const bodies = await getEmailBodies(keys);

        for (const email of emails) {
          const body = bodies.get(email.id);
          if (body) {
            (email as any).dataValues.textBody = body.textBody;
            (email as any).dataValues.htmlBody = body.htmlBody;
          } else {
            (email as any).dataValues.textBody = null;
            (email as any).dataValues.htmlBody = null;
          }
        }
      } catch (err) {
        logger.error('getEmailsByThread', 'Failed to fetch thread bodies from S3', {
          threadId,
          error: err instanceof Error ? err.message : err,
        });
      }
    }

    return emails;
  },
);
