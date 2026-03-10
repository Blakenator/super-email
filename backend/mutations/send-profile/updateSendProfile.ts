import { makeMutation } from '../../types.js';
import { SendProfile, SmtpAccountSettings } from '../../db/models/index.js';
import { SendProfileType } from '../../db/models/send-profile.model.js';
import { requireAuth } from '../../helpers/auth.js';
import {
  storeSmtpCredentials,
  getSmtpCredentials,
} from '../../helpers/secrets.js';
import { logger } from '../../helpers/logger.js';

export const updateSendProfile = makeMutation(
  'updateSendProfile',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const sendProfile = await SendProfile.findOne({
      where: { id: input.id, userId },
      include: [{ model: SmtpAccountSettings, as: 'smtpSettings' }],
    });

    if (!sendProfile) {
      throw new Error('Send profile not found');
    }

    if (input.isDefault) {
      await SendProfile.update(
        { isDefault: false },
        { where: { userId, isDefault: true } },
      );
    }

    await sendProfile.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.alias !== undefined && { alias: input.alias }),
      ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
      ...(input.providerId !== undefined && { providerId: input.providerId }),
    });

    if (sendProfile.type === SendProfileType.SMTP && sendProfile.smtpSettings) {
      const smtpUpdates: Record<string, unknown> = {};
      if (input.smtpHost !== undefined) smtpUpdates.host = input.smtpHost;
      if (input.smtpPort !== undefined) smtpUpdates.port = input.smtpPort;
      if (input.smtpUseSsl !== undefined) smtpUpdates.useSsl = input.smtpUseSsl;

      if (Object.keys(smtpUpdates).length > 0) {
        await sendProfile.smtpSettings.update(smtpUpdates);
      }

      if (input.smtpUsername !== undefined || input.smtpPassword !== undefined) {
        const existingCreds = await getSmtpCredentials(sendProfile.id);
        const newUsername = input.smtpUsername ?? existingCreds?.username ?? '';
        const newPassword = input.smtpPassword ?? existingCreds?.password ?? '';

        await storeSmtpCredentials(sendProfile.id, {
          username: newUsername,
          password: newPassword,
        });
      }
    }

    await sendProfile.reload({
      include: [{ model: SmtpAccountSettings, as: 'smtpSettings' }],
    });

    logger.info('updateSendProfile', `Updated send profile ${sendProfile.email} (${input.id}) for user ${userId}`);
    return sendProfile;
  },
);
