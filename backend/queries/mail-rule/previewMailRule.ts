import { makeQuery } from '../../types.js';
import { MailRule, Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { countMatchingEmails } from '../../helpers/rule-matcher.js';

export const previewMailRule = makeQuery(
  'previewMailRule',
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

    // Count matching emails
    return countMatchingEmails(rule, accountIds);
  },
);
