import { makeQuery } from '../../types.js';
import { Email, EmailAccount, EmailFolder } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { syncEmailsFromAccount } from '../../helpers/email.js';
import type { WhereOptions } from 'sequelize';

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

    // Auto-sync for inbox only, and only if not viewing drafts
    if (input.folder === 'INBOX' || !input.folder) {
      const now = new Date();
      const accountsNeedingSync = userAccounts.filter((account) => {
        if (account.isSyncing) return false;
        if (!account.lastSyncedAt) return true;
        const timeSinceSync =
          now.getTime() - new Date(account.lastSyncedAt).getTime();
        return timeSinceSync > TWO_MINUTES_MS;
      });

      // Trigger syncs in background (don't await)
      if (accountsNeedingSync.length > 0) {
        Promise.all(
          accountsNeedingSync.map(async (account) => {
            try {
              console.log(
                `[getEmails] Auto-syncing account ${account.email} (last sync: ${account.lastSyncedAt})`,
              );
              await syncEmailsFromAccount(account);
              await account.update({ lastSyncedAt: new Date() });
            } catch (err) {
              console.error(
                `[getEmails] Auto-sync failed for ${account.email}:`,
                err,
              );
            }
          }),
        ).catch((err) => {
          console.error('[getEmails] Auto-sync batch failed:', err);
        });
      }
    }

    const where: WhereOptions = {
      emailAccountId: input.emailAccountId ?? accountIds,
    };

    // Handle drafts folder specially - only show drafts there
    if (input.folder === 'DRAFTS') {
      where.isDraft = true;
      where.folder = EmailFolder.DRAFTS;
    } else {
      // For all other folders, exclude drafts
      where.isDraft = false;
      if (input.folder) {
        where.folder = input.folder;
      }
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
