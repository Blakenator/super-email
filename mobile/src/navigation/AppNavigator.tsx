/**
 * App Navigator
 * Main navigation structure for the app
 */

import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useTheme, darkTheme } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { Icon, TabIcon } from '../components/ui';

// Screens
import { LoginScreen, SignupScreen } from '../screens/auth';
import { InboxScreen } from '../screens/inbox';
import { ContactsScreen, AddContactScreen, ContactDetailScreen } from '../screens/contacts';
import {
  SettingsScreen,
  AccountsSettingsScreen,
  SmtpSettingsScreen,
  TagsSettingsScreen,
  RulesSettingsScreen,
  NotificationsSettingsScreen,
  EditTagScreen,
} from '../screens/settings';
import { NukeScreen } from '../screens/nuke';
import { ComposeScreen } from '../screens/compose';
import { EmailDetailScreen } from '../screens/inbox/EmailDetailScreen';

// Type definitions
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  EmailDetail: { emailId: string };
  ContactDetail: { contactId: string };
  Compose: { replyTo?: { emailId: string; toAddress: string; subject: string; htmlBody?: string } } | undefined;
  Nuke: undefined;
  // Settings sub-screens
  AccountSettings: undefined;
  SmtpSettings: undefined;
  TagSettings: undefined;
  RuleSettings: undefined;
  NotificationSettings: undefined;
  // Create/Edit screens
  AddContact: { email?: string; name?: string } | undefined;
  EditAccount: { accountId?: string } | undefined;
  EditSmtpProfile: { profileId?: string } | undefined;
  EditTag: { tagId?: string } | undefined;
  EditRule: { ruleId?: string } | undefined;
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
      onNukePress={() => navigation.navigate('Nuke')}
    />
  );
}

// Contacts Screen wrapper
function ContactsScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return (
    <ContactsScreen
      onContactPress={(contactId) => navigation.navigate('ContactDetail', { contactId })}
      onAddContact={() => navigation.navigate('AddContact')}
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
      onNavigateToNuke={() => navigation.navigate('Nuke')}
    />
  );
}

// Main Tab Navigator - Triage moved to more menu in Inbox
function MainTabNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false, // Remove headers to save space
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 60 + Math.max(insets.bottom, 0),
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

// Contact Detail Screen wrapper
function ContactDetailScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return (
    <ContactDetailScreen
      onClose={() => navigation.goBack()}
      onDeleted={() => {
        // Navigate back to contacts list after deletion
      }}
    />
  );
}

// Compose Screen wrapper
function ComposeScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = route.params as RootStackParamList['Compose'];
  
  return (
    <ComposeScreen
      onClose={() => navigation.goBack()}
      replyTo={params?.replyTo}
    />
  );
}

// Nuke Screen wrapper
function NukeScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return <NukeScreen onComplete={() => navigation.goBack()} />;
}

// Email Detail Screen wrapper
function EmailDetailScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { moveToFolder, deleteEmails } = require('../stores/emailStore').useEmailStore();
  
  return (
    <EmailDetailScreen
      onReply={(replyTo) => navigation.navigate('Compose', { replyTo })}
      onReplyAll={(replyTo) => {
        // TODO: Implement reply all compose flow
        Alert.alert('Reply All', 'Reply all is not yet implemented');
      }}
      onForward={(forward) => {
        // TODO: Implement forward compose flow
        Alert.alert('Forward', 'Forward is not yet implemented');
      }}
      onArchive={(emailId) => {
        moveToFolder([emailId], 'ARCHIVE');
        navigation.goBack();
      }}
      onDelete={(emailId) => {
        deleteEmails([emailId]);
        navigation.goBack();
      }}
      onAddContact={(email, name) => navigation.navigate('AddContact', { email, name })}
    />
  );
}

// Add Contact Screen wrapper
function AddContactScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return <AddContactScreen onClose={() => navigation.goBack()} />;
}

// Tags Settings Screen wrapper
function TagsSettingsScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return (
    <TagsSettingsScreen
      onAddTag={() => navigation.navigate('EditTag')}
      onEditTag={(tagId) => navigation.navigate('EditTag', { tagId })}
    />
  );
}

// Edit Tag Screen wrapper
function EditTagScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return <EditTagScreen onClose={() => navigation.goBack()} />;
}

// Accounts Settings Screen wrapper
function AccountsSettingsScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return (
    <AccountsSettingsScreen
      onAddAccount={() => navigation.navigate('EditAccount')}
      onEditAccount={(accountId) => navigation.navigate('EditAccount', { accountId })}
    />
  );
}

// SMTP Settings Screen wrapper
function SmtpSettingsScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return (
    <SmtpSettingsScreen
      onAddProfile={() => navigation.navigate('EditSmtpProfile')}
      onEditProfile={(profileId) => navigation.navigate('EditSmtpProfile', { profileId })}
    />
  );
}

// Rules Settings Screen wrapper
function RulesSettingsScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  return (
    <RulesSettingsScreen
      onAddRule={() => navigation.navigate('EditRule')}
      onEditRule={(ruleId) => navigation.navigate('EditRule', { ruleId })}
    />
  );
}

// Wrapper for Edit Account screen
function EditAccountScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { EditAccountScreen: EditAccountScreenComponent } = require('../screens/settings');
  return <EditAccountScreenComponent onClose={() => navigation.goBack()} />;
}

// Wrapper for Edit SMTP Profile screen
function EditSmtpProfileScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { EditSmtpProfileScreen: EditSmtpProfileScreenComponent } = require('../screens/settings');
  return <EditSmtpProfileScreenComponent onClose={() => navigation.goBack()} />;
}

// Wrapper for Edit Rule screen
function EditRuleScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { EditRuleScreen: EditRuleScreenComponent } = require('../screens/settings');
  return <EditRuleScreenComponent onClose={() => navigation.goBack()} />;
}

// Root Navigator
export function AppNavigator() {
  const theme = useTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isDark = theme.colors.background === darkTheme.colors.background;

  // Custom navigation theme that matches our app theme
  const navigationTheme = isDark ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
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
              component={EmailDetailScreenWrapper}
              options={{ title: 'Email' }}
            />
            <RootStack.Screen
              name="ContactDetail"
              component={ContactDetailScreenWrapper}
              options={{ headerShown: false }}
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
              component={AccountsSettingsScreenWrapper}
              options={{ title: 'Email Accounts' }}
            />
            <RootStack.Screen
              name="SmtpSettings"
              component={SmtpSettingsScreenWrapper}
              options={{ title: 'SMTP Profiles' }}
            />
            <RootStack.Screen
              name="TagSettings"
              component={TagsSettingsScreenWrapper}
              options={{ title: 'Tags' }}
            />
            <RootStack.Screen
              name="RuleSettings"
              component={RulesSettingsScreenWrapper}
              options={{ title: 'Mail Rules' }}
            />
            <RootStack.Screen
              name="NotificationSettings"
              component={NotificationsSettingsScreen}
              options={{ title: 'Notifications' }}
            />
            <RootStack.Screen
              name="AddContact"
              component={AddContactScreenWrapper}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <RootStack.Screen
              name="EditTag"
              component={EditTagScreenWrapper}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <RootStack.Screen
              name="EditAccount"
              component={EditAccountScreenWrapper}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <RootStack.Screen
              name="EditSmtpProfile"
              component={EditSmtpProfileScreenWrapper}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <RootStack.Screen
              name="EditRule"
              component={EditRuleScreenWrapper}
              options={{ headerShown: false, presentation: 'modal' }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({});
