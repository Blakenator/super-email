/**
 * SuperMail Mobile App
 * React Native app for iOS and Android
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApolloProvider } from '@apollo/client/react';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';

// Import all modules at top level to avoid "Invalid hook call" errors
import { apolloClient } from './src/services/apollo';
import { useAuthStore } from './src/stores/authStore';
import { AppNavigator } from './src/navigation';
import { useTheme, darkTheme } from './src/theme';
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  scheduleLocalNotification,
} from './src/services/notifications';
import { useEmailStore } from './src/stores/emailStore';

// Keep splash screen visible while we initialize
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Starting...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        setLoadingStatus('Initializing...');

        // Initialize auth store
        try {
          await useAuthStore.getState().initialize();
          setLoadingStatus('Auth initialized ✓');
        } catch (e: any) {
          // Non-fatal - continue even if auth init fails (offline mode)
          console.warn('Auth init error:', e);
          setLoadingStatus('Continuing in offline mode...');
        }

        // Check if we should prompt for biometric login
        const { shouldPromptBiometric, promptBiometricLogin } =
          useAuthStore.getState();
        if (shouldPromptBiometric) {
          setLoadingStatus('Authenticating...');
          await promptBiometricLogin();
        }

        // Small delay to ensure everything is ready
        await new Promise((resolve) => setTimeout(resolve, 300));

        setLoadingStatus('Ready!');
        setIsReady(true);
      } catch (e: any) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        console.error('App initialization error:', errorMsg);
        setError(errorMsg);
        Alert.alert('Initialization Error', errorMsg);
      } finally {
        // Hide splash screen
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, []);

  // Show error screen if initialization failed
  if (error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.errorContainer}>
          <StatusBar style="light" />
          <Text style={styles.errorTitle}>⚠️ App Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>
            Please restart the app or contact support.
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  // Show loading screen
  if (!isReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.loadingContainer}>
          <StatusBar style="light" />
          <Text style={styles.appIcon}>✉️</Text>
          <Text style={styles.appName}>SuperMail</Text>
          <ActivityIndicator
            size="large"
            color="#ffffff"
            style={{ marginTop: 24 }}
          />
          <Text style={styles.loadingStatus}>{loadingStatus}</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  // Render the main app
  return <MainApp />;
}

// Main app component
function MainApp() {
  const theme = useTheme();
  const isDark = theme.colors.background === darkTheme.colors.background;

  // Update system UI to match theme
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme.colors.background]);

  useEffect(() => {
    // Set up notification listeners
    const notificationSubscription = addNotificationReceivedListener(
      async (notification) => {
        console.log('Notification received:', notification);
        
        const data = notification.request.content.data as { type?: string; emailCount?: number } | undefined;
        
        // If this is a new email notification with multiple emails, fetch and show individual notifications
        if (data?.type === 'new_email' && data?.emailCount && data.emailCount > 1) {
          console.log(`[App] Received bulk notification for ${data.emailCount} emails, fetching individual emails...`);
          
          try {
            const authStore = useAuthStore.getState();
            
            // First, try to refresh token if needed
            if (authStore.isAuthenticated) {
              await authStore.refreshTokenIfNeeded();
            }
            
            // Refresh emails to get the latest
            const emailStore = useEmailStore.getState();
            await emailStore.refreshEmails();
            
            // Get the newest emails (up to the count we received)
            const newEmails = emailStore.emails.slice(0, Math.min(data.emailCount, 5)); // Limit to 5 individual notifications
            
            // Show individual notifications for each new email
            for (const email of newEmails) {
              await scheduleLocalNotification(
                email.fromName || email.fromAddress,
                email.subject || '(No Subject)',
                { emailId: email.id, type: 'email_detail' },
              );
            }
            
            // If there are more than 5, show a summary for the rest
            if (data.emailCount > 5) {
              await scheduleLocalNotification(
                'More emails',
                `And ${data.emailCount - 5} more new emails`,
                { type: 'inbox' },
              );
            }
          } catch (error) {
            console.error('[App] Failed to fetch individual emails:', error);
            // Fall through to show the original bulk notification
          }
        }
      },
    );

    const responseSubscription = addNotificationResponseListener((response) => {
      console.log('Notification response:', response);
      // TODO: Navigate to email detail or inbox based on response.notification.request.content.data
    });

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ApolloProvider client={apolloClient}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AppNavigator />
        </ApolloProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  appIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingStatus: {
    marginTop: 20,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 24,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  errorHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
