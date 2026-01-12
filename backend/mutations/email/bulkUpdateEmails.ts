import { makeMutation } from '../../types.js';
import { Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { Op } from 'sequelize';

export const bulkUpdateEmails = makeMutation(
  'bulkUpdateEmails',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    if (input.ids.length === 0) {
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

    // Update emails that belong to user's accounts
    await Email.update(updatePayload, {
      where: {
        id: { [Op.in]: input.ids },
        emailAccountId: { [Op.in]: accountIds },
      },
    });

    // Return the updated emails
    const updatedEmails = await Email.findAll({
      where: {
        id: { [Op.in]: input.ids },
        emailAccountId: { [Op.in]: accountIds },
      },
    });

    console.log(`[bulkUpdateEmails] Updated ${updatedEmails.length} emails`);
    return updatedEmails;
  },
);
