import { makeQuery } from '../../types.js';
import { MailRule, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getMailRule = makeQuery(
  'getMailRule',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    return MailRule.findOne({
      where: { id, userId },
      include: [EmailAccount],
    });
  },
);
