import { makeMutation } from '../../types.js';
import { testImapConnection } from '../../helpers/imap-client.js';
import { getImapCredentials } from '../../helpers/secrets.js';
import { EmailAccount } from '../../db/models/email-account.model.js';
import { logger } from '../../helpers/logger.js';

export const testEmailAccountConnection = makeMutation(
  'testImapConnection',
  async (_parent, { input }, context) => {
    const { host, port, username, accountType, useSsl, accountId } = input;
    let { password } = input;

    if (!password && accountId) {
      const account = await EmailAccount.findOne({
        where: { id: accountId, userId: context.userId },
      });

      if (!account) {
        return {
          success: false,
          message: 'Account not found or access denied',
        };
      }

      const credentials = await getImapCredentials(accountId);
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

    if (accountType === 'IMAP') {
      const result = await testImapConnection(
        host,
        port,
        username,
        password,
        useSsl,
      );
      if (!result.success) {
        logger.warn('testImapConnection', `IMAP connection failed for ${host}:${port}`, { username, useSsl, error: result.error });
      }
      return {
        success: result.success,
        message: result.success
          ? 'IMAP connection successful'
          : `IMAP connection failed: ${result.error}`,
      };
    } else if (accountType === 'POP3') {
      return {
        success: false,
        message: 'POP3 connection testing is not yet implemented',
      };
    }

    return {
      success: false,
      message: 'Unknown account type',
    };
  },
);
