/**
 * Push Notification Service
 * Handles registration, receiving, and displaying notifications
 * 
 * Note: Remote push notifications require Firebase to be properly initialized.
 * If Firebase initialization fails, local notifications will still work.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { gql } from '@apollo/client';
import { secureSet, secureGet, STORAGE_KEYS } from './secureStorage';
import { apolloClient } from './apollo';

// Track if push notifications are available
let pushNotificationsAvailable = true;

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
 * Setup notification channels for Android
 * This should be called early in the app lifecycle
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('emails', {
        name: 'New Emails',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
      });
      
      await Notifications.setNotificationChannelAsync('sync', {
        name: 'Sync Status',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0],
      });
      
      // Default channel for general notifications
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch (error) {
      console.warn('Failed to setup notification channels:', error);
    }
  }
}

/**
 * Check if push notifications are available
 */
export function arePushNotificationsAvailable(): boolean {
  return pushNotificationsAvailable;
}

/**
 * Register for push notifications and get the token
 * Returns null if push notifications are not available (e.g., Firebase not initialized)
 * Local notifications will still work even if this returns null
 */
export async function registerForPushNotifications(): Promise<PushNotificationToken | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    pushNotificationsAvailable = false;
    return null;
  }

  // Setup channels first (required on Android 13+ before getting token)
  await setupNotificationChannels();

  // Check and request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    pushNotificationsAvailable = false;
    return null;
  }

  // Get the push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  
  if (!projectId) {
    console.warn('No EAS project ID found - push notifications disabled');
    pushNotificationsAvailable = false;
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    const token = tokenData.data;
    
    // Save token locally
    await secureSet(STORAGE_KEYS.PUSH_TOKEN, token);
    
    console.log('Push notification token obtained successfully');
    pushNotificationsAvailable = true;
    return { token, type: 'expo' };
  } catch (error: any) {
    // Check if this is a Firebase initialization error
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes('FirebaseApp') || errorMessage.includes('Firebase')) {
      console.warn(
        'Firebase not initialized - remote push notifications disabled. ' +
        'Local notifications will still work. ' +
        'To enable push notifications, ensure google-services.json is properly configured.'
      );
    } else {
      console.warn('Failed to get push token:', errorMessage);
    }
    pushNotificationsAvailable = false;
    return null;
  }
}

/**
 * Get the stored push token
 */
export async function getStoredPushToken(): Promise<string | null> {
  return secureGet(STORAGE_KEYS.PUSH_TOKEN);
}

const REGISTER_PUSH_TOKEN_MUTATION = gql`
  mutation RegisterPushToken($input: RegisterPushTokenInput!) {
    registerPushToken(input: $input) {
      success
      message
    }
  }
`;

const UNREGISTER_PUSH_TOKEN_MUTATION = gql`
  mutation UnregisterPushToken($token: String!) {
    unregisterPushToken(token: $token)
  }
`;

/**
 * Send push token to the backend via GraphQL
 */
export async function registerPushTokenWithBackend(
  token: string,
  _authToken?: string // Kept for backward compatibility, but not used anymore
): Promise<boolean> {
  try {
    const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
    
    console.log('[Notifications] Registering push token with backend...', {
      platform,
      deviceName: Device.deviceName,
      tokenPrefix: token.substring(0, 20) + '...',
    });
    
    const { data, errors } = await apolloClient.mutate({
      mutation: REGISTER_PUSH_TOKEN_MUTATION,
      variables: {
        input: {
          token,
          platform,
          deviceName: Device.deviceName,
        },
      },
    });
    
    if (errors?.length) {
      console.error('[Notifications] GraphQL errors registering push token:', errors);
      return false;
    }
    
    console.log('[Notifications] Push token registration response:', data?.registerPushToken);
    
    return data?.registerPushToken?.success ?? false;
  } catch (error) {
    console.error('[Notifications] Error registering push token with backend:', error);
    return false;
  }
}

/**
 * Unregister push token from the backend
 */
export async function unregisterPushTokenFromBackend(token: string): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate({
      mutation: UNREGISTER_PUSH_TOKEN_MUTATION,
      variables: { token },
    });
    
    return data?.unregisterPushToken ?? false;
  } catch (error) {
    console.error('Error unregistering push token from backend:', error);
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
