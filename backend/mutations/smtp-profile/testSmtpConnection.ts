import { makeMutation } from '../../types.js';
import { testSmtpConnection as testSmtpConnectionHelper } from '../../helpers/email.js';
import { SmtpProfile } from '../../db/models/smtp-profile.model.js';
import { getSmtpCredentials } from '../../helpers/secrets.js';
import { logger } from '../../helpers/logger.js';
import type { SmtpAccountSettings } from '../../db/models/smtp-account-settings.model.js';

export const testSmtpConnection = makeMutation(
  'testSmtpConnection',
  async (_parent, { input }, context) => {
    const { host, port, username, useSsl, profileId } = input;
    let { password } = input;

    // If no password provided but profileId is, retrieve saved credentials
    if (!password && profileId) {
      // Verify user owns this profile
      const profile = await SmtpProfile.findOne({
        where: { id: profileId, userId: context.userId },
      });
      
      if (!profile) {
        return {
          success: false,
          message: 'Profile not found or access denied',
        };
      }

      // Get saved credentials
      const credentials = await getSmtpCredentials(profileId);
      if (credentials?.type === 'password' && credentials.password) {
        password = credentials.password;
      } else if (profile.password) {
        password = profile.password;
      }
    }

    if (!password) {
      return {
        success: false,
        message: 'Password is required',
      };
    }

    const tempSmtpSettings = {
      host,
      port,
      useSsl,
    } as SmtpAccountSettings;

    const result = await testSmtpConnectionHelper(
      profileId ?? 'test',
      tempSmtpSettings,
      { username, password },
    );
    if (!result.success) {
      logger.warn('testSmtpConnection', `SMTP connection failed for ${host}:${port}`, { username, useSsl, error: result.message });
    }
    return result;
  },
);
