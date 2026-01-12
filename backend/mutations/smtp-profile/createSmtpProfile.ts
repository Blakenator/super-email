import { makeMutation } from '../../types.js';
import { SmtpProfile } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const createSmtpProfile = makeMutation(
  'createSmtpProfile',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // If this is marked as default, unset other defaults
    if (input.isDefault) {
      await SmtpProfile.update(
        { isDefault: false },
        { where: { userId, isDefault: true } },
      );
    }

    const smtpProfile = await SmtpProfile.create({
      userId,
      name: input.name,
      email: input.email,
      host: input.host,
      port: input.port,
      username: input.username,
      password: input.password,
      useSsl: input.useSsl,
      isDefault: input.isDefault ?? false,
    });

    return smtpProfile;
  },
);
