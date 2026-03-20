import { makeMutation } from '../../types.js';
import { EmailAccount, ImapAccountSettings, SendProfile } from '../../db/models/index.js';
import { EmailAccountType } from '../../db/models/email-account.model.js';
import { requireAuth } from '../../helpers/auth.js';
import {
  storeImapCredentials,
  getImapCredentials,
} from '../../helpers/secrets.js';
import { logger } from '../../helpers/logger.js';

export const updateEmailAccount = makeMutation(
  'updateEmailAccount',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const emailAccount = await EmailAccount.findOne({
      where: { id: input.id, userId },
      include: [{ model: ImapAccountSettings, as: 'imapSettings' }],
    });

    if (!emailAccount) {
      throw new Error('Email account not found');
    }

    if (input.isDefault) {
      await EmailAccount.update(
        { isDefault: false },
        { where: { userId, isDefault: true } },
      );
    }

    await emailAccount.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.defaultSendProfileId !== undefined && {
        defaultSendProfileId: input.defaultSendProfileId,
      }),
      ...(input.providerId !== undefined && { providerId: input.providerId }),
      ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
    });

    if (emailAccount.type === EmailAccountType.IMAP && emailAccount.imapSettings) {
      const imapUpdates: Record<string, unknown> = {};
      if (input.imapHost !== undefined) imapUpdates.host = input.imapHost;
      if (input.imapPort !== undefined) imapUpdates.port = input.imapPort;
      if (input.imapUseSsl !== undefined) imapUpdates.useSsl = input.imapUseSsl;

      if (Object.keys(imapUpdates).length > 0) {
        await emailAccount.imapSettings.update(imapUpdates);
      }

      if (input.imapUsername !== undefined || input.imapPassword !== undefined) {
        const existingCreds = await getImapCredentials(emailAccount.id);
        const existingUsername = existingCreds?.type === 'password' ? existingCreds.username : '';
        const existingPassword = existingCreds?.type === 'password' ? existingCreds.password : '';
        const newUsername = input.imapUsername ?? existingUsername;
        const newPassword = input.imapPassword ?? existingPassword;

        await storeImapCredentials(emailAccount.id, {
          type: 'password',
          username: newUsername,
          password: newPassword,
        });
      }
    }

    await emailAccount.reload({
      include: [
        { model: ImapAccountSettings, as: 'imapSettings' },
        { model: SendProfile, as: 'defaultSendProfile', required: false },
      ],
    });

    logger.info('updateEmailAccount', `Updated email account ${emailAccount.email} (${input.id}) for user ${userId}`);
    return emailAccount;
  },
);
