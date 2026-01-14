import { makeQuery } from '../../types.js';
import { Tag, EmailTag } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { fn, col, literal } from 'sequelize';

export const getTags = makeQuery('getTags', async (_parent, _args, context) => {
  const userId = requireAuth(context);

  const tags = await Tag.findAll({
    where: { userId },
    attributes: {
      include: [
        [
          literal(
            `(SELECT COUNT(*) FROM email_tags WHERE email_tags."tagId" = "Tag"."id")`,
          ),
          'emailCount',
        ],
      ],
    },
    order: [['name', 'ASC']],
  });

  return tags.map((tag) => ({
    ...tag.toJSON(),
    emailCount: parseInt((tag as any).getDataValue('emailCount') || '0', 10),
  }));
});
