import { makeQuery } from '../../types.js';
import { Contact } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { Op } from 'sequelize';

export const searchContacts = makeQuery(
  'searchContacts',
  async (_parent, { query }, context) => {
    const userId = requireAuth(context);

    if (!query || query.length < 1) {
      return [];
    }

    const contacts = await Contact.findAll({
      where: {
        userId,
        [Op.or]: [
          { email: { [Op.iLike]: `%${query}%` } },
          { name: { [Op.iLike]: `%${query}%` } },
          { firstName: { [Op.iLike]: `%${query}%` } },
          { lastName: { [Op.iLike]: `%${query}%` } },
        ],
      },
      order: [
        ['name', 'ASC'],
        ['email', 'ASC'],
      ],
      limit: 20,
    });

    return contacts;
  },
);
