/**
 * Settings Screen
 * User preferences and app settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  useTheme,
  sharedStyles,
  SPACING,
  FONT_SIZE,
  RADIUS,
  COLORS,
} from '../../theme';
import type { ThemePreference } from '../../stores/authStore';
import { useAuthStore } from '../../stores/authStore';
import type { IconName } from '../../components/ui';
import {
  Icon,
  useSafeInsets,
  ListItem,
  ListItemSwitch,
  ListSection,
} from '../../components/ui';

interface SettingsScreenProps {
  onNavigateToAccounts: () => void;
  onNavigateToSmtp: () => void;
  onNavigateToTags: () => void;
  onNavigateToRules: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToNuke: () => void;
}

export function SettingsScreen({
  onNavigateToAccounts,
  onNavigateToSmtp,
  onNavigateToTags,
  onNavigateToRules,
  onNavigateToNotifications,
  onNavigateToNuke,
}: SettingsScreenProps) {
  const theme = useTheme();
  const { top: topInset, bottom: bottomInset } = useSafeInsets([
    'top',
    'bottom',
  ]);
  const {
    user,
    logout,
    biometricAvailable,
    biometricEnabled,
    setBiometric,
    setThemePreference,
  } = useAuthStore();

  const currentTheme = user?.themePreference || 'AUTO';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    await setBiometric(enabled);
  };

  const handleThemeChange = async (newTheme: ThemePreference) => {
    await setThemePreference(newTheme);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        sharedStyles.screenScrollContent,
        { paddingTop: topInset, paddingBottom: bottomInset },
      ]}
    >
      {/* User Info */}
      {user && (
        <View
          style={[styles.userCard, { backgroundColor: theme.colors.surface }]}
        >
          <View
            style={[
              styles.userAvatar,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text
              style={[
                styles.userAvatarText,
                { color: theme.colors.textInverse },
              ]}
            >
              {user.firstName?.[0] || ''}
              {user.lastName?.[0] || ''}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.textMuted }]}>
              {user.email}
            </Text>
          </View>
        </View>
      )}

      {/* Email Configuration */}
      <ListSection title="EMAIL CONFIGURATION" />
      <View
        style={[sharedStyles.section, { borderColor: theme.colors.border }]}
      >
        <ListItem
          icon="inbox"
          title="Email Accounts"
          subtitle="IMAP/POP email accounts"
          onPress={onNavigateToAccounts}
        />
        <ListItem
          icon="send"
          title="SMTP Profiles"
          subtitle="Outgoing email settings"
          onPress={onNavigateToSmtp}
        />
        <ListItem
          icon="tag"
          title="Tags"
          subtitle="Manage email labels"
          onPress={onNavigateToTags}
        />
        <ListItem
          icon="zap"
          title="Mail Rules"
          subtitle="Automatic email filtering"
          onPress={onNavigateToRules}
          showBorder={false}
        />
      </View>

      {/* Inbox Tools */}
      <ListSection title="INBOX TOOLS" />
      <View
        style={[sharedStyles.section, { borderColor: theme.colors.border }]}
      >
        <ListItem
          icon="zap"
          title="Inbox Nuke"
          subtitle="Bulk archive old emails"
          onPress={onNavigateToNuke}
          showBorder={false}
        />
      </View>

      {/* Appearance */}
      <ListSection title="APPEARANCE" />
      <View
        style={[sharedStyles.section, { borderColor: theme.colors.border }]}
      >
        <View
          style={[
            styles.themeSelector,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.iconContainer}>
            <Icon name="sun" size="md" color={theme.colors.textMuted} />
          </View>
          <View style={sharedStyles.listItemContent}>
            <Text
              style={[sharedStyles.listItemTitle, { color: theme.colors.text }]}
            >
              Theme
            </Text>
          </View>
          <View style={styles.themeOptions}>
            {(
              [
                { value: 'LIGHT' as ThemePreference, icon: 'sun' as IconName },
                { value: 'DARK' as ThemePreference, icon: 'moon' as IconName },
                {
                  value: 'AUTO' as ThemePreference,
                  icon: 'smartphone' as IconName,
                },
              ] as const
            ).map(({ value, icon }) => (
              <TouchableOpacity
                key={value}
                onPress={() => handleThemeChange(value)}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      currentTheme === value
                        ? theme.colors.primary
                        : theme.colors.backgroundSecondary,
                  },
                ]}
              >
                <Icon
                  name={icon}
                  size="sm"
                  color={
                    currentTheme === value
                      ? theme.colors.textInverse
                      : theme.colors.text
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Security */}
      {biometricAvailable && (
        <>
          <ListSection title="SECURITY" />
          <View
            style={[sharedStyles.section, { borderColor: theme.colors.border }]}
          >
            <ListItemSwitch
              icon="fingerprint"
              title="Biometric Login"
              subtitle="Use biometrics to unlock the app"
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              showBorder={false}
            />
          </View>
        </>
      )}

      {/* Notifications */}
      <ListSection title="NOTIFICATIONS" />
      <View
        style={[sharedStyles.section, { borderColor: theme.colors.border }]}
      >
        <ListItem
          icon="bell"
          title="Notification Settings"
          subtitle="Configure push notifications"
          onPress={onNavigateToNotifications}
          showBorder={false}
        />
      </View>

      {/* Account Actions */}
      <ListSection title="ACCOUNT" />
      <View
        style={[sharedStyles.section, { borderColor: theme.colors.border }]}
      >
        <ListItem
          icon="log-out"
          title="Sign Out"
          onPress={handleLogout}
          showBorder={false}
        />
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appInfoText, { color: theme.colors.textMuted }]}>
          SuperMail v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  iconContainer: {
    width: 28,
    alignItems: 'center',
  },
  themeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: SPACING.sm,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  themeOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  appInfoText: {
    fontSize: FONT_SIZE.xs,
  },
});
