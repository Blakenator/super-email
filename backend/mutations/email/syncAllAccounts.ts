import { makeMutation } from '../../types.js';
import { EmailAccount, ImapAccountSettings } from '../../db/models/index.js';
import { EmailAccountType } from '../../db/models/email-account.model.js';
import { requireAuth } from '../../helpers/auth.js';
import { startAsyncEmailSync } from '../../helpers/email.js';
import { logger } from '../../helpers/logger.js';

export const syncAllAccounts = makeMutation(
  'syncAllAccounts',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    const accounts = await EmailAccount.findAll({
      where: { userId, type: EmailAccountType.IMAP },
      include: [{ model: ImapAccountSettings, as: 'imapSettings' }],
    });

    if (accounts.length === 0) {
      return true;
    }

    for (const account of accounts) {
      logger.info('syncAllAccounts', `Starting sync for account: ${account.email}`);
      startAsyncEmailSync(account, account.imapSettings ?? undefined).catch((err) => {
        logger.error('syncAllAccounts', `Failed to start sync for ${account.email}`, { error: err instanceof Error ? err.message : err });
      });
    }

    return true;
  },
);
