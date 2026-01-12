import { makeMutation } from '../../types.js';
import { testSmtpConnection as testSmtpConnectionHelper } from '../../helpers/email.js';
import { SmtpProfile } from '../../db/models/smtp-profile.model.js';

export const testSmtpConnection = makeMutation(
  'testSmtpConnection',
  async (_parent, { input }) => {
    const { host, port, username, password, useSsl } = input;

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
