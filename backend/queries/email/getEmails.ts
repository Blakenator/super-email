import { makeQuery } from '../../types.js';
import { Email, EmailAccount, EmailFolder } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { startAsyncEmailSync } from '../../helpers/email.js';
import { Op, Sequelize, literal } from 'sequelize';
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

    const where: WhereOptions<any> = {
      emailAccountId: input.emailAccountId ?? accountIds,
    };

    // Handle drafts folder specially - only show drafts there
    if (input.folder === 'DRAFTS') {
      where.isDraft = true;
      where.folder = EmailFolder.DRAFTS;
    } else if (!input.searchQuery) {
      // For all other folders (when not searching), exclude drafts
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

    // Full-text search using PostgreSQL's to_tsvector and to_tsquery
    if (input.searchQuery && input.searchQuery.trim()) {
      const searchTerm = input.searchQuery.trim();

      // Sanitize and format search term for PostgreSQL full-text search
      // Convert to tsquery format: split by spaces and join with &
      const sanitized = searchTerm
        .replace(/[^\w\s@.-]/g, '') // Remove special chars except email-related ones
        .split(/\s+/)
        .filter(Boolean)
        .map((word: string) => word + ':*') // Prefix search
        .join(' & ');

      if (sanitized) {
        // Use PostgreSQL full-text search on subject, text body, and email addresses
        where[Op.and as any] = [
          ...(where[Op.and as any] || []),
          literal(`(
            to_tsvector('english', COALESCE("subject", '')) ||
            to_tsvector('english', COALESCE("textBody", '')) ||
            to_tsvector('english', COALESCE("fromAddress", '')) ||
            to_tsvector('english', COALESCE("fromName", '')) ||
            to_tsvector('english', COALESCE(array_to_string("toAddresses", ' '), ''))
          ) @@ to_tsquery('english', '${sanitized}')`),
        ];
      }
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
