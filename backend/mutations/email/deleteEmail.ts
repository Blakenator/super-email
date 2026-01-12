import { makeMutation } from '../../types.js';
import { Email, EmailAccount, EmailFolder } from '../../db/models/index.js';
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

    // If already in trash, permanently delete
    if (email.folder === EmailFolder.TRASH) {
      await email.destroy();
    } else {
      // Move to trash (soft delete)
      await email.update({ folder: EmailFolder.TRASH });
    }

    return true;
  },
);
