import { makeMutation } from '../../types.js';
import { SmtpProfile } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { storeSmtpCredentials } from '../../helpers/secrets.js';

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
      password: input.password, // Keep in DB for backwards compatibility during migration
      useSsl: input.useSsl,
      isDefault: input.isDefault ?? false,
    });

    // Store credentials in secure secrets store
    await storeSmtpCredentials(smtpProfile.id, {
      username: input.username,
      password: input.password,
    });

    return smtpProfile;
  },
);
