import { makeMutation } from '../../types.js';
import { EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const createEmailAccount = makeMutation(
  'createEmailAccount',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

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
    });

    return emailAccount;
  },
);
