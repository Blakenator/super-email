import { makeQuery } from '../../types.js';
import { Tag } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { literal } from 'sequelize';

export const getTag = makeQuery('getTag', async (_parent, { id }, context) => {
  const userId = requireAuth(context);

  const tag = await Tag.findOne({
    where: { id, userId },
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
  });

  if (!tag) return null;

  return {
    ...tag.toJSON(),
    emailCount: parseInt((tag as any).getDataValue('emailCount') || '0', 10),
  };
});
