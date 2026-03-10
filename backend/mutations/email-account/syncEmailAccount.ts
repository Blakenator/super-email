import { makeMutation } from '../../types.js';
import { EmailAccount, ImapAccountSettings } from '../../db/models/index.js';
import { EmailAccountType } from '../../db/models/email-account.model.js';
import { requireAuth } from '../../helpers/auth.js';
import { startAsyncEmailSync } from '../../helpers/email.js';
import { logger } from '../../helpers/logger.js';

export const syncEmailAccount = makeMutation(
  'syncEmailAccount',
  async (_parent, { input: { emailAccountId } }, context) => {
    const userId = requireAuth(context);

    const emailAccount = await EmailAccount.findOne({
      where: { id: emailAccountId, userId },
      include: [{ model: ImapAccountSettings, as: 'imapSettings' }],
    });

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    if (emailAccount.type === EmailAccountType.CUSTOM_DOMAIN) {
      throw new Error('Custom domain accounts do not support IMAP sync');
    }

    logger.info('syncEmailAccount', `Starting async sync for: ${emailAccount.email}`);

    await startAsyncEmailSync(emailAccount, emailAccount.imapSettings ?? undefined);

    return true;
  },
);
