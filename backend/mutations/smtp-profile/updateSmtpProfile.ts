import { makeMutation } from '../../types.js';
import { SmtpProfile } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import {
  storeSmtpCredentials,
  getSmtpCredentials,
} from '../../helpers/secrets.js';

export const updateSmtpProfile = makeMutation(
  'updateSmtpProfile',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const smtpProfile = await SmtpProfile.findOne({
      where: { id: input.id, userId },
    });

    if (!smtpProfile) {
      throw new Error('SMTP profile not found');
    }

    // If setting this as default, unset other defaults
    if (input.isDefault) {
      await SmtpProfile.update(
        { isDefault: false },
        { where: { userId, isDefault: true } },
      );
    }

    await smtpProfile.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.host !== undefined && { host: input.host }),
      ...(input.port !== undefined && { port: input.port }),
      ...(input.username !== undefined && { username: input.username }),
      ...(input.password !== undefined && { password: input.password }),
      ...(input.useSsl !== undefined && { useSsl: input.useSsl }),
      ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
    });

    // Update credentials in secure secrets store if username or password changed
    if (input.username !== undefined || input.password !== undefined) {
      // Get existing credentials to merge with updates
      const existingCreds = await getSmtpCredentials(smtpProfile.id);
      const newUsername =
        input.username ?? existingCreds?.username ?? smtpProfile.username;
      const newPassword =
        input.password ?? existingCreds?.password ?? smtpProfile.password;

      await storeSmtpCredentials(smtpProfile.id, {
        username: newUsername,
        password: newPassword,
      });
    }

    return smtpProfile;
  },
);
