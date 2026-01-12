import { makeQuery } from '../../types.js';
import { EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getEmailAccounts = makeQuery(
  'getEmailAccounts',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    const accounts = await EmailAccount.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    return accounts;
  },
);
