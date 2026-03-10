import { makeMutation } from '../../types.js';
import { SendProfile, SmtpAccountSettings } from '../../db/models/index.js';
import { SendProfileType } from '../../db/models/send-profile.model.js';
import { requireAuth } from '../../helpers/auth.js';
import { storeSmtpCredentials } from '../../helpers/secrets.js';
import { logger } from '../../helpers/logger.js';

export const createSendProfile = makeMutation(
  'createSendProfile',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    if (input.isDefault) {
      await SendProfile.update(
        { isDefault: false },
        { where: { userId, isDefault: true } },
      );
    }

    const profileType = input.type as SendProfileType;

    if (profileType === SendProfileType.SMTP) {
      if (!input.smtpHost || !input.smtpPort || !input.smtpUsername || !input.smtpPassword) {
        throw new Error('SMTP host, port, username, and password are required for SMTP send profiles');
      }
    }

    const sendProfile = await SendProfile.create({
      userId,
      name: input.name,
      email: input.email,
      alias: input.alias || null,
      type: profileType,
      isDefault: input.isDefault ?? false,
      providerId: input.providerId || null,
    });

    if (profileType === SendProfileType.SMTP) {
      await SmtpAccountSettings.create({
        sendProfileId: sendProfile.id,
        host: input.smtpHost!,
        port: input.smtpPort!,
        useSsl: input.smtpUseSsl ?? true,
      });

      await storeSmtpCredentials(sendProfile.id, {
        username: input.smtpUsername!,
        password: input.smtpPassword!,
      });
    }

    const result = await SendProfile.findByPk(sendProfile.id, {
      include: [{ model: SmtpAccountSettings, as: 'smtpSettings' }],
    });

    logger.info('createSendProfile', `Created send profile ${sendProfile.email} (${sendProfile.id}) type=${profileType} for user ${userId}`);
    return result;
  },
);
