/**
 * Firebase Configuration and Messaging Service
 * Handles Firebase Cloud Messaging for web push notifications
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
} from 'firebase/messaging';

// Firebase configuration - these should be set in environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId
  );
}

/**
 * Initialize Firebase app
 */
export function initializeFirebase(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not configured. Web push notifications will not work in background.');
    return null;
  }

  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      return null;
    }
  }
  return app;
}

/**
 * Get Firebase Messaging instance
 */
export function getFirebaseMessaging(): Messaging | null {
  if (!app) {
    initializeFirebase();
  }

  if (!app) {
    return null;
  }

  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.error('Failed to get Firebase Messaging:', error);
      return null;
    }
  }
  return messaging;
}

/**
 * Get FCM token for this browser
 * Returns null if Firebase is not configured or permission is denied
 */
export async function getFCMToken(): Promise<string | null> {
  const messagingInstance = getFirebaseMessaging();
  if (!messagingInstance) {
    return null;
  }

  // Check for notification permission
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  try {
    // Get the VAPID key from environment
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('VAPID key not configured');
      return null;
    }

    const token = await getToken(messagingInstance, { vapidKey });
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

/**
 * Register service worker for Firebase messaging
 */
export async function registerFirebaseServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    // Register the firebase messaging service worker
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/' }
    );
    console.log('Firebase messaging service worker registered');
    return registration;
  } catch (error) {
    console.error('Failed to register Firebase service worker:', error);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(
  callback: (payload: {
    notification?: { title?: string; body?: string };
    data?: Record<string, string>;
  }) => void
): (() => void) | null {
  const messagingInstance = getFirebaseMessaging();
  if (!messagingInstance) {
    return null;
  }

  const unsubscribe = onMessage(messagingInstance, (payload) => {
    console.log('Received foreground message:', payload);
    callback(payload);
  });

  return unsubscribe;
}

/**
 * Request notification permission and get FCM token
 * Returns the token if successful, null otherwise
 */
export async function requestNotificationPermissionAndGetToken(): Promise<string | null> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    return await getFCMToken();
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}
