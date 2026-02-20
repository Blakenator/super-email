import { makeMutation } from '../../types.js';
import { Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { Op } from 'sequelize';
import { logger } from '../../helpers/logger.js';
import type { WhereOptions } from 'sequelize';

export const bulkUpdateEmails = makeMutation(
  'bulkUpdateEmails',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);
    const hasIds = input.ids && input.ids.length > 0;
    const hasFromAddress = !!input.fromAddress;

    if (!hasIds && !hasFromAddress) {
      return [];
    }

    // Get user's email account IDs for authorization
    const userAccounts = await EmailAccount.findAll({
      where: { userId },
      attributes: ['id'],
    });
    const accountIds = userAccounts.map((a) => a.id);

    if (accountIds.length === 0) {
      throw new Error('No email accounts found');
    }

    // Build update payload
    const updatePayload: Record<string, boolean | string | null> = {};

    if (input.isRead !== undefined && input.isRead !== null) {
      updatePayload.isRead = input.isRead;
    }

    if (input.isStarred !== undefined && input.isStarred !== null) {
      updatePayload.isStarred = input.isStarred;
    }

    if (input.folder) {
      updatePayload.folder = input.folder;
    }

    if (Object.keys(updatePayload).length === 0) {
      return [];
    }

    // Build where clause: by IDs or by fromAddress (scoped to INBOX)
    const whereClause: WhereOptions = { emailAccountId: { [Op.in]: accountIds } };

    if (hasIds) {
      (whereClause as any).id = { [Op.in]: input.ids };
    } else {
      (whereClause as any).fromAddress = input.fromAddress;
      (whereClause as any).folder = 'INBOX';
    }

    const [affectedCount] = await Email.update(updatePayload, { where: whereClause });

    // When using fromAddress, skip refetching potentially thousands of rows
    if (hasFromAddress && !hasIds) {
      logger.info('bulkUpdateEmails', `Updated ${affectedCount} emails by fromAddress for user ${userId}`, {
        fromAddress: input.fromAddress,
      });
      return [];
    }

    const updatedEmails = await Email.findAll({ where: whereClause });

    logger.info('bulkUpdateEmails', `Updated ${updatedEmails.length} emails for user ${userId}`);
    return updatedEmails;
  },
);
