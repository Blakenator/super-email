import { makeQuery } from '../../types.js';
import { Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { fn, col, literal, Sequelize } from 'sequelize';

export interface EmailSource {
  fromAddress: string;
  fromName: string | null;
  count: number;
}

export const getTopEmailSources = makeQuery(
  'getTopEmailSources',
  async (_parent, { limit = 10 }, context) => {
    const userId = requireAuth(context);

    // Get user's email accounts
    const userAccounts = await EmailAccount.findAll({
      where: { userId },
    });

    if (userAccounts.length === 0) {
      return [];
    }

    const accountIds = userAccounts.map((a) => a.id);

    // Get top senders from non-archived, non-deleted inbox emails
    // Exclude drafts to match the behavior of getEmailCount
    // Group by LOWER(fromAddress) to match case-insensitive behavior of getEmailCount
    const results = await Email.findAll({
      attributes: [
        [fn('MIN', col('fromAddress')), 'fromAddress'], // Use MIN to get a canonical case version
        [fn('MAX', col('fromName')), 'fromName'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        emailAccountId: accountIds,
        folder: 'INBOX', // Only inbox emails, not archived or deleted
        isDraft: false, // Exclude drafts to match getEmailCount behavior
      },
      group: [fn('LOWER', col('fromAddress'))], // Group case-insensitively
      order: [[literal('count'), 'DESC']],
      limit,
      raw: true,
    }) as unknown as { fromAddress: string; fromName: string | null; count: string }[];

    return results.map((r) => ({
      fromAddress: r.fromAddress,
      fromName: r.fromName,
      count: parseInt(r.count, 10),
    }));
  },
);
