import { makeMutation } from '../../types.js';
import { EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const updateEmailAccount = makeMutation(
  'updateEmailAccount',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const emailAccount = await EmailAccount.findOne({
      where: { id: input.id, userId },
    });

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    // If setting as default, unset any existing default for this user
    if (input.isDefault) {
      await EmailAccount.update(
        { isDefault: false },
        { where: { userId, isDefault: true } },
      );
    }

    await emailAccount.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.host !== undefined && { host: input.host }),
      ...(input.port !== undefined && { port: input.port }),
      ...(input.username !== undefined && { username: input.username }),
      ...(input.password !== undefined && { password: input.password }),
      ...(input.useSsl !== undefined && { useSsl: input.useSsl }),
      ...(input.defaultSmtpProfileId !== undefined && {
        defaultSmtpProfileId: input.defaultSmtpProfileId,
      }),
      ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
    });

    return emailAccount;
  },
);
