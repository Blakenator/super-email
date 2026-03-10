import { makeQuery } from '../../types.js';
import { EmailAccount, SendProfile, ImapAccountSettings } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getEmailAccount = makeQuery(
  'getEmailAccount',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const account = await EmailAccount.findOne({
      where: { id, userId },
      include: [
        {
          model: SendProfile,
          as: 'defaultSendProfile',
          required: false,
        },
        {
          model: ImapAccountSettings,
          as: 'imapSettings',
          required: false,
        },
      ],
    });

    return account;
  },
);
