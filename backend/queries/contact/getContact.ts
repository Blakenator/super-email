import { makeQuery } from '../../types.js';
import { Contact } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getContact = makeQuery(
  'getContact',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const contact = await Contact.findOne({
      where: { id, userId },
    });

    return contact;
  },
);
