import { makeMutation } from '../../types.js';
import { MailRule, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const createMailRule = makeMutation(
  'createMailRule',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // Verify email account belongs to user if specified
    if (input.emailAccountId) {
      const account = await EmailAccount.findOne({
        where: { id: input.emailAccountId, userId },
      });
      if (!account) {
        throw new Error('Email account not found');
      }
    }

    const rule = await MailRule.create({
      userId,
      emailAccountId: input.emailAccountId || null,
      name: input.name,
      description: input.description || null,
      conditions: input.conditions || {},
      actions: input.actions || {},
      isEnabled: input.isEnabled !== false,
      priority: input.priority ?? 0,
      stopProcessing: input.stopProcessing ?? false,
    });

    return MailRule.findByPk(rule.id, { include: [EmailAccount] });
  },
);
