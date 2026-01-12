import { makeQuery } from '../../types.js';
import { Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import type { WhereOptions } from 'sequelize';

export const getEmails = makeQuery(
  'getEmails',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // Get user's email account IDs
    const userAccounts = await EmailAccount.findAll({
      where: { userId },
      attributes: ['id'],
    });

    const accountIds = userAccounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return [];
    }

    const where: WhereOptions = {
      emailAccountId: input.emailAccountId ?? accountIds,
    };

    if (input.folder) {
      where.folder = input.folder;
    }

    if (input.isRead !== undefined && input.isRead !== null) {
      where.isRead = input.isRead;
    }

    if (input.isStarred !== undefined && input.isStarred !== null) {
      where.isStarred = input.isStarred;
    }

    const emails = await Email.findAll({
      where,
      include: [EmailAccount],
      order: [['receivedAt', 'DESC']],
      limit: input.limit ?? 50,
      offset: input.offset ?? 0,
    });

    return emails;
  },
);
