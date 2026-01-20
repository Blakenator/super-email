/**
 * App Navigator
 * Main navigation structure for the app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';
import { useAuthStore } from '../stores/authStore';

// Screens
import { LoginScreen, SignupScreen } from '../screens/auth';
import { InboxScreen } from '../screens/inbox';
import { ContactsScreen } from '../screens/contacts';
import { SettingsScreen } from '../screens/settings';
import { NukeScreen } from '../screens/nuke';

// Type definitions
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  EmailDetail: { emailId: string };
  ContactDetail: { contactId: string };
  Nuke: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Inbox: undefined;
  Contacts: undefined;
  Settings: undefined;
};

// Create navigators
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Simple Login Screen wrapper
function LoginScreenWrapper() {
  return <LoginScreen onNavigateToSignup={() => {}} />;
}

// Simple Signup Screen wrapper
function SignupScreenWrapper() {
  return <SignupScreen onNavigateToLogin={() => {}} />;
}

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreenWrapper} />
      <AuthStack.Screen name="Signup" component={SignupScreenWrapper} />
    </AuthStack.Navigator>
  );
}

// Inbox Screen wrapper
function InboxScreenWrapper() {
  return <InboxScreen onEmailPress={() => {}} />;
}

// Contacts Screen wrapper
function ContactsScreenWrapper() {
  return <ContactsScreen onContactPress={() => {}} />;
}

// Settings Screen wrapper
function SettingsScreenWrapper() {
  return (
    <SettingsScreen
      onNavigateToAccounts={() => {}}
      onNavigateToSmtp={() => {}}
      onNavigateToTags={() => {}}
      onNavigateToRules={() => {}}
      onNavigateToNotifications={() => {}}
    />
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <MainTab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.text, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : 8,
          paddingTop: 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <MainTab.Screen
        name="Inbox"
        component={InboxScreenWrapper}
        options={{
          title: 'Inbox',
          headerTitle: 'StacksMail',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>📥</Text>
          ),
        }}
      />
      <MainTab.Screen
        name="Contacts"
        component={ContactsScreenWrapper}
        options={{
          title: 'Contacts',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>👥</Text>
          ),
        }}
      />
      <MainTab.Screen
        name="Settings"
        component={SettingsScreenWrapper}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>⚙️</Text>
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

// Placeholder screen
function PlaceholderScreen({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.colors.background }]}>
      <Text style={{ color: theme.colors.text }}>{title}</Text>
    </View>
  );
}

// Nuke Screen wrapper
function NukeScreenWrapper() {
  return <NukeScreen onComplete={() => {}} />;
}

// Root Navigator
export function AppNavigator() {
  console.log('[AppNavigator] Rendering...');
  const theme = useTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  console.log('[AppNavigator] isAuthenticated:', isAuthenticated);

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTitleStyle: { color: theme.colors.text },
          headerTintColor: theme.colors.primary,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {!isAuthenticated ? (
          <RootStack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <RootStack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="EmailDetail"
              options={{ title: 'Email' }}
            >
              {() => <PlaceholderScreen title="Email Detail" />}
            </RootStack.Screen>
            <RootStack.Screen
              name="ContactDetail"
              options={{ title: 'Contact' }}
            >
              {() => <PlaceholderScreen title="Contact Detail" />}
            </RootStack.Screen>
            <RootStack.Screen
              name="Nuke"
              component={NukeScreenWrapper}
              options={{ title: 'Inbox Nuke', presentation: 'modal' }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
