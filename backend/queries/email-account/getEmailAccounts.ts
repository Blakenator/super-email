import { makeQuery } from '../../types.js';
import { EmailAccount, SendProfile, ImapAccountSettings } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getEmailAccounts = makeQuery(
  'getEmailAccounts',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    const accounts = await EmailAccount.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
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

    return accounts;
  },
);
