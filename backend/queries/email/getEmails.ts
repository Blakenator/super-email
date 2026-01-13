import { makeQuery } from '../../types.js';
import { Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { startAsyncEmailSync } from '../../helpers/email.js';
import { buildEmailWhereClause } from '../../helpers/email-filters.js';

const TWO_MINUTES_MS = 2 * 60 * 1000;

export const getEmails = makeQuery(
  'getEmails',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // Get user's email accounts
    const userAccounts = await EmailAccount.findAll({
      where: { userId },
    });

    if (userAccounts.length === 0) {
      return [];
    }

    const accountIds = userAccounts.map((a) => a.id);

    // Auto-sync for inbox only, and only if not viewing drafts or searching
    if ((input.folder === 'INBOX' || !input.folder) && !input.searchQuery) {
      const now = new Date();
      const accountsNeedingSync = userAccounts.filter((account) => {
        if (account.syncId) return false; // Already syncing
        if (!account.lastSyncedAt) return true;
        const timeSinceSync =
          now.getTime() - new Date(account.lastSyncedAt).getTime();
        return timeSinceSync > TWO_MINUTES_MS;
      });

      // Trigger syncs in background (don't await)
      if (accountsNeedingSync.length > 0) {
        accountsNeedingSync.forEach((account) => {
          startAsyncEmailSync(account).catch((err) => {
            console.error(
              `[getEmails] Auto-sync failed for ${account.email}:`,
              err,
            );
          });
        });
      }
    }

    const where = buildEmailWhereClause(input, accountIds);

    const emails = await Email.findAll({
      where,
      include: [EmailAccount],
      order: [
        ['receivedAt', 'DESC'],
        ['createdAt', 'DESC'],
        ['id', 'ASC'],
      ],
      limit: input.limit ?? 50,
      offset: input.offset ?? 0,
    });

    return emails;
  },
);
