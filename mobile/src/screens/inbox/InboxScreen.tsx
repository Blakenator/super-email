/**
 * Inbox Screen
 * Main email list view with folder tabs
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useEmailStore, EmailFolder, Email } from '../../stores/emailStore';
import { EmailListItem } from '../../components/email';

const FOLDERS: { key: EmailFolder; label: string; icon: string }[] = [
  { key: 'INBOX', label: 'Inbox', icon: '📥' },
  { key: 'SENT', label: 'Sent', icon: '📤' },
  { key: 'DRAFTS', label: 'Drafts', icon: '📝' },
  { key: 'ARCHIVE', label: 'Archive', icon: '📦' },
  { key: 'TRASH', label: 'Trash', icon: '🗑️' },
];

interface InboxScreenProps {
  onEmailPress: (emailId: string) => void;
}

export function InboxScreen({ onEmailPress }: InboxScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const {
    emails,
    currentFolder,
    totalCount,
    isLoading,
    isSyncing,
    selectedIds,
    setFolder,
    fetchEmails,
    syncAllAccounts,
    markAsStarred,
    markAsRead,
    toggleSelection,
    selectAll,
    clearSelection,
    fetchEmailAccounts,
  } = useEmailStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
    // Mark as read if unread
    if (!email.isRead) {
      markAsRead([email.id], true);
    }
    onEmailPress(email.id);
  }, [onEmailPress, markAsRead]);
  
  const renderFolderTab = ({ key, label, icon }: typeof FOLDERS[0]) => {
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
        <Text style={styles.folderIcon}>{icon}</Text>
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
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No emails
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
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
  
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* Folder Tabs */}
      <View
        style={[
          styles.folderTabs,
          { backgroundColor: theme.colors.surface },
        ]}
      >
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
        <View
          style={[
            styles.bulkActions,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text style={[styles.selectedCount, { color: theme.colors.text }]}>
            {selectedIds.size} selected
          </Text>
          <View style={styles.bulkButtons}>
            <TouchableOpacity
              onPress={() => markAsRead(Array.from(selectedIds), true)}
              style={styles.bulkButton}
            >
              <Text style={styles.bulkButtonText}>✓ Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => markAsStarred(Array.from(selectedIds), true)}
              style={styles.bulkButton}
            >
              <Text style={styles.bulkButtonText}>⭐ Star</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={clearSelection}
              style={styles.bulkButton}
            >
              <Text style={styles.bulkButtonText}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Loading Overlay */}
      {isLoading && emails.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading emails...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  folderTabs: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  folderTabsContent: {
    paddingHorizontal: 8,
  },
  folderTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  folderIcon: {
    fontSize: 16,
  },
  folderLabel: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncText: {
    fontSize: 12,
  },
  listContent: {
    flexGrow: 1,
  },
  listContentEmpty: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  bulkButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  bulkButton: {
    padding: 8,
  },
  bulkButtonText: {
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});
