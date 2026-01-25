/**
 * Register Push Token Mutation
 * Registers a push notification token for a mobile device
 */

import { PushToken } from '../../db/models/index.js';
import { logger } from '../../helpers/logger.js';

// Note: This is a REST endpoint, not a GraphQL mutation
// because push tokens are registered before GraphQL client is fully set up

export interface RegisterPushTokenInput {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
}

export interface RegisterPushTokenResult {
  success: boolean;
  message: string;
}

export async function registerPushToken(
  userId: string,
  input: RegisterPushTokenInput,
): Promise<RegisterPushTokenResult> {
  try {
    // Check if token already exists
    const existing = await PushToken.findOne({
      where: {
        token: input.token,
      },
    });

    if (existing) {
      // Update existing token
      await existing.update({
        userId,
        platform: input.platform,
        deviceName: input.deviceName,
        isActive: true,
        lastUsedAt: new Date(),
      });

      return { success: true, message: 'Push token updated' };
    }

    // Deactivate old tokens for this device name (if provided)
    if (input.deviceName) {
      await PushToken.update(
        { isActive: false },
        {
          where: {
            userId,
            deviceName: input.deviceName,
            isActive: true,
          },
        },
      );
    }

    // Create new token
    await PushToken.create({
      userId,
      token: input.token,
      platform: input.platform,
      deviceName: input.deviceName,
      isActive: true,
      lastUsedAt: new Date(),
    });

    logger.info(
      'push',
      `Push token registered for user ${userId} on ${input.platform}`,
    );

    return { success: true, message: 'Push token registered' };
  } catch (error) {
    logger.error('push', 'Error registering push token:', error);
    return { success: false, message: 'Failed to register push token' };
  }
}

/**
 * Get active push tokens for a user
 */
export async function getUserPushTokens(userId: string): Promise<string[]> {
  const tokens = await PushToken.findAll({
    where: {
      userId,
      isActive: true,
    },
    attributes: ['token'],
  });

  return tokens.map((t) => t.token);
}

/**
 * Deactivate a push token
 */
export async function deactivatePushToken(token: string): Promise<void> {
  await PushToken.update(
    { isActive: false },
    {
      where: { token },
    },
  );
}

/**
 * Deactivate all push tokens for a user
 */
export async function deactivateUserPushTokens(userId: string): Promise<void> {
  await PushToken.update(
    { isActive: false },
    {
      where: { userId },
    },
  );
}
