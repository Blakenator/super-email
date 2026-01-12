import { makeQuery } from '../../types.js';
import { Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import type { WhereOptions } from 'sequelize';

export const getEmailCount = makeQuery(
  'getEmailCount',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // Get user's email account IDs
    const userAccounts = await EmailAccount.findAll({
      where: { userId },
      attributes: ['id'],
    });

    const accountIds = userAccounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return 0;
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

    const count = await Email.count({ where });

    return count;
  },
);
