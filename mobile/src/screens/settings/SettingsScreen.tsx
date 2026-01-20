/**
 * Settings Screen
 * User preferences and app settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme';
import { useAuthStore, ThemePreference } from '../../stores/authStore';
import { getBiometricTypeName } from '../../services/biometricAuth';

interface SettingsScreenProps {
  onNavigateToAccounts: () => void;
  onNavigateToSmtp: () => void;
  onNavigateToTags: () => void;
  onNavigateToRules: () => void;
  onNavigateToNotifications: () => void;
}

export function SettingsScreen({
  onNavigateToAccounts,
  onNavigateToSmtp,
  onNavigateToTags,
  onNavigateToRules,
  onNavigateToNotifications,
}: SettingsScreenProps) {
  const theme = useTheme();
  const {
    user,
    logout,
    biometricAvailable,
    biometricEnabled,
    biometricType,
    setBiometric,
  } = useAuthStore();
  
  const [selectedTheme, setSelectedTheme] = useState<ThemePreference>(
    user?.themePreference || 'AUTO'
  );
  
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
  
  const biometricName = getBiometricTypeName(biometricType);
  
  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
        {title}
      </Text>
    </View>
  );
  
  const renderSettingRow = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      style={[
        styles.settingRow,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.colors.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        onPress && (
          <Text style={{ color: theme.colors.textMuted }}>›</Text>
        )
      )}
    </TouchableOpacity>
  );
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* User Info */}
      {user && (
        <View
          style={[
            styles.userCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View
            style={[
              styles.userAvatar,
              { backgroundColor: theme.colors.primary },
            ]}
          >
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
      
      <View style={styles.section}>
        {renderSettingRow(
          '📥',
          'Email Accounts',
          'IMAP/POP email accounts',
          onNavigateToAccounts
        )}
        {renderSettingRow(
          '📤',
          'SMTP Profiles',
          'Outgoing email settings',
          onNavigateToSmtp
        )}
        {renderSettingRow(
          '🏷️',
          'Tags',
          'Manage email labels',
          onNavigateToTags
        )}
        {renderSettingRow(
          '⚙️',
          'Mail Rules',
          'Automatic email filtering',
          onNavigateToRules
        )}
      </View>
      
      {/* Appearance */}
      {renderSectionHeader('APPEARANCE')}
      
      <View style={styles.section}>
        <View
          style={[
            styles.themeSelector,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={styles.settingIcon}>🎨</Text>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              Theme
            </Text>
          </View>
          <View style={styles.themeOptions}>
            {(['LIGHT', 'DARK', 'AUTO'] as ThemePreference[]).map((themeOption) => (
              <TouchableOpacity
                key={themeOption}
                onPress={() => setSelectedTheme(themeOption)}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      selectedTheme === themeOption
                        ? theme.colors.primary
                        : theme.colors.backgroundSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color:
                        selectedTheme === themeOption
                          ? theme.colors.textInverse
                          : theme.colors.text,
                    },
                  ]}
                >
                  {themeOption === 'AUTO'
                    ? '🔄'
                    : themeOption === 'LIGHT'
                      ? '☀️'
                      : '🌙'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      
      {/* Security */}
      {renderSectionHeader('SECURITY')}
      
      <View style={styles.section}>
        {biometricAvailable && (
          renderSettingRow(
            biometricType === 'facial' ? '👤' : '👆',
            `${biometricName} Login`,
            `Use ${biometricName} to unlock the app`,
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
      
      <View style={styles.section}>
        {renderSettingRow(
          '🔔',
          'Notification Settings',
          'Configure push notifications',
          onNavigateToNotifications
        )}
      </View>
      
      {/* Account Actions */}
      {renderSectionHeader('ACCOUNT')}
      
      <View style={styles.section}>
        <TouchableOpacity
          onPress={handleLogout}
          style={[
            styles.settingRow,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={styles.settingIcon}>🚪</Text>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.colors.error }]}>
              Sign Out
            </Text>
          </View>
        </TouchableOpacity>
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
  content: {
    paddingBottom: 32,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 12,
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
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  settingIcon: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  themeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionText: {
    fontSize: 16,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appInfoText: {
    fontSize: 12,
  },
});
