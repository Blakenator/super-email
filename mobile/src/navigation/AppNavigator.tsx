/**
 * App Navigator
 * Main navigation structure for the app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { Icon, TabIcon } from '../components/ui';

// Screens
import { LoginScreen, SignupScreen } from '../screens/auth';
import { InboxScreen } from '../screens/inbox';
import { ContactsScreen } from '../screens/contacts';
import {
  SettingsScreen,
  AccountsSettingsScreen,
  SmtpSettingsScreen,
  TagsSettingsScreen,
  RulesSettingsScreen,
  NotificationsSettingsScreen,
} from '../screens/settings';
import { NukeScreen } from '../screens/nuke';
import { ComposeScreen } from '../screens/compose';

// Type definitions
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  EmailDetail: { emailId: string };
  ContactDetail: { contactId: string };
  Compose: { replyTo?: { emailId: string; toAddress: string; subject: string } } | undefined;
  Nuke: undefined;
  AccountSettings: undefined;
  SmtpSettings: undefined;
  TagSettings: undefined;
  RuleSettings: undefined;
  NotificationSettings: undefined;
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

// Auth Navigator
function AuthNavigator() {
  const authNavigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {() => <LoginScreen onNavigateToSignup={() => authNavigation.navigate('Signup')} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Signup">
        {() => <SignupScreen onNavigateToLogin={() => authNavigation.navigate('Login')} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

// Inbox Screen wrapper with navigation
function InboxScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return (
    <InboxScreen
      onEmailPress={(emailId) => navigation.navigate('EmailDetail', { emailId })}
      onComposePress={() => navigation.navigate('Compose')}
    />
  );
}

// Contacts Screen wrapper
function ContactsScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return (
    <ContactsScreen
      onContactPress={(contactId) => navigation.navigate('ContactDetail', { contactId })}
    />
  );
}

// Settings Screen wrapper
function SettingsScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return (
    <SettingsScreen
      onNavigateToAccounts={() => navigation.navigate('AccountSettings')}
      onNavigateToSmtp={() => navigation.navigate('SmtpSettings')}
      onNavigateToTags={() => navigation.navigate('TagSettings')}
      onNavigateToRules={() => navigation.navigate('RuleSettings')}
      onNavigateToNotifications={() => navigation.navigate('NotificationSettings')}
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
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="inbox" focused={focused} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Contacts"
        component={ContactsScreenWrapper}
        options={{
          title: 'Contacts',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="users" focused={focused} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Settings"
        component={SettingsScreenWrapper}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="settings" focused={focused} color={color} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

// Placeholder screen for email detail
function EmailDetailScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.colors.background }]}>
      <Icon name="mail" size="xl" color={theme.colors.textMuted} />
    </View>
  );
}

// Placeholder screen for contact detail
function ContactDetailScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.colors.background }]}>
      <Icon name="user" size="xl" color={theme.colors.textMuted} />
    </View>
  );
}

// Compose Screen wrapper
function ComposeScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return <ComposeScreen onClose={() => navigation.goBack()} />;
}

// Nuke Screen wrapper
function NukeScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return <NukeScreen onComplete={() => navigation.goBack()} />;
}

// Root Navigator
export function AppNavigator() {
  const theme = useTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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
              component={EmailDetailScreen}
              options={{ title: 'Email' }}
            />
            <RootStack.Screen
              name="ContactDetail"
              component={ContactDetailScreen}
              options={{ title: 'Contact' }}
            />
            <RootStack.Screen
              name="Compose"
              component={ComposeScreenWrapper}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <RootStack.Screen
              name="Nuke"
              component={NukeScreenWrapper}
              options={{ title: 'Inbox Nuke', presentation: 'modal' }}
            />
            <RootStack.Screen
              name="AccountSettings"
              component={AccountsSettingsScreen}
              options={{ title: 'Email Accounts' }}
            />
            <RootStack.Screen
              name="SmtpSettings"
              component={SmtpSettingsScreen}
              options={{ title: 'SMTP Profiles' }}
            />
            <RootStack.Screen
              name="TagSettings"
              component={TagsSettingsScreen}
              options={{ title: 'Tags' }}
            />
            <RootStack.Screen
              name="RuleSettings"
              component={RulesSettingsScreen}
              options={{ title: 'Mail Rules' }}
            />
            <RootStack.Screen
              name="NotificationSettings"
              component={NotificationsSettingsScreen}
              options={{ title: 'Notifications' }}
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
