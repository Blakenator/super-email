import { makeMutation } from '../../types.js';
import { Tag } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { literal } from 'sequelize';

export const updateTag = makeMutation(
  'updateTag',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const tag = await Tag.findOne({
      where: { id: input.id, userId },
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    if (input.name !== undefined) tag.name = input.name;
    if (input.color !== undefined) tag.color = input.color;
    if (input.description !== undefined) tag.description = input.description;

    await tag.save();

    // Get email count
    const tagWithCount = await Tag.findOne({
      where: { id: tag.id },
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

    return {
      ...tagWithCount!.toJSON(),
      emailCount: parseInt(
        (tagWithCount as any).getDataValue('emailCount') || '0',
        10,
      ),
    };
  },
);
