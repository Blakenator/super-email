import { makeMutation } from '../../types.js';
import { EmailAccount, Email } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { deleteImapCredentials } from '../../helpers/secrets.js';
import { recalculateUserUsage } from '../../helpers/usage-calculator.js';
import { logger } from '../../helpers/logger.js';

export const deleteEmailAccount = makeMutation(
  'deleteEmailAccount',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const emailAccount = await EmailAccount.findOne({
      where: { id, userId },
    });

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    // Delete associated emails first
    await Email.destroy({ where: { emailAccountId: id } });

    // Delete credentials from secure secrets store
    await deleteImapCredentials(id);

    await emailAccount.destroy();

    // Recalculate usage after deleting account
    await recalculateUserUsage(userId);

    logger.info('deleteEmailAccount', `Deleted email account ${emailAccount.email} (${id}) for user ${userId}`);
    return true;
  },
);
