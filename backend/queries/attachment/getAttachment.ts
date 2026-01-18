import { makeQuery } from '../../types.js';
import { Email, EmailAccount } from '../../db/models/index.js';
import { Attachment } from '../../db/models/attachment.model.js';
import { requireAuth } from '../../helpers/auth.js';

export const getAttachment = makeQuery(
  'getAttachment',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const attachment = await Attachment.findOne({
      where: { id },
      include: [
        {
          model: Email,
          include: [
            {
              model: EmailAccount,
              where: { userId },
              required: true,
            },
          ],
        },
      ],
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    return attachment;
  },
);
