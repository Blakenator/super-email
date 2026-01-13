import { makeQuery } from '../../types.js';
import { Contact, ContactEmail } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getContacts = makeQuery(
  'getContacts',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    const contacts = await Contact.findAll({
      where: { userId },
      include: [ContactEmail],
      order: [
        ['name', 'ASC'],
        ['email', 'ASC'],
      ],
    });

    return contacts;
  },
);
