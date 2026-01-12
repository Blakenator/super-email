import { makeQuery } from '../../types.js';
import { Email, EmailAccount, EmailFolder } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { Op, literal } from 'sequelize';
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

    const where: WhereOptions<any> = {
      emailAccountId: input.emailAccountId ?? accountIds,
    };

    // Handle drafts folder specially - only count drafts there
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

    const count = await Email.count({ where });

    return count;
  },
);
