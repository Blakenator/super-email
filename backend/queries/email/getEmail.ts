import { makeQuery } from '../../types.js';
import { Email, EmailAccount, Attachment } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getEmail = makeQuery(
  'getEmail',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const email = await Email.findByPk(input.id, {
      include: [EmailAccount, Attachment],
    });

    if (!email) {
      return null;
    }

    // Verify ownership through email account
    const emailAccount = await EmailAccount.findOne({
      where: { id: email.emailAccountId, userId },
    });

    if (!emailAccount) {
      return null;
    }

    return email;
  },
);
