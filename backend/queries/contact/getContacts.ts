import { makeQuery } from '../../types.js';
import { Contact } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getContacts = makeQuery(
  'getContacts',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    const contacts = await Contact.findAll({
      where: { userId },
      order: [
        ['name', 'ASC'],
        ['email', 'ASC'],
      ],
    });

    return contacts;
  },
);
