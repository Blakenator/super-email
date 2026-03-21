import { makeQuery } from '../../types.js';
import {
  Email,
  EmailAccount,
  ImapAccountSettings,
} from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { startAsyncEmailSync } from '../../helpers/email.js';
import { buildEmailWhereClause } from '../../helpers/email-filters.js';
import { logger } from '../../helpers/logger.js';

const TWO_MINUTES_MS = 2 * 60 * 1000;

export const getEmails = makeQuery(
  'getEmails',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // Get user's email accounts with IMAP settings for sync state
    const userAccounts = await EmailAccount.findAll({
      where: { userId },
      include: [ImapAccountSettings],
    });

    if (userAccounts.length === 0) {
      return [];
    }

    const accountIds = userAccounts.map((a) => a.id);

    // Auto-sync for inbox only, and only if not viewing drafts or searching
    if ((input.folder === 'INBOX' || !input.folder) && !input.searchQuery) {
      const now = new Date();
      const accountsNeedingSync = userAccounts.filter((account) => {
        const imap = account.imapSettings;
        if (!imap) return false;
        if (imap.historicalSyncId || imap.updateSyncId) return false;
        if (!imap.lastSyncedAt) return true;
        const timeSinceSync =
          now.getTime() - new Date(imap.lastSyncedAt).getTime();
        return timeSinceSync > TWO_MINUTES_MS;
      });

      // Trigger syncs in background (don't await)
      if (accountsNeedingSync.length > 0) {
        accountsNeedingSync.forEach((account) => {
          startAsyncEmailSync(account).catch((err) => {
            logger.error('getEmails', `Auto-sync failed for ${account.email}`, {
              error: err instanceof Error ? err.message : err,
            });
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
