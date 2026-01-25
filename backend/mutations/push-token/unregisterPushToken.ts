/**
 * Unregister Push Token GraphQL Mutation
 * Deactivates a push notification token
 */

import { makeMutation } from '../../types.js';
import { PushToken } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { logger } from '../../helpers/logger.js';

export const unregisterPushToken = makeMutation(
  'unregisterPushToken',
  async (_parent, { token }, context) => {
    const userId = requireAuth(context);

    try {
      const [updatedCount] = await PushToken.update(
        { isActive: false },
        {
          where: {
            token,
            userId,
          },
        },
      );

      if (updatedCount > 0) {
        logger.info('push', `Push token unregistered for user ${userId}`);
      }

      return true;
    } catch (error) {
      logger.error('push', 'Error unregistering push token:', error);
      return false;
    }
  },
);
