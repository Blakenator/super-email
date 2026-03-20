import { makeMutation } from '../../types.js';
import { testSmtpConnection as testSmtpConnectionHelper } from '../../helpers/email.js';
import { SendProfile, SmtpAccountSettings } from '../../db/models/index.js';
import { getSmtpCredentials } from '../../helpers/secrets.js';
import { logger } from '../../helpers/logger.js';

export const testSmtpConnection = makeMutation(
  'testSmtpConnection',
  async (_parent, { input }, context) => {
    const { host, port, username, useSsl, profileId } = input;
    let { password } = input;

    if (!password && profileId) {
      const profile = await SendProfile.findOne({
        where: { id: profileId, userId: context.userId },
      });

      if (!profile) {
        return {
          success: false,
          message: 'Profile not found or access denied',
        };
      }

      const credentials = await getSmtpCredentials(profileId);
      if (credentials?.type === 'password' && credentials.password) {
        password = credentials.password;
      }
    }

    if (!password) {
      return {
        success: false,
        message: 'Password is required',
      };
    }

    const tempSettings = { host, port, useSsl } as SmtpAccountSettings;
    const result = await testSmtpConnectionHelper(
      profileId || 'test',
      tempSettings,
      { username, password },
    );

    if (!result.success) {
      logger.warn('testSmtpConnection', `SMTP connection failed for ${host}:${port}`, { username, useSsl, error: result.message });
    }
    return result;
  },
);
