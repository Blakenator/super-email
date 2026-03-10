import { makeMutation } from '../../types.js';
import { EmailAccount, ImapAccountSettings, SendProfile } from '../../db/models/index.js';
import { EmailAccountType } from '../../db/models/email-account.model.js';
import { requireAuth } from '../../helpers/auth.js';
import { storeImapCredentials } from '../../helpers/secrets.js';
import { getOrCreateSubscription } from '../../helpers/stripe.js';
import { ACCOUNT_LIMITS } from '../../db/models/subscription.constants.js';
import { recalculateUserUsage } from '../../helpers/usage-calculator.js';
import { logger } from '../../helpers/logger.js';

export const createEmailAccount = makeMutation(
  'createEmailAccount',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const existingAccountsCount = await EmailAccount.count({
      where: { userId },
    });
    const isFirstAccount = existingAccountsCount === 0;

    const subscription = await getOrCreateSubscription(userId);
    const accountLimit = ACCOUNT_LIMITS[subscription.accountTier];
    if (accountLimit > 0 && existingAccountsCount >= accountLimit) {
      throw new Error(
        `Account limit reached (${accountLimit} accounts). Please upgrade your plan to add more email accounts.`,
      );
    }

    const shouldBeDefault = input.isDefault || isFirstAccount;
    if (shouldBeDefault) {
      await EmailAccount.update(
        { isDefault: false },
        { where: { userId, isDefault: true } },
      );
    }

    const accountType = input.type as EmailAccountType;

    if (accountType === EmailAccountType.IMAP) {
      if (!input.imapHost || !input.imapPort || !input.imapUsername || !input.imapPassword) {
        throw new Error('IMAP host, port, username, and password are required for IMAP accounts');
      }
    }

    const emailAccount = await EmailAccount.create({
      userId,
      name: input.name,
      email: input.email,
      type: accountType,
      defaultSendProfileId: input.defaultSendProfileId || null,
      providerId: input.providerId || null,
      isDefault: shouldBeDefault,
    });

    if (accountType === EmailAccountType.IMAP) {
      await ImapAccountSettings.create({
        emailAccountId: emailAccount.id,
        host: input.imapHost!,
        port: input.imapPort!,
        accountType: input.imapAccountType || 'IMAP',
        useSsl: input.imapUseSsl ?? true,
      });

      await storeImapCredentials(emailAccount.id, {
        username: input.imapUsername!,
        password: input.imapPassword!,
      });
    }

    const result = await EmailAccount.findByPk(emailAccount.id, {
      include: [
        { model: ImapAccountSettings, as: 'imapSettings' },
        { model: SendProfile, as: 'defaultSendProfile', required: false },
      ],
    });

    await recalculateUserUsage(userId);

    logger.info('createEmailAccount', `Created email account ${emailAccount.email} (${emailAccount.id}) type=${accountType} for user ${userId}`);
    return result;
  },
);
