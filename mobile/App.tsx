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
} from './src/services/notifications';

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
      (notification) => {
        console.log('Notification received:', notification);
      },
    );

    const responseSubscription = addNotificationResponseListener((response) => {
      console.log('Notification response:', response);
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
