import { makeQuery } from '../../types.js';
import { MailRule, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getMailRules = makeQuery(
  'getMailRules',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    return MailRule.findAll({
      where: { userId },
      include: [EmailAccount],
      order: [
        ['priority', 'ASC'],
        ['name', 'ASC'],
      ],
    });
  },
);
