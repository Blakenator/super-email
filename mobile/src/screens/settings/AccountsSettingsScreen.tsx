/**
 * Email Accounts Settings Screen
 * Manage IMAP/POP email accounts
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, sharedStyles, SPACING, FONT_SIZE } from '../../theme';
import { useEmailStore, EmailAccount } from '../../stores/emailStore';
import { Icon } from '../../components/ui';

interface AccountsSettingsScreenProps {
  onAddAccount?: () => void;
  onEditAccount?: (accountId: string) => void;
}

export function AccountsSettingsScreen({ onAddAccount, onEditAccount }: AccountsSettingsScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { emailAccounts, fetchEmailAccounts, isSyncing } = useEmailStore();

  useEffect(() => {
    fetchEmailAccounts();
  }, []);

  const renderAccount = (account: EmailAccount) => (
    <TouchableOpacity
      key={account.id}
      style={[
        styles.accountItem,
        { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
      ]}
      onPress={() => onEditAccount?.(account.id)}
    >
      <View style={[styles.accountIcon, { backgroundColor: theme.colors.primary }]}>
        <Icon name="mail" size="md" color={theme.colors.textInverse} />
      </View>
      <View style={styles.accountInfo}>
        <Text style={[styles.accountName, { color: theme.colors.text }]}>
          {account.name}
        </Text>
        <Text style={[styles.accountEmail, { color: theme.colors.textMuted }]}>
          {account.email}
        </Text>
        <View style={styles.accountMeta}>
          <Text style={[styles.accountType, { color: theme.colors.textMuted }]}>
            {account.accountType} • {account.host}
          </Text>
          {account.isDefault && (
            <View style={[styles.defaultBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.defaultText, { color: theme.colors.primary }]}>Default</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.accountStatus}>
        {(account.isHistoricalSyncing || account.isUpdateSyncing) ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Icon name="chevron-right" size="md" color={theme.colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[sharedStyles.screenScrollContent, { paddingBottom: Math.max(SPACING.xl, insets.bottom + SPACING.md) }]}
    >
      <View style={[sharedStyles.sectionHeader]}>
        <Text style={[sharedStyles.sectionTitle, { color: theme.colors.textMuted }]}>
          EMAIL ACCOUNTS
        </Text>
      </View>

      <View style={[sharedStyles.section, { borderColor: theme.colors.border }]}>
        {emailAccounts.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
            <Icon name="inbox" size="xl" color={theme.colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No email accounts
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              Add an email account to start receiving emails.
            </Text>
          </View>
        ) : (
          emailAccounts.map(renderAccount)
        )}
      </View>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={onAddAccount}
      >
        <Icon name="plus" size="md" color={theme.colors.textInverse} />
        <Text style={[styles.addButtonText, { color: theme.colors.textInverse }]}>Add Email Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
  accountEmail: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  accountMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: SPACING.sm,
  },
  accountType: {
    fontSize: FONT_SIZE.xs,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  accountStatus: {
    width: 24,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  addButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
});
