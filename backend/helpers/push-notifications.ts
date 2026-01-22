/**
 * Push Notification Helper
 * Sends push notifications to mobile devices via Expo Push API
 */

import { logger } from './logger.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushNotificationPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

export interface PushNotificationResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

/**
 * Send a push notification via Expo Push API
 */
export async function sendPushNotification(
  payload: PushNotificationPayload
): Promise<PushNotificationResult[]> {
  try {
    // Normalize to array
    const tokens = Array.isArray(payload.to) ? payload.to : [payload.to];
    
    // Filter out invalid tokens
    const validTokens = tokens.filter((token) =>
      token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')
    );
    
    if (validTokens.length === 0) {
      logger.warn('push','No valid Expo push tokens provided');
      return [];
    }
    
    // Build messages
    const messages = validTokens.map((token) => ({
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: payload.sound ?? 'default',
      badge: payload.badge,
      channelId: payload.channelId ?? 'emails',
      priority: payload.priority ?? 'high',
      ttl: payload.ttl ?? 60 * 60 * 24, // 24 hours
    }));
    
    // Send to Expo Push API
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });
    
    if (!response.ok) {
      const error = await response.text();
      logger.error('Expo Push API error:', error);
      return messages.map(() => ({ success: false, error }));
    }
    
    const result = await response.json();
    const tickets = result.data || [];
    
    return tickets.map((ticket: any, index: number) => {
      if (ticket.status === 'ok') {
        return { success: true, ticketId: ticket.id };
      } else {
        logger.warn('Push notification failed:', ticket);
        return { success: false, error: ticket.message || 'Unknown error' };
      }
    });
  } catch (error) {
    logger.error('push','Error sending push notification:', error);
    return [{ success: false, error: String(error) }];
  }
}

/**
 * Send a new email notification to a user's devices
 */
export async function sendNewEmailNotification(
  pushTokens: string[],
  emailData: {
    id: string;
    fromName?: string | null;
    fromAddress: string;
    subject: string;
    preview?: string;
  },
  detailLevel: 'MINIMAL' | 'FULL' = 'FULL'
): Promise<void> {
  if (pushTokens.length === 0) return;
  
  const senderName = emailData.fromName || emailData.fromAddress;
  
  let title: string;
  let body: string;
  
  if (detailLevel === 'MINIMAL') {
    title = 'New Email';
    body = `From: ${senderName}`;
  } else {
    title = senderName;
    body = emailData.subject;
    if (emailData.preview) {
      body += `\n${emailData.preview.substring(0, 100)}`;
    }
  }
  
  await sendPushNotification({
    to: pushTokens,
    title,
    body,
    data: {
      type: 'new_email',
      emailId: emailData.id,
    },
    channelId: 'emails',
  });
}

/**
 * Send a sync complete notification
 */
export async function sendSyncCompleteNotification(
  pushTokens: string[],
  newEmailCount: number
): Promise<void> {
  if (pushTokens.length === 0 || newEmailCount === 0) return;
  
  await sendPushNotification({
    to: pushTokens,
    title: 'Sync Complete',
    body: `${newEmailCount} new email${newEmailCount !== 1 ? 's' : ''} received`,
    data: {
      type: 'sync_complete',
      count: newEmailCount,
    },
    channelId: 'sync',
    priority: 'normal',
  });
}
