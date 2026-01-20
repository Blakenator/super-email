/**
 * Push Notification Service
 * Handles registration, receiving, and displaying notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { secureSet, secureGet, STORAGE_KEYS } from './secureStorage';
import { config } from '../config/env';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
}

/**
 * Register for push notifications and get the token
 */
export async function registerForPushNotifications(): Promise<PushNotificationToken | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  // Check and request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  try {
    // Get the push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    const token = tokenData.data;
    
    // Save token locally
    await secureSet(STORAGE_KEYS.PUSH_TOKEN, token);
    
    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('emails', {
        name: 'New Emails',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
        sound: 'notification-sound.wav',
      });
      
      await Notifications.setNotificationChannelAsync('sync', {
        name: 'Sync Status',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0],
      });
    }
    
    return { token, type: 'expo' };
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Get the stored push token
 */
export async function getStoredPushToken(): Promise<string | null> {
  return secureGet(STORAGE_KEYS.PUSH_TOKEN);
}

/**
 * Send push token to the backend
 */
export async function registerPushTokenWithBackend(
  token: string,
  authToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${config.api.baseUrl}/api/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        deviceName: Device.deviceName,
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error registering push token with backend:', error);
    return false;
  }
}

/**
 * Handle a received notification
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Handle notification response (user tapped)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger ?? null, // null = immediate
  });
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Set badge count (iOS)
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Get badge count (iOS)
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}
