/**
 * Firebase Messaging Service Worker
 * Handles background push notifications when the app is not open
 */

// Import Firebase scripts for service workers
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration will be set dynamically via postMessage from the main app
// For now, use placeholder values that will be overwritten
let firebaseConfig = null;

// Listen for config message from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    initializeFirebase();
  }
});

function initializeFirebase() {
  if (!firebaseConfig) {
    console.warn('[FCM SW] Firebase config not yet received');
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[FCM SW] Received background message:', payload);

      const notificationTitle = payload.notification?.title || 'New Email';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new email',
        icon: '/icon-192x192.svg',
        badge: '/icon-192x192.svg',
        tag: 'email-notification',
        renotify: true,
        data: payload.data,
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });

    console.log('[FCM SW] Firebase initialized successfully');
  } catch (error) {
    console.error('[FCM SW] Error initializing Firebase:', error);
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Try to initialize on load if config was cached
self.addEventListener('install', () => {
  console.log('[FCM SW] Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[FCM SW] Service worker activated');
  event.waitUntil(clients.claim());
});
