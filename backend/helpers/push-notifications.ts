/**
 * Push Notification Helper
 * Sends push notifications via Expo Push API (mobile) and Firebase Cloud Messaging (web)
 */

import { PushToken } from '../db/models/index.js';
import { logger } from './logger.js';
import config from '../config/env.js';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

// Firebase Admin SDK - lazy loaded
let firebaseAdmin: typeof import('firebase-admin') | null = null;
let firebaseInitialized = false;

interface ExpoPushMessage {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Initialize Firebase Admin SDK
 */
async function initializeFirebase(): Promise<boolean> {
  if (firebaseInitialized) {
    return true;
  }

  // Check if Firebase is configured via JSON string or file path
  const serviceAccountJson = config.firebase?.serviceAccountJson;
  const serviceAccountPath = config.firebase?.serviceAccountPath;
  
  if (!serviceAccountJson && !serviceAccountPath) {
    logger.debug('push', 'Firebase not configured - web push notifications disabled');
    return false;
  }

  try {
    firebaseAdmin = await import('firebase-admin');
    
    let serviceAccount: object;
    
    if (serviceAccountPath) {
      // Load from file path
      try {
        const fs = await import('fs');
        const fileContents = fs.readFileSync(serviceAccountPath, 'utf-8');
        serviceAccount = JSON.parse(fileContents);
        logger.info('push', `Loaded Firebase service account from ${serviceAccountPath}`);
      } catch (e: any) {
        logger.error('push', `Failed to load Firebase service account from ${serviceAccountPath}: ${e.message}`);
        return false;
      }
    } else if (serviceAccountJson) {
      // Parse the JSON string
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
      } catch (e) {
        logger.error('push', 'Invalid Firebase service account JSON');
        return false;
      }
    } else {
      return false;
    }

    // Initialize the app
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount as any),
    });

    firebaseInitialized = true;
    logger.info('push', 'Firebase Admin SDK initialized');
    return true;
  } catch (error) {
    logger.error('push', 'Failed to initialize Firebase Admin SDK:', error);
    return false;
  }
}

/**
 * Send push notification to FCM web tokens
 */
async function sendFCMNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<number> {
  if (tokens.length === 0) {
    logger.debug('push', 'FCM: No web tokens to send to');
    return 0;
  }

  logger.debug('push', `FCM: Attempting to send to ${tokens.length} web token(s)`);
  logger.debug('push', `FCM: Title="${title}", Body="${body}"`);

  const initialized = await initializeFirebase();
  if (!initialized || !firebaseAdmin) {
    logger.warn('push', 'FCM: Firebase not initialized, skipping web push');
    return 0;
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data ? Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ) : undefined,
      webpush: {
        notification: {
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg',
        },
        fcmOptions: {
          link: '/',
        },
      },
      tokens,
    };

    logger.debug('push', `FCM: Sending multicast message to ${tokens.length} token(s)...`);
    const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
    
    logger.info('push', `FCM: ${response.successCount} success, ${response.failureCount} failures`);
    
    // Log details for each response
    response.responses.forEach((resp, idx) => {
      const tokenPreview = tokens[idx]?.substring(0, 30) + '...';
      if (resp.success) {
        logger.debug('push', `FCM: Successfully sent to token ${tokenPreview} (messageId: ${resp.messageId})`);
      } else {
        logger.warn('push', `FCM: Failed for token ${tokenPreview}: ${resp.error?.message} (code: ${resp.error?.code})`);
      }
    });

    return response.successCount;
  } catch (error) {
    logger.error('push', 'FCM: Failed to send notification:', error);
    return 0;
  }
}

/**
 * Send push notification to Expo mobile tokens
 */
async function sendExpoNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<number> {
  if (tokens.length === 0) {
    logger.debug('push', 'Expo: No mobile tokens to send to');
    return 0;
  }

  logger.debug('push', `Expo: Attempting to send to ${tokens.length} mobile token(s)`);
  logger.debug('push', `Expo: Title="${title}", Body="${body}"`);

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    title,
    body,
    data,
    sound: 'default' as const,
    channelId: 'emails',
    priority: 'high' as const,
  }));

  try {
    logger.debug('push', `Expo: Sending ${messages.length} message(s) to Expo Push API...`);
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      logger.error(
        'push',
        `Expo: Push API error: ${response.status} ${response.statusText}`,
      );
      return 0;
    }

    const result = await response.json() as { data: ExpoPushTicket[] };
    const successCount = result.data.filter((t) => t.status === 'ok').length;

    logger.info('push', `Expo: ${successCount} success, ${result.data.length - successCount} failures`);

    // Log details for each response
    result.data.forEach((ticket, idx) => {
      const tokenPreview = tokens[idx]?.substring(0, 30) + '...';
      if (ticket.status === 'ok') {
        logger.debug('push', `Expo: Successfully sent to token ${tokenPreview} (ticketId: ${ticket.id})`);
      } else {
        logger.warn('push', `Expo: Failed for token ${tokenPreview}: ${ticket.message}`);
      }
    });

    return successCount;
  } catch (error) {
    logger.error('push', 'Expo: Failed to send notification:', error);
    return 0;
  }
}

/**
 * Send push notifications to all registered devices for a user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  logger.debug('push', `Starting push notification for user ${userId}`);
  logger.debug('push', `Notification: title="${title}", body="${body}", data=${JSON.stringify(data)}`);

  try {
    // Get all active push tokens for the user
    const tokens = await PushToken.findAll({
      where: {
        userId,
        isActive: true,
      },
    });

    logger.debug('push', `Found ${tokens.length} active push token(s) for user ${userId}`);

    if (tokens.length === 0) {
      logger.debug('push', `No push tokens found for user ${userId} - notification skipped`);
      return;
    }

    // Separate tokens by type
    const expoTokens: string[] = [];
    const fcmTokens: string[] = [];
    const skippedTokens: string[] = [];

    for (const token of tokens) {
      if (token.token.startsWith('ExponentPushToken')) {
        expoTokens.push(token.token);
        logger.debug('push', `Token ${token.id}: Expo mobile (${token.platform}, device: ${token.deviceName || 'unknown'})`);
      } else if (token.platform === 'web' && !token.token.startsWith('web-')) {
        // FCM tokens for web (not the fallback web- tokens)
        fcmTokens.push(token.token);
        logger.debug('push', `Token ${token.id}: FCM web (device: ${token.deviceName || 'unknown'})`);
      } else {
        skippedTokens.push(token.token);
        logger.debug('push', `Token ${token.id}: Skipped - fallback token or unknown type (platform: ${token.platform})`);
      }
    }

    logger.debug('push', `Token breakdown: ${expoTokens.length} Expo, ${fcmTokens.length} FCM, ${skippedTokens.length} skipped`);

    // Send to both services in parallel
    const [expoSuccess, fcmSuccess] = await Promise.all([
      sendExpoNotification(expoTokens, title, body, data),
      sendFCMNotification(fcmTokens, title, body, data),
    ]);

    const totalSuccess = expoSuccess + fcmSuccess;
    if (totalSuccess > 0) {
      // Update lastUsedAt for successful sends
      await PushToken.update(
        { lastUsedAt: new Date() },
        {
          where: {
            userId,
            isActive: true,
          },
        },
      );
      logger.info(
        'push',
        `Successfully sent ${totalSuccess} push notification(s) to user ${userId} (Expo: ${expoSuccess}/${expoTokens.length}, FCM: ${fcmSuccess}/${fcmTokens.length})`,
      );
    } else {
      logger.warn('push', `No push notifications were successfully sent for user ${userId}`);
    }
  } catch (error) {
    logger.error('push', 'Failed to send push notification:', error);
  }
}

/**
 * Send new email notification
 */
export async function sendNewEmailNotification(
  userId: string,
  emailCount: number,
  emailAccountEmail: string,
  latestSubject?: string,
  latestSender?: string,
): Promise<void> {
  logger.info('push', `New email notification triggered for user ${userId}: ${emailCount} email(s) from ${emailAccountEmail}`);
  logger.debug('push', `Email details: sender="${latestSender}", subject="${latestSubject}"`);

  const title =
    emailCount === 1
      ? `New email from ${latestSender || 'Unknown'}`
      : `${emailCount} new emails`;

  const body =
    emailCount === 1
      ? latestSubject || 'No subject'
      : `You have ${emailCount} new emails in ${emailAccountEmail}`;

  await sendPushNotification(userId, title, body, {
    type: 'new_email',
    emailCount,
    emailAccount: emailAccountEmail,
  });
}
