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
  Switch,
  Alert,
} from 'react-native';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { useAuthStore, ThemePreference } from '../../stores/authStore';
import { Icon, IconName, useSafeInsets } from '../../components/ui';

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
  const { top: topInset } = useSafeInsets(['top']);
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
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };
  
  const handleBiometricToggle = async (enabled: boolean) => {
    await setBiometric(enabled);
  };

  const handleThemeChange = async (newTheme: ThemePreference) => {
    await setThemePreference(newTheme);
  };
  
  const renderSectionHeader = (title: string) => (
    <View style={sharedStyles.sectionHeader}>
      <Text style={[sharedStyles.sectionTitle, { color: theme.colors.textMuted }]}>
        {title}
      </Text>
    </View>
  );
  
  const renderSettingRow = (
    icon: IconName,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    destructive?: boolean
  ) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      style={[
        sharedStyles.listItem,
        sharedStyles.listItemBorder,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
      ]}
    >
      <View style={styles.iconContainer}>
        <Icon name={icon} size="md" color={destructive ? theme.colors.error : theme.colors.textMuted} />
      </View>
      <View style={sharedStyles.listItemContent}>
        <Text style={[sharedStyles.listItemTitle, { color: destructive ? theme.colors.error : theme.colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[sharedStyles.listItemSubtitle, { color: theme.colors.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        onPress && (
          <Icon name="chevron-right" size="md" color={theme.colors.textMuted} />
        )
      )}
    </TouchableOpacity>
  );
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[sharedStyles.screenScrollContent, { paddingTop: topInset }]}
    >
      {/* User Info */}
      {user && (
        <View style={[styles.userCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.userAvatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.userAvatarText}>
              {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
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
      {renderSectionHeader('EMAIL CONFIGURATION')}
      
      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {renderSettingRow(
          'inbox',
          'Email Accounts',
          'IMAP/POP email accounts',
          onNavigateToAccounts
        )}
        {renderSettingRow(
          'send',
          'SMTP Profiles',
          'Outgoing email settings',
          onNavigateToSmtp
        )}
        {renderSettingRow(
          'tag',
          'Tags',
          'Manage email labels',
          onNavigateToTags
        )}
        {renderSettingRow(
          'zap',
          'Mail Rules',
          'Automatic email filtering',
          onNavigateToRules
        )}
      </View>

      {/* Inbox Tools */}
      {renderSectionHeader('INBOX TOOLS')}
      
      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {renderSettingRow(
          'zap',
          'Inbox Nuke',
          'Bulk archive old emails',
          onNavigateToNuke
        )}
      </View>
      
      {/* Appearance */}
      {renderSectionHeader('APPEARANCE')}
      
      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        <View style={[styles.themeSelector, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.iconContainer}>
            <Icon name="sun" size="md" color={theme.colors.textMuted} />
          </View>
          <View style={sharedStyles.listItemContent}>
            <Text style={[sharedStyles.listItemTitle, { color: theme.colors.text }]}>
              Theme
            </Text>
          </View>
          <View style={styles.themeOptions}>
            {([
              { value: 'LIGHT' as ThemePreference, icon: 'sun' as IconName },
              { value: 'DARK' as ThemePreference, icon: 'moon' as IconName },
              { value: 'AUTO' as ThemePreference, icon: 'smartphone' as IconName },
            ]).map(({ value, icon }) => (
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
                  color={currentTheme === value ? '#fff' : theme.colors.text}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      
      {/* Security */}
      {renderSectionHeader('SECURITY')}
      
      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {biometricAvailable && (
          renderSettingRow(
            'fingerprint',
            'Biometric Login',
            'Use biometrics to unlock the app',
            undefined,
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ true: theme.colors.primary }}
            />
          )
        )}
      </View>
      
      {/* Notifications */}
      {renderSectionHeader('NOTIFICATIONS')}
      
      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {renderSettingRow(
          'bell',
          'Notification Settings',
          'Configure push notifications',
          onNavigateToNotifications
        )}
      </View>
      
      {/* Account Actions */}
      {renderSectionHeader('ACCOUNT')}
      
      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {renderSettingRow(
          'log-out',
          'Sign Out',
          undefined,
          handleLogout,
          undefined,
          true
        )}
      </View>
      
      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appInfoText, { color: theme.colors.textMuted }]}>
          StacksMail v1.0.0
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
    color: '#ffffff',
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
