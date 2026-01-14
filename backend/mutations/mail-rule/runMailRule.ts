import { makeMutation } from '../../types.js';
import { MailRule, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import {
  countMatchingEmails,
  applyRuleToMatchingEmails,
} from '../../helpers/rule-matcher.js';

export const runMailRule = makeMutation(
  'runMailRule',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const rule = await MailRule.findOne({
      where: { id, userId },
    });

    if (!rule) {
      throw new Error('Rule not found');
    }

    // Get user's email accounts
    const userAccounts = await EmailAccount.findAll({
      where: { userId },
      attributes: ['id'],
    });
    const accountIds = userAccounts.map((a) => a.id);

    // Count matching emails first
    const matchedCount = await countMatchingEmails(rule, accountIds);

    // Apply rule to all matching emails
    const processedCount = await applyRuleToMatchingEmails(
      rule,
      accountIds,
      userId,
    );

    return { matchedCount, processedCount };
  },
);
