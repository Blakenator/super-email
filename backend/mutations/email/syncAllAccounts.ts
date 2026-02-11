import { makeMutation } from '../../types.js';
import { EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { startAsyncEmailSync } from '../../helpers/email.js';
import { logger } from '../../helpers/logger.js';

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

    // Start async syncs for all accounts (don't block)
    for (const account of accounts) {
      logger.info('syncAllAccounts', `Starting sync for account: ${account.email}`);
      startAsyncEmailSync(account).catch((err) => {
        logger.error('syncAllAccounts', `Failed to start sync for ${account.email}`, { error: err instanceof Error ? err.message : err });
      });
    }

    return true;
  },
);
