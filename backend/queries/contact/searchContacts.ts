import { makeQuery } from '../../types.js';
import { Contact, ContactEmail } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { Op, literal } from 'sequelize';

export const searchContacts = makeQuery(
  'searchContacts',
  async (_parent, { query }, context) => {
    const userId = requireAuth(context);

    if (!query || query.length < 1) {
      return [];
    }

    // Build tsquery from the search term
    // Add :* suffix to enable prefix matching (e.g., "joh" matches "john")
    const searchTerms = query
      .trim()
      .split(/\s+/)
      .filter((term: string) => term.length > 0)
      .map((term: string) => `${term}:*`)
      .join(' & ');

    if (!searchTerms) {
      return [];
    }

    // Use PostgreSQL full-text search across all text fields
    // Combine email, name, firstName, lastName, company, phone, notes into tsvector
    const contacts = await Contact.findAll({
      where: {
        userId,
        [Op.and]: [
          literal(`(
            to_tsvector('english', 
              COALESCE("Contact"."email", '') || ' ' || 
              COALESCE("Contact"."name", '') || ' ' || 
              COALESCE("Contact"."firstName", '') || ' ' || 
              COALESCE("Contact"."lastName", '') || ' ' || 
              COALESCE("Contact"."company", '') || ' ' || 
              COALESCE("Contact"."phone", '') || ' ' || 
              COALESCE("Contact"."notes", '')
            ) @@ to_tsquery('english', '${searchTerms.replace(/'/g, "''")}')
          )`),
        ],
      },
      include: [ContactEmail],
      order: [
        // Order by relevance (ts_rank)
        [
          literal(`ts_rank(
            to_tsvector('english', 
              COALESCE("Contact"."email", '') || ' ' || 
              COALESCE("Contact"."name", '') || ' ' || 
              COALESCE("Contact"."firstName", '') || ' ' || 
              COALESCE("Contact"."lastName", '') || ' ' || 
              COALESCE("Contact"."company", '') || ' ' || 
              COALESCE("Contact"."phone", '') || ' ' || 
              COALESCE("Contact"."notes", '')
            ),
            to_tsquery('english', '${searchTerms.replace(/'/g, "''")}')
          )`),
          'DESC',
        ],
        ['name', 'ASC'],
        ['email', 'ASC'],
      ],
      limit: 20,
    });

    return contacts;
  },
);
