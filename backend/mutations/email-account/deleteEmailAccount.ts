import { makeMutation } from '../../types.js';
import { EmailAccount, Email, SendProfile } from '../../db/models/index.js';
import { AuthMethod } from '../../db/models/email-account.model.js';
import { requireAuth } from '../../helpers/auth.js';
import { deleteImapCredentials, deleteSmtpCredentials, getImapCredentials } from '../../helpers/secrets.js';
import { revokeToken } from '../../helpers/oauth-tokens.js';
import { recalculateUserUsage } from '../../helpers/usage-calculator.js';
import { deleteEmailBodiesByAccount } from '../../helpers/body-storage.js';
import { deleteAttachmentsByAccount } from '../../helpers/attachment-storage.js';
import { logger } from '../../helpers/logger.js';

const AUTH_METHOD_TO_PROVIDER: Record<string, 'google' | 'yahoo' | 'outlook'> = {
  [AuthMethod.OAUTH_GOOGLE]: 'google',
  [AuthMethod.OAUTH_YAHOO]: 'yahoo',
  [AuthMethod.OAUTH_OUTLOOK]: 'outlook',
};

export const deleteEmailAccount = makeMutation(
  'deleteEmailAccount',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const emailAccount = await EmailAccount.findOne({
      where: { id, userId },
    });

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    // Revoke OAuth token if this is an OAuth account (best-effort)
    const oauthProvider = AUTH_METHOD_TO_PROVIDER[emailAccount.authMethod];
    if (oauthProvider) {
      try {
        const credentials = await getImapCredentials(id);
        if (credentials?.type === 'oauth') {
          await revokeToken(oauthProvider, credentials.refreshToken);
        }
      } catch (err) {
        logger.warn('deleteEmailAccount', 'OAuth token revocation failed (continuing with deletion)', {
          error: err instanceof Error ? err.message : err,
        });
      }
    }

    // Delete associated emails first (CASCADE handles search_index, attachments, tags)
    await Email.destroy({ where: { emailAccountId: id } });

    // Bulk-delete S3 objects for this account (email bodies + attachments)
    await Promise.all([
      deleteEmailBodiesByAccount(id),
      deleteAttachmentsByAccount(id),
    ]);

    // Delete credentials from secure secrets store
    await deleteImapCredentials(id);

    // Find and delete the linked send profile (auto-created via OAuth or custom domain)
    const linkedProfile = await SendProfile.findOne({ where: { emailAccountId: id } });
    if (linkedProfile) {
      await deleteSmtpCredentials(linkedProfile.id);
      await linkedProfile.destroy();
    }

    await emailAccount.destroy();

    // Recalculate usage after deleting account
    await recalculateUserUsage(userId);

    logger.info('deleteEmailAccount', `Deleted email account ${emailAccount.email} (${id}) for user ${userId}`);
    return true;
  },
);
