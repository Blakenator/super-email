import { Op } from 'sequelize';
import { makeMutation } from '../../types.js';
import { Email, EmailAccount, EmailFolder } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const nukeOldEmails = makeMutation(
  'nukeOldEmails',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // Get all email accounts for this user
    const emailAccounts = await EmailAccount.findAll({
      where: { userId },
      attributes: ['id'],
    });

    const accountIds = emailAccounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return 0;
    }

    // Archive all emails in INBOX that are older than the specified date
    const [affectedCount] = await Email.update(
      { folder: EmailFolder.ARCHIVE },
      {
        where: {
          emailAccountId: { [Op.in]: accountIds },
          folder: EmailFolder.INBOX,
          receivedAt: { [Op.lt]: input.olderThan },
        },
      },
    );

    return affectedCount;
  },
);
