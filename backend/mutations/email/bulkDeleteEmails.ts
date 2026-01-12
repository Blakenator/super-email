import { makeMutation } from '../../types.js';
import { Email, EmailAccount, EmailFolder } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { Op } from 'sequelize';

export const bulkDeleteEmails = makeMutation(
  'bulkDeleteEmails',
  async (_parent, { ids }, context) => {
    const userId = requireAuth(context);

    if (ids.length === 0) {
      return 0;
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

    // Find emails to process
    const emails = await Email.findAll({
      where: {
        id: { [Op.in]: ids },
        emailAccountId: { [Op.in]: accountIds },
      },
    });

    let movedCount = 0;
    let deletedCount = 0;

    for (const email of emails) {
      if (email.folder === EmailFolder.TRASH) {
        // Permanently delete if already in trash
        await email.destroy();
        deletedCount++;
      } else {
        // Move to trash (soft delete)
        await email.update({ folder: EmailFolder.TRASH });
        movedCount++;
      }
    }

    console.log(`[bulkDeleteEmails] Moved ${movedCount} to trash, permanently deleted ${deletedCount}`);
    return movedCount + deletedCount;
  },
);
