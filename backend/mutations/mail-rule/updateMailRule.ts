import { makeMutation } from '../../types.js';
import { MailRule, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const updateMailRule = makeMutation(
  'updateMailRule',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const rule = await MailRule.findOne({
      where: { id: input.id, userId },
    });

    if (!rule) {
      throw new Error('Rule not found');
    }

    // Verify email account belongs to user if specified
    if (input.emailAccountId) {
      const account = await EmailAccount.findOne({
        where: { id: input.emailAccountId, userId },
      });
      if (!account) {
        throw new Error('Email account not found');
      }
    }

    if (input.emailAccountId !== undefined)
      rule.emailAccountId = input.emailAccountId;
    if (input.name !== undefined) rule.name = input.name;
    if (input.description !== undefined) rule.description = input.description;
    if (input.conditions !== undefined)
      rule.conditions = input.conditions as any;
    if (input.actions !== undefined) rule.actions = input.actions as any;
    if (input.isEnabled !== undefined) rule.isEnabled = input.isEnabled;
    if (input.priority !== undefined) rule.priority = input.priority;
    if (input.stopProcessing !== undefined)
      rule.stopProcessing = input.stopProcessing;

    await rule.save();

    return MailRule.findByPk(rule.id, { include: [EmailAccount] });
  },
);
