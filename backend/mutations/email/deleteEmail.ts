import { makeMutation } from '../../types.js';
import { Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const deleteEmail = makeMutation(
  'deleteEmail',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const email = await Email.findByPk(id);

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

    await email.destroy();

    return true;
  },
);
