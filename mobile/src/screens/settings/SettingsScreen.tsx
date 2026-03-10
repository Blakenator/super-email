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
  Alert,
  Modal,
  Pressable,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { gql } from '@apollo/client';
import { config } from '../../config/env';
import { apolloClient } from '../../services/apollo';
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

const GET_BILLING_INFO_QUERY = gql`
  query GetBillingInfoMobile {
    getBillingInfo {
      subscription {
        status
        storageTier
        accountTier
        domainTier
        isValid
        currentPeriodEnd
        cancelAtPeriodEnd
      }
    }
  }
`;

interface BillingSubscription {
  status: string;
  storageTier: string;
  accountTier: string;
  domainTier: string;
  isValid: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

function formatTierName(tier: string): string {
  switch (tier) {
    case 'FREE':
      return 'Free';
    case 'BASIC':
      return 'Basic';
    case 'PRO':
      return 'Pro';
    case 'ENTERPRISE':
      return 'Enterprise';
    default:
      return tier;
  }
}

function formatStatus(status: string, isValid: boolean): string {
  if (isValid && status === 'ACTIVE') return 'Active';
  if (status === 'PAST_DUE') return 'Past Due';
  if (status === 'UNPAID') return 'Unpaid';
  if (status === 'CANCELED') return 'Canceled';
  return status;
}

interface SettingsScreenProps {
  onNavigateToAccounts: () => void;
  onNavigateToSendProfiles: () => void;
  onNavigateToDomains: () => void;
  onNavigateToTags: () => void;
  onNavigateToRules: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToNuke: () => void;
}

export function SettingsScreen({
  onNavigateToAccounts,
  onNavigateToSendProfiles,
  onNavigateToDomains,
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
    setBlockExternalImages,
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

  const handleBlockExternalImagesToggle = async (enabled: boolean) => {
    await setBlockExternalImages(enabled);
  };

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscription, setSubscription] =
    useState<BillingSubscription | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const fetchBillingInfo = async () => {
    setBillingLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: GET_BILLING_INFO_QUERY,
        fetchPolicy: 'network-only',
      });
      setSubscription(data?.getBillingInfo?.subscription ?? null);
    } catch (error) {
      // Billing info may not be available — show modal anyway
    } finally {
      setBillingLoading(false);
    }
  };

  const handleOpenSubscriptionModal = () => {
    setShowSubscriptionModal(true);
    fetchBillingInfo();
  };

  const handleOpenWebApp = () => {
    Linking.openURL(`${config.api.baseUrl}/settings`);
    setShowSubscriptionModal(false);
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
          subtitle="Email accounts"
          onPress={onNavigateToAccounts}
        />
        <ListItem
          icon="send"
          title="Send Profiles"
          subtitle="Outgoing email settings"
          onPress={onNavigateToSendProfiles}
        />
        <ListItem
          icon="globe"
          title="Custom Domains"
          subtitle="Manage custom email domains"
          onPress={onNavigateToDomains}
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

      {/* Privacy */}
      <ListSection title="PRIVACY" />
      <View
        style={[sharedStyles.section, { borderColor: theme.colors.border }]}
      >
        <ListItemSwitch
          icon="eye-off"
          title="Block External Images"
          subtitle="Prevent loading images in emails for privacy"
          value={user?.blockExternalImages ?? false}
          onValueChange={handleBlockExternalImagesToggle}
          showBorder={false}
        />
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

      {/* Subscription */}
      <ListSection title="SUBSCRIPTION" />
      <View
        style={[sharedStyles.section, { borderColor: theme.colors.border }]}
      >
        <ListItem
          icon="globe"
          title="Manage Subscription"
          subtitle="View and change your plan"
          onPress={handleOpenSubscriptionModal}
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

      {/* Subscription Modal */}
      <Modal
        visible={showSubscriptionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSubscriptionModal(false)}
        >
          <Pressable
            style={[
              styles.subscriptionModal,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.subscriptionModalIcon}>
              <Icon name="globe" size="xl" color={theme.colors.primary} />
            </View>
            <Text
              style={[
                styles.subscriptionModalTitle,
                { color: theme.colors.text },
              ]}
            >
              Manage Your Subscription
            </Text>

            {billingLoading ? (
              <ActivityIndicator
                style={styles.subscriptionModalLoader}
                color={theme.colors.primary}
              />
            ) : subscription ? (
              <View
                style={[
                  styles.subscriptionDetails,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <View style={styles.subscriptionRow}>
                  <Text
                    style={[
                      styles.subscriptionLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Status
                  </Text>
                  <Text
                    style={[
                      styles.subscriptionValue,
                      {
                        color: subscription.isValid
                          ? theme.colors.primary
                          : theme.colors.error,
                      },
                    ]}
                  >
                    {formatStatus(subscription.status, subscription.isValid)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.subscriptionDivider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
                <View style={styles.subscriptionRow}>
                  <Text
                    style={[
                      styles.subscriptionLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Storage
                  </Text>
                  <Text
                    style={[
                      styles.subscriptionValue,
                      { color: theme.colors.text },
                    ]}
                  >
                    {formatTierName(subscription.storageTier)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.subscriptionDivider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
                <View style={styles.subscriptionRow}>
                  <Text
                    style={[
                      styles.subscriptionLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Accounts
                  </Text>
                  <Text
                    style={[
                      styles.subscriptionValue,
                      { color: theme.colors.text },
                    ]}
                  >
                    {formatTierName(subscription.accountTier)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.subscriptionDivider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
                <View style={styles.subscriptionRow}>
                  <Text
                    style={[
                      styles.subscriptionLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Domains
                  </Text>
                  <Text
                    style={[
                      styles.subscriptionValue,
                      { color: theme.colors.text },
                    ]}
                  >
                    {formatTierName(subscription.domainTier)}
                  </Text>
                </View>
                {subscription.currentPeriodEnd && (
                  <>
                    <View
                      style={[
                        styles.subscriptionDivider,
                        { backgroundColor: theme.colors.border },
                      ]}
                    />
                    <View style={styles.subscriptionRow}>
                      <Text
                        style={[
                          styles.subscriptionLabel,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        {subscription.cancelAtPeriodEnd
                          ? 'Cancels On'
                          : 'Renews On'}
                      </Text>
                      <Text
                        style={[
                          styles.subscriptionValue,
                          { color: theme.colors.text },
                        ]}
                      >
                        {new Date(
                          subscription.currentPeriodEnd,
                        ).toLocaleDateString()}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            ) : null}

            <Text
              style={[
                styles.subscriptionModalBody,
                { color: theme.colors.textMuted },
              ]}
            >
              To change your plan or update billing information, visit the
              SuperMail web app.
            </Text>
            <TouchableOpacity
              style={[
                styles.subscriptionModalButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleOpenWebApp}
            >
              <Icon
                name="external-link"
                size="sm"
                color={theme.colors.textInverse}
              />
              <Text
                style={[
                  styles.subscriptionModalButtonText,
                  { color: theme.colors.textInverse },
                ]}
              >
                Open Web App
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.subscriptionModalDismiss}
              onPress={() => setShowSubscriptionModal(false)}
            >
              <Text
                style={[
                  styles.subscriptionModalDismissText,
                  { color: theme.colors.textMuted },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appInfoText, { color: theme.colors.textMuted }]}>
          SuperMail v{config.app.version}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  subscriptionModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  subscriptionModalIcon: {
    marginBottom: SPACING.md,
  },
  subscriptionModalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subscriptionModalLoader: {
    marginVertical: SPACING.lg,
  },
  subscriptionDetails: {
    width: '100%',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  subscriptionLabel: {
    fontSize: FONT_SIZE.sm,
  },
  subscriptionValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  subscriptionDivider: {
    height: StyleSheet.hairlineWidth,
  },
  subscriptionModalBody: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subscriptionModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    width: '100%',
  },
  subscriptionModalButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  subscriptionModalDismiss: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  subscriptionModalDismissText: {
    fontSize: FONT_SIZE.md,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  appInfoText: {
    fontSize: FONT_SIZE.xs,
  },
});
