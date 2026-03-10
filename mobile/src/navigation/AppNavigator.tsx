/**
 * App Navigator
 * Main navigation structure for the app
 */

import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { useNavigation, useRoute, DrawerActions } from '@react-navigation/native';

import { useTheme, darkTheme } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { DrawerContent } from '../components/navigation/DrawerContent';

// Screens
import { LoginScreen, SignupScreen } from '../screens/auth';
import { InboxScreen } from '../screens/inbox';
import { ContactsScreen, AddContactScreen, ContactDetailScreen } from '../screens/contacts';
import {
  SettingsScreen,
  AccountsSettingsScreen,
  SendProfileSettingsScreen,
  DomainsSettingsScreen,
  TagsSettingsScreen,
  RulesSettingsScreen,
  NotificationsSettingsScreen,
  EditTagScreen,
} from '../screens/settings';
import { NukeScreen } from '../screens/nuke';
import { ComposeScreen } from '../screens/compose';
import { EmailDetailScreen } from '../screens/inbox/EmailDetailScreen';

// Type definitions
export interface ComposeReplyTo {
  emailId: string;
  toAddress: string;
  subject: string;
  htmlBody?: string;
}

export interface ComposeReplyAll {
  emailId: string;
  toAddresses: string[];
  ccAddresses?: string[];
  subject: string;
  htmlBody?: string;
}

export interface ComposeForward {
  emailId: string;
  subject: string;
  htmlBody?: string;
  attachments?: Array<{ id: string; filename: string }>;
}

export interface ComposeMailto {
  to: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  EmailDetail: { emailId: string };
  ContactDetail: { contactId: string };
  Compose: { 
    replyTo?: ComposeReplyTo;
    replyAll?: ComposeReplyAll;
    forward?: ComposeForward;
    mailto?: ComposeMailto;
  } | undefined;
  Nuke: undefined;
  // Settings sub-screens
  AccountSettings: undefined;
  SendProfileSettings: undefined;
  DomainSettings: undefined;
  TagSettings: undefined;
  RuleSettings: undefined;
  NotificationSettings: undefined;
  // Create/Edit screens
  AddContact: { email?: string; name?: string } | undefined;
  EditAccount: { accountId?: string } | undefined;
  EditSendProfile: { profileId?: string } | undefined;
  EditTag: { tagId?: string } | undefined;
  EditRule: { ruleId?: string } | undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainDrawerParamList = {
  Inbox: undefined;
  Contacts: undefined;
  Settings: undefined;
};

// Create navigators
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainDrawer = createDrawerNavigator<MainDrawerParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

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
      onDrawerOpen={() => navigation.dispatch(DrawerActions.openDrawer())}
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
      onNavigateToSendProfiles={() => navigation.navigate('SendProfileSettings')}
      onNavigateToDomains={() => navigation.navigate('DomainSettings')}
      onNavigateToTags={() => navigation.navigate('TagSettings')}
      onNavigateToRules={() => navigation.navigate('RuleSettings')}
      onNavigateToNotifications={() => navigation.navigate('NotificationSettings')}
      onNavigateToNuke={() => navigation.navigate('Nuke')}
    />
  );
}

// Main Drawer Navigator
function MainDrawerNavigator() {
  const theme = useTheme();

  return (
    <MainDrawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEnabled: true,
        swipeEdgeWidth: 50,
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 280,
        },
      }}
    >
      <MainDrawer.Screen name="Inbox" component={InboxScreenWrapper} />
      <MainDrawer.Screen name="Contacts" component={ContactsScreenWrapper} />
      <MainDrawer.Screen name="Settings" component={SettingsScreenWrapper} />
    </MainDrawer.Navigator>
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
      replyAll={params?.replyAll}
      forward={params?.forward}
      mailto={params?.mailto}
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
      onReplyAll={(replyAll) => navigation.navigate('Compose', { replyAll })}
      onForward={(forward) => navigation.navigate('Compose', { forward })}
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

// Send Profile Settings Screen wrapper
function SendProfileSettingsScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SendProfileSettingsScreen
      onAddProfile={() => navigation.navigate('EditSendProfile')}
      onEditProfile={(profileId) => navigation.navigate('EditSendProfile', { profileId })}
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
  const { fetchEmailAccounts } = require('../stores/emailStore').useEmailStore();
  return (
    <EditAccountScreenComponent
      onClose={() => navigation.goBack()}
      onAccountCreated={(accountId: string) => {
        fetchEmailAccounts();
        navigation.replace('EditAccount', { accountId });
      }}
    />
  );
}

// Wrapper for Edit Send Profile screen
function EditSendProfileScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { EditSendProfileScreen: EditSendProfileScreenComponent } = require('../screens/settings');
  return <EditSendProfileScreenComponent onClose={() => navigation.goBack()} />;
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
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
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
              component={MainDrawerNavigator}
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
              name="SendProfileSettings"
              component={SendProfileSettingsScreenWrapper}
              options={{ title: 'Send Profiles' }}
            />
            <RootStack.Screen
              name="DomainSettings"
              component={DomainsSettingsScreen}
              options={{ title: 'Custom Domains' }}
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
              name="EditSendProfile"
              component={EditSendProfileScreenWrapper}
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
