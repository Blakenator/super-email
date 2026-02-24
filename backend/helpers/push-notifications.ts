/**
 * Push Notification Helper
 * Sends push notifications via Expo Push API (mobile) and Firebase Cloud Messaging (web)
 */

import { PushToken, User, NotificationDetailLevel } from '../db/models/index.js';
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

interface NotificationPayload {
  title: string;
  body: string;
  data: Record<string, unknown>;
}

/**
 * Send a batch of notifications to FCM web tokens.
 * Each notification in the batch is sent to every token.
 */
async function sendBatchFCMNotifications(
  tokens: string[],
  notifications: NotificationPayload[],
): Promise<number> {
  if (tokens.length === 0) {
    logger.debug('push', 'FCM: No web tokens to send to');
    return 0;
  }

  const totalMessages = notifications.length * tokens.length;
  logger.debug('push', `FCM: Sending ${notifications.length} notification(s) to ${tokens.length} token(s) (${totalMessages} messages)`);

  const initialized = await initializeFirebase();
  if (!initialized || !firebaseAdmin) {
    logger.warn('push', 'FCM: Firebase not initialized, skipping web push');
    return 0;
  }

  try {
    const messages = notifications.flatMap((notif) =>
      tokens.map((token) => ({
        notification: { title: notif.title, body: notif.body },
        data: Object.fromEntries(
          Object.entries(notif.data).map(([k, v]) => [k, String(v)])
        ),
        webpush: {
          notification: {
            icon: '/icon-192x192.svg',
            badge: '/icon-192x192.svg',
          },
          fcmOptions: { link: '/' },
        },
        token,
      })),
    );

    logger.debug('push', `FCM: Sending ${messages.length} message(s) via sendEach...`);
    const response = await firebaseAdmin.messaging().sendEach(messages);

    logger.info('push', `FCM: ${response.successCount} success, ${response.failureCount} failures`);

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const tokenPreview = messages[idx]?.token?.substring(0, 30) + '...';
        logger.warn('push', `FCM: Failed for token ${tokenPreview}: ${resp.error?.message} (code: ${resp.error?.code})`);
      }
    });

    return response.successCount;
  } catch (error) {
    logger.error('push', 'FCM: Failed to send notifications:', error);
    return 0;
  }
}

/**
 * Send a batch of notifications to Expo mobile tokens.
 * Each notification in the batch is sent to every token.
 */
async function sendBatchExpoNotifications(
  tokens: string[],
  notifications: NotificationPayload[],
): Promise<number> {
  if (tokens.length === 0) {
    logger.debug('push', 'Expo: No mobile tokens to send to');
    return 0;
  }

  const totalMessages = notifications.length * tokens.length;
  logger.debug('push', `Expo: Sending ${notifications.length} notification(s) to ${tokens.length} token(s) (${totalMessages} messages)`);

  const messages: ExpoPushMessage[] = notifications.flatMap((notif) =>
    tokens.map((token) => ({
      to: token,
      title: notif.title,
      body: notif.body,
      data: notif.data,
      sound: 'default' as const,
      channelId: 'emails',
      priority: 'high' as const,
    })),
  );

  try {
    // Expo accepts up to 100 messages per request; chunk if needed
    const CHUNK_SIZE = 100;
    let totalSuccess = 0;

    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
      const chunk = messages.slice(i, i + CHUNK_SIZE);
      logger.debug('push', `Expo: Sending chunk of ${chunk.length} message(s) to Expo Push API...`);

      const response = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        logger.error('push', `Expo: Push API error: ${response.status} ${response.statusText}`);
        continue;
      }

      const result = await response.json() as { data: ExpoPushTicket[] };
      const chunkSuccess = result.data.filter((t) => t.status === 'ok').length;
      totalSuccess += chunkSuccess;

      result.data.forEach((ticket, idx) => {
        if (ticket.status !== 'ok') {
          const tokenPreview = chunk[idx]?.to?.substring(0, 30) + '...';
          logger.warn('push', `Expo: Failed for token ${tokenPreview}: ${ticket.message}`);
        }
      });
    }

    logger.info('push', `Expo: ${totalSuccess} success, ${messages.length - totalSuccess} failures`);
    return totalSuccess;
  } catch (error) {
    logger.error('push', 'Expo: Failed to send notifications:', error);
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
  await sendBatchPushNotifications(userId, [{ title, body, data: data ?? {} }]);
}

/**
 * Send a batch of push notifications to all registered devices for a user.
 * All notifications are sent in a single API call to each service.
 */
async function sendBatchPushNotifications(
  userId: string,
  notifications: NotificationPayload[],
): Promise<void> {
  if (notifications.length === 0) {
    return;
  }

  logger.debug('push', `Starting batch push (${notifications.length} notification(s)) for user ${userId}`);

  try {
    const tokens = await PushToken.findAll({
      where: { userId, isActive: true },
    });

    logger.debug('push', `Found ${tokens.length} active push token(s) for user ${userId}`);

    if (tokens.length === 0) {
      logger.debug('push', `No push tokens found for user ${userId} - notification skipped`);
      return;
    }

    const expoTokens: string[] = [];
    const fcmTokens: string[] = [];

    for (const token of tokens) {
      if (token.token.startsWith('ExponentPushToken')) {
        expoTokens.push(token.token);
      } else if (token.platform === 'web' && !token.token.startsWith('web-')) {
        fcmTokens.push(token.token);
      }
    }

    logger.debug('push', `Token breakdown: ${expoTokens.length} Expo, ${fcmTokens.length} FCM, ${tokens.length - expoTokens.length - fcmTokens.length} skipped`);

    const [expoSuccess, fcmSuccess] = await Promise.all([
      sendBatchExpoNotifications(expoTokens, notifications),
      sendBatchFCMNotifications(fcmTokens, notifications),
    ]);

    const totalSuccess = expoSuccess + fcmSuccess;
    if (totalSuccess > 0) {
      await PushToken.update(
        { lastUsedAt: new Date() },
        { where: { userId, isActive: true } },
      );
      logger.info('push', `Successfully sent ${totalSuccess} push notification(s) to user ${userId} (Expo: ${expoSuccess}, FCM: ${fcmSuccess})`);
    } else {
      logger.warn('push', `No push notifications were successfully sent for user ${userId}`);
    }
  } catch (error) {
    logger.error('push', 'Failed to send push notifications:', error);
  }
}

/**
 * Strip HTML tags and normalize whitespace for notification snippet
 */
export function stripHtmlForSnippet(html: string, maxLength: number = 100): string {
  let text = html.replace(/<[^>]*>/g, ' ');
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'");
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length > maxLength) {
    text = text.substring(0, maxLength - 3).trim() + '...';
  }
  return text;
}

const MAX_INDIVIDUAL_NOTIFICATIONS = 20;

export interface NewEmailInfo {
  id: string;
  subject?: string | null;
  fromName?: string | null;
  fromAddress?: string | null;
  textBody?: string | null;
  htmlBody?: string | null;
}

/**
 * Build the body snippet for a single email notification.
 */
function buildEmailSnippet(email: NewEmailInfo): string {
  if (email.textBody) {
    let snippet = email.textBody.replace(/\s+/g, ' ').trim();
    if (snippet.length > 100) {
      snippet = snippet.substring(0, 97).trim() + '...';
    }
    return snippet;
  }
  if (email.htmlBody) {
    return stripHtmlForSnippet(email.htmlBody, 100);
  }
  return '';
}

/**
 * Send new email notifications, respecting the user's NotificationDetailLevel.
 *
 * - FULL: Individual notification per email with sender, subject, and body snippet
 * - MINIMAL: Individual notification per email with sender and subject
 * - AGGREGATE_ONLY: Single aggregate "N new emails" notification
 */
export async function sendNewEmailNotifications(
  userId: string,
  emails: NewEmailInfo[],
  emailAccountEmail: string,
): Promise<void> {
  if (emails.length === 0) {
    return;
  }

  logger.info('push', `New email notification triggered for user ${userId}: ${emails.length} email(s) from ${emailAccountEmail}`);

  const user = await User.findByPk(userId);
  const detailLevel = user?.notificationDetailLevel ?? NotificationDetailLevel.FULL;

  let notifications: NotificationPayload[];

  if (detailLevel === NotificationDetailLevel.AGGREGATE_ONLY) {
    const count = emails.length;
    notifications = [{
      title: count === 1 ? 'New email' : `${count} new emails`,
      body: count === 1
        ? `You have a new email in ${emailAccountEmail}`
        : `You have ${count} new emails in ${emailAccountEmail}`,
      data: { type: 'new_email', emailCount: count, emailAccount: emailAccountEmail },
    }];
  } else {
    const capped = emails.slice(0, MAX_INDIVIDUAL_NOTIFICATIONS);
    notifications = capped.map((email) => {
      const sender = email.fromName || email.fromAddress || 'Unknown';
      const subject = email.subject || 'No subject';
      let body = subject;

      if (detailLevel === NotificationDetailLevel.FULL) {
        const snippet = buildEmailSnippet(email);
        if (snippet) {
          body = `${subject}\n${snippet}`;
        }
      }

      return {
        title: `New email from ${sender}`,
        body,
        data: { type: 'new_email', emailId: email.id, emailAccount: emailAccountEmail },
      };
    });

    if (emails.length > MAX_INDIVIDUAL_NOTIFICATIONS) {
      const remaining = emails.length - MAX_INDIVIDUAL_NOTIFICATIONS;
      notifications.push({
        title: 'More emails',
        body: `And ${remaining} more new email${remaining === 1 ? '' : 's'}`,
        data: { type: 'new_email', emailAccount: emailAccountEmail },
      });
    }
  }

  await sendBatchPushNotifications(userId, notifications);
}
