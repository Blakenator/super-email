import { makeMutation } from '../../types.js';
import { EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { startAsyncEmailSync } from '../../helpers/email.js';

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

    if (emailAccount.syncId) {
      console.log(
        `[syncEmailAccount] Account ${emailAccount.email} is already syncing`,
      );
      return true; // Already syncing, return success
    }

    console.log(
      `[syncEmailAccount] Starting async sync for: ${emailAccount.email}`,
    );

    // Start async sync - returns immediately
    await startAsyncEmailSync(emailAccount);

    return true;
  },
);
