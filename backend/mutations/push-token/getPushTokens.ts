/**
 * Get Push Tokens GraphQL Mutation
 * Returns all registered push tokens for the current user
 */

import { makeMutation } from '../../types.js';
import { PushToken } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getPushTokens = makeMutation(
  'getPushTokens',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    const tokens = await PushToken.findAll({
      where: {
        userId,
        isActive: true,
      },
      order: [['createdAt', 'DESC']],
    });

    return tokens.map((t) => ({
      id: t.id,
      token: t.token,
      platform: t.platform.toUpperCase() as 'IOS' | 'ANDROID' | 'WEB',
      deviceName: t.deviceName ?? null,
      isActive: t.isActive,
      lastUsedAt: t.lastUsedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  },
);
