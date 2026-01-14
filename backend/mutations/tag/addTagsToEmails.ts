import { makeMutation } from '../../types.js';
import { Email, EmailAccount, Tag, EmailTag } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { Op } from 'sequelize';

export const addTagsToEmails = makeMutation(
  'addTagsToEmails',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // Verify all tags belong to user
    const tags = await Tag.findAll({
      where: { id: { [Op.in]: input.tagIds }, userId },
    });

    if (tags.length !== input.tagIds.length) {
      throw new Error('One or more tags not found');
    }

    // Verify all emails belong to user's accounts
    const userAccounts = await EmailAccount.findAll({
      where: { userId },
      attributes: ['id'],
    });
    const accountIds = userAccounts.map((a) => a.id);

    const emails = await Email.findAll({
      where: {
        id: { [Op.in]: input.emailIds },
        emailAccountId: { [Op.in]: accountIds },
      },
    });

    if (emails.length !== input.emailIds.length) {
      throw new Error('One or more emails not found');
    }

    // Create email-tag associations (ignore duplicates)
    const associations = [];
    for (const emailId of input.emailIds) {
      for (const tagId of input.tagIds) {
        associations.push({ emailId, tagId });
      }
    }

    await EmailTag.bulkCreate(associations, {
      ignoreDuplicates: true,
    });

    // Return updated emails with tags
    return Email.findAll({
      where: { id: { [Op.in]: input.emailIds } },
      include: [{ model: Tag, through: { attributes: [] } }],
    });
  },
);
