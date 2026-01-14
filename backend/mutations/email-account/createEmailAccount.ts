import { makeMutation } from '../../types.js';
import { EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const createEmailAccount = makeMutation(
  'createEmailAccount',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // Check if this is the first email account for the user
    const existingAccountsCount = await EmailAccount.count({
      where: { userId },
    });
    const isFirstAccount = existingAccountsCount === 0;

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
      password: input.password,
      accountType: input.accountType,
      useSsl: input.useSsl,
      defaultSmtpProfileId: input.defaultSmtpProfileId || null,
      isDefault: shouldBeDefault,
    });

    return emailAccount;
  },
);
