/**
 * SuperMail Mobile App
 * React Native app for iOS and Android
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AppLogo } from './src/components/ui';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApolloProvider } from '@apollo/client/react';
import ToastManager from 'toastify-react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';

// Import all modules at top level to avoid "Invalid hook call" errors
import { apolloClient } from './src/services/apollo';
import { useAuthStore } from './src/stores/authStore';
import { AppNavigator, navigationRef } from './src/navigation';
import type { ComposeMailto } from './src/navigation';
import { useTheme, darkTheme } from './src/theme';
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from './src/services/notifications';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

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
          <AppLogo size={80} />
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

function parseMailtoUrl(url: string): ComposeMailto {
  const withoutScheme = url.replace(/^mailto:/i, '');
  const [addresses, queryString] = withoutScheme.split('?');
  const params: ComposeMailto = {
    to: decodeURIComponent(addresses || ''),
  };

  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    if (searchParams.has('subject')) params.subject = searchParams.get('subject')!;
    if (searchParams.has('body')) params.body = searchParams.get('body')!;
    if (searchParams.has('cc')) params.cc = searchParams.get('cc')!;
    if (searchParams.has('bcc')) params.bcc = searchParams.get('bcc')!;
    if (searchParams.has('to')) {
      const additionalTo = searchParams.get('to')!;
      params.to = params.to ? `${params.to}, ${additionalTo}` : additionalTo;
    }
  }

  return params;
}

function MainApp() {
  const theme = useTheme();
  const isDark = theme.colors.background === darkTheme.colors.background;

  // Update system UI to match theme
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme.colors.background]);

  useEffect(() => {
    function handleIncomingUrl(url: string) {
      if (!url.toLowerCase().startsWith('mailto:')) return;
      const mailto = parseMailtoUrl(url);
      if (navigationRef.isReady()) {
        navigationRef.navigate('Compose', { mailto });
      }
    }

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingUrl(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingUrl(url);
    });

    function handleNotificationNavigation(data: Record<string, unknown> | undefined) {
      if (!data) return;
      const emailId = data.emailId as string | undefined;
      if (emailId && navigationRef.isReady()) {
        navigationRef.navigate('EmailDetail', { emailId });
      }
    }

    const notificationSubscription = addNotificationReceivedListener(
      (notification) => {
        console.log('[App] Notification received:', notification.request.content.title);
      },
    );

    const responseSubscription = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data);
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        handleNotificationNavigation(data);
      }
    });

    return () => {
      linkingSubscription.remove();
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
          <ToastManager
            position="top"
            duration={2500}
            showProgressBar={false}
            showCloseIcon={false}
            useModal={false}
            theme={isDark ? 'dark' : 'light'}
          />
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
