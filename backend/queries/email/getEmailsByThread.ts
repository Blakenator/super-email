import { makeQuery } from '../../types.js';
import { Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { Op } from 'sequelize';

export const getEmailsByThread = makeQuery(
  'getEmailsByThread',
  async (_parent, { threadId }, context) => {
    const userId = requireAuth(context);

    // Get user's email accounts
    const userAccounts = await EmailAccount.findAll({
      where: { userId },
      attributes: ['id'],
    });

    if (userAccounts.length === 0) {
      return [];
    }

    const accountIds = userAccounts.map((a) => a.id);

    // Get all emails in this thread, ordered by date
    const emails = await Email.findAll({
      where: {
        threadId,
        emailAccountId: { [Op.in]: accountIds },
      },
      order: [['receivedAt', 'ASC']],
    });

    return emails;
  },
);
