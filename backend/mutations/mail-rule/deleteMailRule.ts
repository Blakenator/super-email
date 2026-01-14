import { makeMutation } from '../../types.js';
import { MailRule } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const deleteMailRule = makeMutation(
  'deleteMailRule',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const rule = await MailRule.findOne({
      where: { id, userId },
    });

    if (!rule) {
      throw new Error('Rule not found');
    }

    await rule.destroy();
    return true;
  },
);
