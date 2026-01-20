/**
 * Inbox Screen
 * Main email list view with folder tabs and account switcher
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { useEmailStore, EmailFolder, Email, EmailAccount } from '../../stores/emailStore';
import { EmailListItem } from '../../components/email';
import { Icon } from '../../components/ui';

interface FolderConfig {
  key: EmailFolder;
  label: string;
  icon: React.ComponentProps<typeof Icon>['name'];
}

const FOLDERS: FolderConfig[] = [
  { key: 'INBOX', label: 'Inbox', icon: 'inbox' },
  { key: 'SENT', label: 'Sent', icon: 'send' },
  { key: 'DRAFTS', label: 'Drafts', icon: 'file-text' },
  { key: 'ARCHIVE', label: 'Archive', icon: 'archive' },
  { key: 'TRASH', label: 'Trash', icon: 'trash-2' },
];

interface InboxScreenProps {
  onEmailPress: (emailId: string) => void;
  onComposePress: () => void;
}

export function InboxScreen({ onEmailPress, onComposePress }: InboxScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const {
    emails,
    emailAccounts,
    currentFolder,
    currentAccountId,
    totalCount,
    isLoading,
    isSyncing,
    selectedIds,
    setFolder,
    setAccountId,
    fetchEmails,
    syncAllAccounts,
    markAsStarred,
    markAsRead,
    toggleSelection,
    clearSelection,
    fetchEmailAccounts,
  } = useEmailStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  
  useEffect(() => {
    fetchEmails();
    fetchEmailAccounts();
  }, []);
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await syncAllAccounts();
    setIsRefreshing(false);
  }, [syncAllAccounts]);
  
  const handleStarPress = useCallback((email: Email) => {
    markAsStarred([email.id], !email.isStarred);
  }, [markAsStarred]);
  
  const handleEmailPress = useCallback((email: Email) => {
    if (!email.isRead) {
      markAsRead([email.id], true);
    }
    onEmailPress(email.id);
  }, [onEmailPress, markAsRead]);

  const handleAccountSelect = useCallback((accountId: string | null) => {
    setAccountId(accountId);
    setShowAccountPicker(false);
  }, [setAccountId]);

  const currentAccount = emailAccounts.find(a => a.id === currentAccountId);
  
  const renderFolderTab = ({ key, label, icon }: FolderConfig) => {
    const isActive = currentFolder === key;
    
    return (
      <TouchableOpacity
        key={key}
        onPress={() => setFolder(key)}
        style={[
          styles.folderTab,
          isActive && {
            borderBottomColor: theme.colors.primary,
            borderBottomWidth: 2,
          },
        ]}
      >
        <Icon
          name={icon}
          size="sm"
          color={isActive ? theme.colors.primary : theme.colors.textMuted}
        />
        <Text
          style={[
            styles.folderLabel,
            {
              color: isActive ? theme.colors.primary : theme.colors.textMuted,
              fontWeight: isActive ? '600' : '400',
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };
  
  const renderEmail = ({ item }: { item: Email }) => (
    <EmailListItem
      email={item}
      onPress={() => handleEmailPress(item)}
      onStarPress={() => handleStarPress(item)}
      onSelectPress={() => toggleSelection(item.id)}
      isSelected={selectedIds.has(item.id)}
      showCheckbox={selectedIds.size > 0}
    />
  );
  
  const renderEmptyState = () => (
    <View style={sharedStyles.emptyContainer}>
      <Icon name="inbox" size="xl" color={theme.colors.textMuted} />
      <Text style={[sharedStyles.emptyTitle, { color: theme.colors.text }]}>
        No emails
      </Text>
      <Text style={[sharedStyles.emptySubtitle, { color: theme.colors.textMuted }]}>
        {currentFolder === 'INBOX'
          ? 'Your inbox is empty. Pull down to refresh.'
          : `No emails in ${currentFolder.toLowerCase()}.`}
      </Text>
    </View>
  );
  
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        {totalCount} email{totalCount !== 1 ? 's' : ''}
      </Text>
      {isSyncing && (
        <View style={styles.syncIndicator}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.syncText, { color: theme.colors.textMuted }]}>
            Syncing...
          </Text>
        </View>
      )}
    </View>
  );

  const renderAccountPicker = () => (
    <Modal
      visible={showAccountPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAccountPicker(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowAccountPicker(false)}
      >
        <View style={[styles.accountPickerModal, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.pickerHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>
              Select Account
            </Text>
            <TouchableOpacity onPress={() => setShowAccountPicker(false)}>
              <Icon name="x" size="md" color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* All Accounts option */}
          <TouchableOpacity
            style={[
              styles.accountOption,
              { borderBottomColor: theme.colors.border },
              currentAccountId === null && { backgroundColor: theme.colors.primary + '10' },
            ]}
            onPress={() => handleAccountSelect(null)}
          >
            <View style={[styles.accountAvatar, { backgroundColor: theme.colors.primary }]}>
              <Icon name="inbox" size="sm" color="#fff" />
            </View>
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: theme.colors.text }]}>
                All Accounts
              </Text>
              <Text style={[styles.accountEmail, { color: theme.colors.textMuted }]}>
                View emails from all accounts
              </Text>
            </View>
            {currentAccountId === null && (
              <Icon name="check" size="md" color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          
          {/* Individual accounts */}
          {emailAccounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountOption,
                { borderBottomColor: theme.colors.border },
                currentAccountId === account.id && { backgroundColor: theme.colors.primary + '10' },
              ]}
              onPress={() => handleAccountSelect(account.id)}
            >
              <View style={[styles.accountAvatar, { backgroundColor: theme.colors.secondary }]}>
                <Icon name="mail" size="sm" color="#fff" />
              </View>
              <View style={styles.accountInfo}>
                <Text style={[styles.accountName, { color: theme.colors.text }]}>
                  {account.name}
                </Text>
                <Text style={[styles.accountEmail, { color: theme.colors.textMuted }]}>
                  {account.email}
                </Text>
              </View>
              {currentAccountId === account.id && (
                <Icon name="check" size="md" color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Account Switcher */}
      <TouchableOpacity
        style={[styles.accountSwitcher, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}
        onPress={() => setShowAccountPicker(true)}
      >
        <View style={[styles.accountSwitcherAvatar, { backgroundColor: theme.colors.primary }]}>
          <Icon name={currentAccountId ? 'mail' : 'inbox'} size="sm" color="#fff" />
        </View>
        <Text style={[styles.accountSwitcherText, { color: theme.colors.text }]} numberOfLines={1}>
          {currentAccount?.name || 'All Accounts'}
        </Text>
        <Icon name="chevron-down" size="sm" color={theme.colors.textMuted} />
      </TouchableOpacity>

      {/* Folder Tabs */}
      <View style={[styles.folderTabs, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <FlatList
          data={FOLDERS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => renderFolderTab(item)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.folderTabsContent}
        />
      </View>
      
      {/* Email List */}
      <FlatList
        data={emails}
        keyExtractor={(item) => item.id}
        renderItem={renderEmail}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          emails.length === 0 && styles.listContentEmpty,
        ]}
      />
      
      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <View style={[styles.bulkActions, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <Text style={[styles.selectedCount, { color: theme.colors.text }]}>
            {selectedIds.size} selected
          </Text>
          <View style={styles.bulkButtons}>
            <TouchableOpacity
              onPress={() => markAsRead(Array.from(selectedIds), true)}
              style={styles.bulkButton}
            >
              <Icon name="check" size="sm" color={theme.colors.text} />
              <Text style={[styles.bulkButtonText, { color: theme.colors.text }]}>Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => markAsStarred(Array.from(selectedIds), true)}
              style={styles.bulkButton}
            >
              <Icon name="star" size="sm" color={theme.colors.text} />
              <Text style={[styles.bulkButtonText, { color: theme.colors.text }]}>Star</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearSelection} style={styles.bulkButton}>
              <Icon name="x" size="sm" color={theme.colors.text} />
              <Text style={[styles.bulkButtonText, { color: theme.colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Compose FAB */}
      <TouchableOpacity
        style={[sharedStyles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + SPACING.md }]}
        onPress={onComposePress}
        activeOpacity={0.8}
      >
        <Icon name="edit-2" size="lg" color="#fff" />
      </TouchableOpacity>
      
      {/* Loading Overlay */}
      {isLoading && emails.length === 0 && (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.background + 'E6' }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading emails...
          </Text>
        </View>
      )}

      {/* Account Picker Modal */}
      {renderAccountPicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accountSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  accountSwitcherAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountSwitcherText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  folderTabs: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  folderTabsContent: {
    paddingHorizontal: SPACING.sm,
  },
  folderTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  folderLabel: {
    fontSize: FONT_SIZE.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  syncText: {
    fontSize: FONT_SIZE.xs,
  },
  listContent: {
    flexGrow: 1,
  },
  listContentEmpty: {
    flex: 1,
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  selectedCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  bulkButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  bulkButtonText: {
    fontSize: FONT_SIZE.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  accountPickerModal: {
    borderRadius: RADIUS.lg,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  accountEmail: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
});
