import { makeMutation } from '../../types.js';
import { EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { syncEmailsFromAccount } from '../../helpers/email.js';

export const syncEmailAccount = makeMutation(
  'syncEmailAccount',
  async (_parent, { input: { emailAccountId } }, context) => {
    const userId = requireAuth(context);

    const emailAccount = await EmailAccount.findOne({
      where: { id: emailAccountId, userId },
    });

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    console.log(`Starting email sync for account: ${emailAccount.email}`);

    const result = await syncEmailsFromAccount(emailAccountId);

    console.log(`Sync result: ${result.synced} emails synced`);

    if (result.errors.length > 0) {
      console.warn(`Sync errors:`, result.errors);
      // If we synced some emails but had some errors, still update lastSyncedAt
      if (result.synced === 0 && result.errors.length > 0) {
        throw new Error(`Sync failed: ${result.errors[0]}`);
      }
    }

    await emailAccount.update({ lastSyncedAt: new Date() });

    return true;
  },
);
