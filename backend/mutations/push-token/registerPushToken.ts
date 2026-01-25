/**
 * Register Push Token GraphQL Mutation
 * Registers a push notification token for a mobile/web device
 */

import { makeMutation } from '../../types.js';
import { PushToken } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { logger } from '../../helpers/logger.js';

export const registerPushToken = makeMutation(
  'registerPushToken',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const { token, platform, deviceName } = input;

    try {
      // Check if token already exists
      const existing = await PushToken.findOne({
        where: { token },
      });

      if (existing) {
        // Update existing token
        await existing.update({
          userId,
          platform: platform.toLowerCase() as 'ios' | 'android' | 'web',
          deviceName,
          isActive: true,
          lastUsedAt: new Date(),
        });

        return {
          success: true,
          message: 'Push token updated',
          pushToken: {
            id: existing.id,
            token: existing.token,
            platform: existing.platform.toUpperCase() as 'IOS' | 'ANDROID' | 'WEB',
            deviceName: existing.deviceName ?? null,
            isActive: existing.isActive,
            lastUsedAt: existing.lastUsedAt,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
          },
        };
      }

      // Deactivate old tokens for this device name (if provided)
      if (deviceName) {
        await PushToken.update(
          { isActive: false },
          {
            where: {
              userId,
              deviceName,
              isActive: true,
            },
          },
        );
      }

      // Create new token
      const newToken = await PushToken.create({
        userId,
        token,
        platform: platform.toLowerCase() as 'ios' | 'android' | 'web',
        deviceName,
        isActive: true,
        lastUsedAt: new Date(),
      });

      logger.info(
        'push',
        `Push token registered for user ${userId} on ${platform}`,
      );

      return {
        success: true,
        message: 'Push token registered',
        pushToken: {
          id: newToken.id,
          token: newToken.token,
          platform: newToken.platform.toUpperCase() as 'IOS' | 'ANDROID' | 'WEB',
          deviceName: newToken.deviceName ?? null,
          isActive: newToken.isActive,
          lastUsedAt: newToken.lastUsedAt,
          createdAt: newToken.createdAt,
          updatedAt: newToken.updatedAt,
        },
      };
    } catch (error) {
      logger.error('push', 'Error registering push token:', error);
      return {
        success: false,
        message: 'Failed to register push token',
        pushToken: null,
      };
    }
  },
);
