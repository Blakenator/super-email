import { makeMutation } from '../../types.js';
import { EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { syncEmailsFromAccount } from '../../helpers/email.js';

export const syncAllAccounts = makeMutation(
  'syncAllAccounts',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    const accounts = await EmailAccount.findAll({
      where: { userId },
    });

    if (accounts.length === 0) {
      return true;
    }

    const results = await Promise.allSettled(
      accounts.map(async (account) => {
        console.log(`Syncing account: ${account.email}`);
        const result = await syncEmailsFromAccount(account);
        await account.update({ lastSyncedAt: new Date() });
        return result;
      }),
    );

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some accounts failed to sync:', failures);
    }

    return true;
  },
);
