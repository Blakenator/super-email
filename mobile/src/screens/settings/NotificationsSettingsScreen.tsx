/**
 * Notifications Settings Screen
 * Configure push notification preferences
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { scheduleLocalNotification } from '../../services/notifications';

export function NotificationsSettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const [settings, setSettings] = useState({
    pushEnabled: true,
    newEmailNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    showPreview: user?.notificationDetailLevel === 'FULL',
    quietHoursEnabled: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTestNotification = async () => {
    try {
      await scheduleLocalNotification(
        'Test Notification',
        'This is a test notification from SuperMail!',
        { type: 'test' }
      );
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification. Please check notification permissions.');
      console.error('Test notification error:', error);
    }
  };

  const renderSwitchRow = (
    icon: React.ComponentProps<typeof Icon>['name'],
    title: string,
    subtitle: string,
    settingKey: keyof typeof settings
  ) => (
    <View
      style={[
        styles.settingRow,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
      ]}
    >
      <View style={styles.settingIcon}>
        <Icon name={icon} size="md" color={theme.colors.textMuted} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ true: theme.colors.primary }}
      />
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[sharedStyles.screenScrollContent, { paddingBottom: Math.max(SPACING.xl, insets.bottom + SPACING.md) }]}
    >
      <View style={[sharedStyles.sectionHeader]}>
        <Text style={[sharedStyles.sectionTitle, { color: theme.colors.textMuted }]}>
          PUSH NOTIFICATIONS
        </Text>
      </View>

      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {renderSwitchRow(
          'bell',
          'Push Notifications',
          'Receive notifications for new emails',
          'pushEnabled'
        )}
        {renderSwitchRow(
          'mail',
          'New Email Alerts',
          'Get notified when new emails arrive',
          'newEmailNotifications'
        )}
      </View>

      <View style={[sharedStyles.sectionHeader]}>
        <Text style={[sharedStyles.sectionTitle, { color: theme.colors.textMuted }]}>
          NOTIFICATION STYLE
        </Text>
      </View>

      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {renderSwitchRow(
          'eye',
          'Show Preview',
          'Display sender and subject in notifications',
          'showPreview'
        )}
      </View>

      <View style={[sharedStyles.sectionHeader]}>
        <Text style={[sharedStyles.sectionTitle, { color: theme.colors.textMuted }]}>
          SOUNDS & HAPTICS
        </Text>
      </View>

      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {renderSwitchRow(
          'bell',
          'Notification Sound',
          'Play a sound for notifications',
          'soundEnabled'
        )}
      </View>

      <View style={[sharedStyles.sectionHeader]}>
        <Text style={[sharedStyles.sectionTitle, { color: theme.colors.textMuted }]}>
          QUIET HOURS
        </Text>
      </View>

      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {renderSwitchRow(
          'moon',
          'Quiet Hours',
          'Silence notifications during set hours',
          'quietHoursEnabled'
        )}
      </View>

      <View style={[sharedStyles.sectionHeader]}>
        <Text style={[sharedStyles.sectionTitle, { color: theme.colors.textMuted }]}>
          TESTING
        </Text>
      </View>

      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[
            styles.testButton,
            { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
          ]}
          onPress={handleTestNotification}
        >
          <View style={styles.settingIcon}>
            <Icon name="bell" size="md" color={theme.colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Send Test Notification</Text>
            <Text style={[styles.settingSubtitle, { color: theme.colors.textMuted }]}>Test your notification settings</Text>
          </View>
          <Icon name="send" size="sm" color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  settingIcon: {
    width: 32,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONT_SIZE.lg,
  },
  settingSubtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
});
