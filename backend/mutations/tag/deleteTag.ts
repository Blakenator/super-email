import { makeMutation } from '../../types.js';
import { Tag, EmailTag } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const deleteTag = makeMutation(
  'deleteTag',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const tag = await Tag.findOne({
      where: { id, userId },
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    // Delete all email-tag associations first
    await EmailTag.destroy({ where: { tagId: id } });

    await tag.destroy();
    return true;
  },
);
