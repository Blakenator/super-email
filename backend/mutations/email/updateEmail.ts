import { makeMutation } from '../../types.js';
import { Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const updateEmail = makeMutation(
  'updateEmail',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // First find the email
    const email = await Email.findByPk(input.id, {
      include: [EmailAccount],
    });

    if (!email) {
      throw new Error('Email not found');
    }

    // Verify ownership through email account
    const emailAccount = await EmailAccount.findOne({
      where: { id: email.emailAccountId, userId },
    });

    if (!emailAccount) {
      throw new Error('Email not found or access denied');
    }

    await email.update({
      ...(input.isRead !== undefined && { isRead: input.isRead }),
      ...(input.isStarred !== undefined && { isStarred: input.isStarred }),
      ...(input.folder !== undefined && { folder: input.folder }),
    });

    return email;
  },
);
