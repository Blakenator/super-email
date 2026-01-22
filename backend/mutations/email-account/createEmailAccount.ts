import { makeMutation } from '../../types.js';
import { EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { storeImapCredentials } from '../../helpers/secrets.js';
import { getOrCreateSubscription } from '../../helpers/stripe.js';
import { ACCOUNT_LIMITS } from '../../db/models/subscription.model.js';
import { recalculateUserUsage } from '../../helpers/usage-calculator.js';

export const createEmailAccount = makeMutation(
  'createEmailAccount',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // Check if this is the first email account for the user
    const existingAccountsCount = await EmailAccount.count({
      where: { userId },
    });
    const isFirstAccount = existingAccountsCount === 0;

    // Check account limit before creating
    const subscription = await getOrCreateSubscription(userId);
    const accountLimit = ACCOUNT_LIMITS[subscription.accountTier];
    // accountLimit of -1 means unlimited
    if (accountLimit > 0 && existingAccountsCount >= accountLimit) {
      throw new Error(
        `Account limit reached (${accountLimit} accounts). Please upgrade your plan to add more email accounts.`,
      );
    }

    // If setting as default or this is the first account, unset any existing default
    const shouldBeDefault = input.isDefault || isFirstAccount;
    if (shouldBeDefault) {
      await EmailAccount.update(
        { isDefault: false },
        { where: { userId, isDefault: true } },
      );
    }

    const emailAccount = await EmailAccount.create({
      userId,
      name: input.name,
      email: input.email,
      host: input.host,
      port: input.port,
      username: input.username,
      password: input.password, // Keep in DB for backwards compatibility during migration
      accountType: input.accountType,
      useSsl: input.useSsl,
      defaultSmtpProfileId: input.defaultSmtpProfileId || null,
      isDefault: shouldBeDefault,
    });

    // Store credentials in secure secrets store
    await storeImapCredentials(emailAccount.id, {
      username: input.username,
      password: input.password,
    });

    // Recalculate usage after adding account
    await recalculateUserUsage(userId);

    return emailAccount;
  },
);
