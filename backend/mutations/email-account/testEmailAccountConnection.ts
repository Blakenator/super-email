import { makeMutation } from '../../types.js';
import { testImapConnection } from '../../helpers/imap-sync.js';
import { EmailAccountType } from '../../__generated__/resolvers-types.js';
import { getImapCredentials } from '../../helpers/secrets.js';
import { EmailAccount } from '../../db/models/email-account.model.js';
import { logger } from '../../helpers/logger.js';

export const testEmailAccountConnection = makeMutation(
  'testEmailAccountConnection',
  async (_parent, { input }, context) => {
    const { host, port, username, accountType, useSsl, accountId } = input;
    let { password } = input;

    // If no password provided but accountId is, retrieve saved credentials
    if (!password && accountId) {
      // Verify user owns this account
      const account = await EmailAccount.findOne({
        where: { id: accountId, userId: context.userId },
      });
      
      if (!account) {
        return {
          success: false,
          message: 'Account not found or access denied',
        };
      }

      // Get saved credentials
      const credentials = await getImapCredentials(accountId);
      if (credentials?.password) {
        password = credentials.password;
      } else if (account.password) {
        // Fallback to DB password during migration
        password = account.password;
      }
    }

    if (!password) {
      return {
        success: false,
        message: 'Password is required',
      };
    }

    if (accountType === EmailAccountType.Imap) {
      const result = await testImapConnection(
        host,
        port,
        username,
        password,
        useSsl,
      );
      if (!result.success) {
        logger.warn('testEmailAccountConnection', `IMAP connection failed for ${host}:${port}`, { username, useSsl, error: result.error });
      }
      return {
        success: result.success,
        message: result.success
          ? 'IMAP connection successful'
          : `IMAP connection failed: ${result.error}`,
      };
    } else if (accountType === EmailAccountType.Pop3) {
      // POP3 not yet implemented
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
