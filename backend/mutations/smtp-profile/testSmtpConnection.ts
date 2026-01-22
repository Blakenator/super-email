import { makeMutation } from '../../types.js';
import { testSmtpConnection as testSmtpConnectionHelper } from '../../helpers/email.js';
import { SmtpProfile } from '../../db/models/smtp-profile.model.js';
import { getSmtpCredentials } from '../../helpers/secrets.js';

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
      if (credentials?.password) {
        password = credentials.password;
      } else if (profile.password) {
        // Fallback to DB password during migration
        password = profile.password;
      }
    }

    if (!password) {
      return {
        success: false,
        message: 'Password is required',
      };
    }

    // Create a temporary SmtpProfile-like object for testing
    const tempProfile = {
      host,
      port,
      username,
      password,
      useSsl,
      name: 'Test',
      email: username,
    } as SmtpProfile;

    const result = await testSmtpConnectionHelper(tempProfile);
    return result;
  },
);
