import { makeQuery } from '../../types.js';
import { Email, EmailAccount, Attachment } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getEmail = makeQuery(
  'getEmail',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const email = await Email.findByPk(input.id, {
      include: [
        {
          model: EmailAccount,
          where: { userId }, // Verify ownership in the same query
          required: true,
        },
        Attachment,
      ],
    });

    return email;
  },
);
