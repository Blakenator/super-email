import { makeMutation } from '../../types.js';
import { Tag } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const createTag = makeMutation(
  'createTag',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const tag = await Tag.create({
      userId,
      name: input.name,
      color: input.color || '#6c757d',
      description: input.description || null,
    });

    return { ...tag.toJSON(), emailCount: 0 };
  },
);
