/**
 * Inbox Screen
 * Main email list view with folder tabs, account switcher, search/filtering, and pagination
 */

import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { DateTime } from 'luxon';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useTheme,
  sharedStyles,
  SPACING,
  FONT_SIZE,
  RADIUS,
} from '../../theme';
import {
  useEmailStore,
  EmailFolder,
  Email,
  EmailAccount,
} from '../../stores/emailStore';
import { useAuthStore } from '../../stores/authStore';
import { EmailListItem } from '../../components/email';
import { Icon } from '../../components/ui';

type FilterMode = 'all' | 'unread' | 'starred';
type GroupMode = 'none' | 'date';

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
  onNukePress: () => void;
}

export function InboxScreen({
  onEmailPress,
  onComposePress,
  onNukePress,
}: InboxScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, setInboxGroupByDate } = useAuthStore();

  const {
    emails,
    emailAccounts,
    currentFolder,
    currentAccountId,
    totalCount,
    page,
    pageSize,
    isLoading,
    isSyncing,
    searchQuery,
    selectedIds,
    setFolder,
    setAccountId,
    setSearchQuery,
    setPage,
    setFilters,
    fetchEmails,
    syncAllAccounts,
    markAsStarred,
    markAsRead,
    moveToFolder,
    deleteEmails,
    toggleSelection,
    clearSelection,
    fetchEmailAccounts,
  } = useEmailStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [groupMode, setGroupMode] = useState<GroupMode>(
    user?.inboxGroupByDate ? 'date' : 'none',
  );
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [hasAttachments, setHasAttachments] = useState(false);

  // Refs for scroll-to-top on page change
  const flatListRef = useRef<FlatList<Email>>(null);
  const sectionListRef = useRef<SectionList<Email>>(null);

  // Scroll to top when page changes (only if there are items)
  useEffect(() => {
    if (emails.length === 0) return;

    if (groupMode === 'date' && sectionListRef.current) {
      try {
        sectionListRef.current.scrollToLocation({
          sectionIndex: 0,
          itemIndex: 0,
          animated: true,
        });
      } catch {
        // Ignore scroll errors when list is empty or not ready
      }
    } else if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [page, groupMode, emails.length]);

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Emails are already filtered by the backend
  const filteredEmails = emails;

  // Group emails by date for SectionList
  const groupedEmails = useMemo(() => {
    if (groupMode === 'none') return null;

    const now = DateTime.now();
    const today = now.startOf('day');
    const yesterday = today.minus({ days: 1 });
    const weekAgo = today.minus({ days: 7 });
    const monthAgo = today.minus({ days: 30 });

    const groups: { title: string; data: Email[] }[] = [
      { title: 'Today', data: [] },
      { title: 'Yesterday', data: [] },
      { title: 'Last 7 Days', data: [] },
      { title: 'Last 30 Days', data: [] },
      { title: 'Older', data: [] },
    ];

    for (const email of filteredEmails) {
      const emailDate = DateTime.fromISO(email.receivedAt);
      if (emailDate >= today) {
        groups[0].data.push(email);
      } else if (emailDate >= yesterday) {
        groups[1].data.push(email);
      } else if (emailDate >= weekAgo) {
        groups[2].data.push(email);
      } else if (emailDate >= monthAgo) {
        groups[3].data.push(email);
      } else {
        groups[4].data.push(email);
      }
    }

    // Filter out empty groups
    return groups.filter((g) => g.data.length > 0);
  }, [filteredEmails, groupMode]);

  const handleSearchSubmit = () => {
    setSearchQuery(localSearchQuery);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleArchive = useCallback(
    (emailId: string) => {
      moveToFolder([emailId], 'ARCHIVE');
    },
    [moveToFolder],
  );

  const handleDelete = useCallback(
    (emailId: string) => {
      deleteEmails([emailId]);
    },
    [deleteEmails],
  );

  const handleMarkRead = useCallback(
    (emailId: string, isRead: boolean) => {
      markAsRead([emailId], !isRead);
    },
    [markAsRead],
  );

  useEffect(() => {
    fetchEmails();
    fetchEmailAccounts();
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await syncAllAccounts();
    } finally {
      setIsRefreshing(false);
    }
  }, [syncAllAccounts]);

  const handleStarPress = useCallback(
    (email: Email) => {
      markAsStarred([email.id], !email.isStarred);
    },
    [markAsStarred],
  );

  const handleEmailPress = useCallback(
    (email: Email) => {
      if (!email.isRead) {
        markAsRead([email.id], true);
      }
      onEmailPress(email.id);
    },
    [onEmailPress, markAsRead],
  );

  const handleAccountSelect = useCallback(
    (accountId: string | null) => {
      setAccountId(accountId);
      setShowAccountPicker(false);
    },
    [setAccountId],
  );

  const currentAccount = emailAccounts.find((a) => a.id === currentAccountId);

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
      onArchive={() => handleArchive(item.id)}
      onDelete={() => handleDelete(item.id)}
      onMarkRead={() => handleMarkRead(item.id, item.isRead)}
    />
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Text
        style={[styles.sectionHeaderText, { color: theme.colors.textMuted }]}
      >
        {section.title}
      </Text>
    </View>
  );

  // Render email with card wrapper when grouping is enabled
  const renderEmailGrouped = ({
    item,
    index,
    section,
  }: {
    item: Email;
    index: number;
    section: { title: string; data: Email[] };
  }) => {
    const isFirst = index === 0;
    const isLast = index === section.data.length - 1;

    return (
      <View
        style={[
          styles.emailCardWrapper,
          { backgroundColor: theme.colors.surface },
          isFirst && styles.emailCardFirst,
          isLast && styles.emailCardLast,
          !isFirst && !isLast && styles.emailCardMiddle,
        ]}
      >
        <EmailListItem
          email={item}
          onPress={() => handleEmailPress(item)}
          onStarPress={() => handleStarPress(item)}
          onSelectPress={() => toggleSelection(item.id)}
          isSelected={selectedIds.has(item.id)}
          showCheckbox={selectedIds.size > 0}
          onArchive={() => handleArchive(item.id)}
          onDelete={() => handleDelete(item.id)}
          onMarkRead={() => handleMarkRead(item.id, item.isRead)}
        />
        {!isLast && (
          <View
            style={[
              styles.emailDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={sharedStyles.emptyContainer}>
      <Icon name="inbox" size="xl" color={theme.colors.textMuted} />
      <Text style={[sharedStyles.emptyTitle, { color: theme.colors.text }]}>
        No emails
      </Text>
      <Text
        style={[sharedStyles.emptySubtitle, { color: theme.colors.textMuted }]}
      >
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
      {isSyncing && !isRefreshing && (
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
        <View
          style={[
            styles.accountPickerModal,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(insets.bottom, SPACING.md),
            },
          ]}
        >
          <View
            style={[
              styles.pickerHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
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
              currentAccountId === null && {
                backgroundColor: theme.colors.primary + '10',
              },
            ]}
            onPress={() => handleAccountSelect(null)}
          >
            <View
              style={[
                styles.accountAvatar,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Icon name="inbox" size="sm" color={theme.colors.textInverse} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: theme.colors.text }]}>
                All Accounts
              </Text>
              <Text
                style={[styles.accountEmail, { color: theme.colors.textMuted }]}
              >
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
                currentAccountId === account.id && {
                  backgroundColor: theme.colors.primary + '10',
                },
              ]}
              onPress={() => handleAccountSelect(account.id)}
            >
              <View
                style={[
                  styles.accountAvatar,
                  { backgroundColor: theme.colors.secondary },
                ]}
              >
                <Icon name="mail" size="sm" color={theme.colors.textInverse} />
              </View>
              <View style={styles.accountInfo}>
                <Text
                  style={[styles.accountName, { color: theme.colors.text }]}
                >
                  {account.name}
                </Text>
                <Text
                  style={[
                    styles.accountEmail,
                    { color: theme.colors.textMuted },
                  ]}
                >
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header with Account Switcher & Search */}
        <View
          style={[
            styles.headerBar,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
              paddingTop: insets.top,
            },
          ]}
        >
          {showSearch ? (
            /* Search Bar */
            <View style={styles.searchBar}>
              <Icon name="search" size="sm" color={theme.colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Search emails..."
                placeholderTextColor={theme.colors.textMuted}
                value={localSearchQuery}
                onChangeText={setLocalSearchQuery}
                onSubmitEditing={handleSearchSubmit}
                autoFocus
                returnKeyType="search"
              />
              <TouchableOpacity onPress={handleClearSearch}>
                <Icon name="x" size="sm" color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            /* Account Switcher */
            <>
              <TouchableOpacity
                style={styles.accountSwitcher}
                onPress={() => setShowAccountPicker(true)}
              >
                <View
                  style={[
                    styles.accountSwitcherAvatar,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Icon
                    name={currentAccountId ? 'mail' : 'inbox'}
                    size="sm"
                    color={theme.colors.textInverse}
                  />
                </View>
                <Text
                  style={[
                    styles.accountSwitcherText,
                    { color: theme.colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {currentAccount?.name || 'All Accounts'}
                </Text>
                <Icon
                  name="chevron-down"
                  size="sm"
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowSearch(true)}
              >
                <Icon name="search" size="md" color={theme.colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowFilterMenu(true)}
              >
                <Icon
                  name="filter"
                  size="md"
                  color={
                    filterMode !== 'all' ||
                    hasAttachments ||
                    groupMode !== 'none'
                      ? theme.colors.primary
                      : theme.colors.textMuted
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowMoreMenu(true)}
              >
                <Icon
                  name="more-vertical"
                  size="md"
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Active Filters Banner */}
        {(filterMode !== 'all' || searchQuery) && (
          <View
            style={[
              styles.filterBanner,
              { backgroundColor: theme.colors.primary + '15' },
            ]}
          >
            <Text
              style={[styles.filterBannerText, { color: theme.colors.primary }]}
            >
              {filterMode !== 'all' && `Showing ${filterMode} emails`}
              {filterMode !== 'all' && searchQuery && ' • '}
              {searchQuery && `Search: "${searchQuery}"`}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setFilterMode('all');
                handleClearSearch();
              }}
            >
              <Icon name="x" size="sm" color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Folder Tabs */}
        <View
          style={[
            styles.folderTabs,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
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

        {/* Email List - Use SectionList when grouping is enabled */}
        {groupMode === 'date' && groupedEmails ? (
          <SectionList
            ref={sectionListRef}
            sections={groupedEmails}
            keyExtractor={(item) => item.id}
            renderItem={renderEmailGrouped}
            renderSectionHeader={renderSectionHeader}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={!isLoading ? renderEmptyState : null}
            ListFooterComponent={
              totalPages > 1 ? (
                <View
                  style={[
                    styles.pagination,
                    { borderTopColor: theme.colors.border },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      !hasPrevPage && styles.paginationButtonDisabled,
                    ]}
                    onPress={() => hasPrevPage && setPage(page - 1)}
                    disabled={!hasPrevPage}
                  >
                    <Icon
                      name="chevron-left"
                      size="md"
                      color={
                        hasPrevPage
                          ? theme.colors.primary
                          : theme.colors.textMuted
                      }
                    />
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.paginationText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Page {page} of {totalPages}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      !hasNextPage && styles.paginationButtonDisabled,
                    ]}
                    onPress={() => hasNextPage && setPage(page + 1)}
                    disabled={!hasNextPage}
                  >
                    <Icon
                      name="chevron-right"
                      size="md"
                      color={
                        hasNextPage
                          ? theme.colors.primary
                          : theme.colors.textMuted
                      }
                    />
                  </TouchableOpacity>
                </View>
              ) : null
            }
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
              filteredEmails.length === 0 && styles.listContentEmpty,
            ]}
            stickySectionHeadersEnabled={true}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredEmails}
            keyExtractor={(item) => item.id}
            renderItem={renderEmail}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={!isLoading ? renderEmptyState : null}
            ListFooterComponent={
              totalPages > 1 ? (
                <View
                  style={[
                    styles.pagination,
                    { borderTopColor: theme.colors.border },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      !hasPrevPage && styles.paginationButtonDisabled,
                    ]}
                    onPress={() => hasPrevPage && setPage(page - 1)}
                    disabled={!hasPrevPage}
                  >
                    <Icon
                      name="chevron-left"
                      size="md"
                      color={
                        hasPrevPage
                          ? theme.colors.primary
                          : theme.colors.textMuted
                      }
                    />
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.paginationText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Page {page} of {totalPages}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      !hasNextPage && styles.paginationButtonDisabled,
                    ]}
                    onPress={() => hasNextPage && setPage(page + 1)}
                    disabled={!hasNextPage}
                  >
                    <Icon
                      name="chevron-right"
                      size="md"
                      color={
                        hasNextPage
                          ? theme.colors.primary
                          : theme.colors.textMuted
                      }
                    />
                  </TouchableOpacity>
                </View>
              ) : null
            }
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
              filteredEmails.length === 0 && styles.listContentEmpty,
            ]}
          />
        )}

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <View
            style={[
              styles.bulkActions,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              },
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
                <Icon name="check" size="sm" color={theme.colors.text} />
                <Text
                  style={[styles.bulkButtonText, { color: theme.colors.text }]}
                >
                  Read
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => markAsStarred(Array.from(selectedIds), true)}
                style={styles.bulkButton}
              >
                <Icon name="star" size="sm" color={theme.colors.text} />
                <Text
                  style={[styles.bulkButtonText, { color: theme.colors.text }]}
                >
                  Star
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={clearSelection}
                style={styles.bulkButton}
              >
                <Icon name="x" size="sm" color={theme.colors.text} />
                <Text
                  style={[styles.bulkButtonText, { color: theme.colors.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Compose FAB */}
        <TouchableOpacity
          style={[
            sharedStyles.fab,
            {
              backgroundColor: theme.colors.primary,
              bottom: Math.max(insets.bottom, SPACING.md) + SPACING.md,
            },
          ]}
          onPress={onComposePress}
          activeOpacity={0.8}
        >
          <Icon name="edit-2" size="lg" color={theme.colors.textInverse} />
        </TouchableOpacity>

        {/* Inline Loading Indicator (for tab changes, not full-screen) */}
        {isLoading && filteredEmails.length > 0 && !isRefreshing && (
          <View
            style={[
              styles.inlineLoading,
              {
                backgroundColor: theme.colors.primary + '15',
                top: insets.top + 100,
              },
            ]}
          >
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text
              style={[
                styles.inlineLoadingText,
                { color: theme.colors.primary },
              ]}
            >
              Updating...
            </Text>
          </View>
        )}

        {/* Full Loading (only when no emails at all) */}
        {isLoading && filteredEmails.length === 0 && !isRefreshing && (
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: theme.colors.background + 'E6' },
            ]}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Loading emails...
            </Text>
          </View>
        )}

        {/* Account Picker Modal */}
        {renderAccountPicker()}

        {/* Filter Menu Modal - Full filters */}
        <Modal
          visible={showFilterMenu}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFilterMenu(false)}
        >
          <View
            style={[
              styles.fullModalContainer,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View
              style={[
                styles.fullModalHeader,
                {
                  backgroundColor: theme.colors.surface,
                  borderBottomColor: theme.colors.border,
                  paddingTop: insets.top,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setShowFilterMenu(false)}
                style={styles.headerButton}
              >
                <Icon name="x" size="md" color={theme.colors.text} />
              </TouchableOpacity>
              <Text
                style={[styles.fullModalTitle, { color: theme.colors.text }]}
              >
                Filters & Sorting
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setFilterMode('all');
                  setGroupMode('none');
                  setHasAttachments(false);
                }}
                style={styles.headerButton}
              >
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontSize: FONT_SIZE.sm,
                  }}
                >
                  Reset
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.fullModalContent}>
              {/* Quick Filters Section */}
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: theme.colors.textMuted },
                ]}
              >
                QUICK FILTERS
              </Text>
              <View
                style={[
                  styles.filterSection,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                {(['all', 'unread', 'starred'] as FilterMode[]).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.filterOption,
                      { borderBottomColor: theme.colors.border },
                      filterMode === mode && {
                        backgroundColor: theme.colors.primary + '10',
                      },
                    ]}
                    onPress={() => setFilterMode(mode)}
                  >
                    <Icon
                      name={
                        mode === 'all'
                          ? 'inbox'
                          : mode === 'unread'
                            ? 'mail'
                            : 'star'
                      }
                      size="md"
                      color={
                        filterMode === mode
                          ? theme.colors.primary
                          : theme.colors.text
                      }
                    />
                    <Text
                      style={[
                        styles.filterOptionText,
                        {
                          color:
                            filterMode === mode
                              ? theme.colors.primary
                              : theme.colors.text,
                        },
                      ]}
                    >
                      {mode === 'all'
                        ? 'All Emails'
                        : mode === 'unread'
                          ? 'Unread Only'
                          : 'Starred Only'}
                    </Text>
                    {filterMode === mode && (
                      <Icon
                        name="check"
                        size="md"
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Additional Filters */}
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: theme.colors.textMuted },
                ]}
              >
                ADDITIONAL FILTERS
              </Text>
              <View
                style={[
                  styles.filterSection,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    { borderBottomColor: theme.colors.border },
                    hasAttachments && {
                      backgroundColor: theme.colors.primary + '10',
                    },
                  ]}
                  onPress={() => setHasAttachments(!hasAttachments)}
                >
                  <Icon
                    name="paperclip"
                    size="md"
                    color={
                      hasAttachments ? theme.colors.primary : theme.colors.text
                    }
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      {
                        color: hasAttachments
                          ? theme.colors.primary
                          : theme.colors.text,
                      },
                    ]}
                  >
                    Has Attachments
                  </Text>
                  {hasAttachments && (
                    <Icon name="check" size="md" color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Group Section */}
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: theme.colors.textMuted },
                ]}
              >
                GROUP BY
              </Text>
              <View
                style={[
                  styles.filterSection,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                {(
                  [
                    { key: 'none', label: 'No Grouping' },
                    { key: 'date', label: 'Group by Date' },
                  ] as { key: GroupMode; label: string }[]
                ).map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      { borderBottomColor: theme.colors.border },
                      groupMode === option.key && {
                        backgroundColor: theme.colors.primary + '10',
                      },
                    ]}
                    onPress={() => {
                      setGroupMode(option.key);
                      setInboxGroupByDate(option.key === 'date');
                    }}
                  >
                    <Icon
                      name={option.key === 'none' ? 'inbox' : 'folder'}
                      size="md"
                      color={
                        groupMode === option.key
                          ? theme.colors.primary
                          : theme.colors.text
                      }
                    />
                    <Text
                      style={[
                        styles.filterOptionText,
                        {
                          color:
                            groupMode === option.key
                              ? theme.colors.primary
                              : theme.colors.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {groupMode === option.key && (
                      <Icon
                        name="check"
                        size="md"
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View
              style={[
                styles.fullModalFooter,
                {
                  backgroundColor: theme.colors.surface,
                  borderTopColor: theme.colors.border,
                  paddingBottom: insets.bottom,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {
                  // Apply backend filters
                  const isReadFilter = filterMode === 'unread' ? false : null;
                  const isStarredFilter =
                    filterMode === 'starred' ? true : null;
                  const hasAttachmentsFilter = hasAttachments ? true : null;
                  setFilters(
                    isReadFilter,
                    isStarredFilter,
                    hasAttachmentsFilter,
                  );
                  setShowFilterMenu(false);
                }}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* More Menu (Nuke, etc.) */}
        <Modal
          visible={showMoreMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMoreMenu(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowMoreMenu(false)}
          >
            <View
              style={[
                styles.moreMenuModal,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.moreMenuItem,
                  { borderBottomColor: theme.colors.border },
                ]}
                onPress={() => {
                  setShowMoreMenu(false);
                  onNukePress();
                }}
              >
                <Icon name="zap" size="md" color={theme.colors.error} />
                <View style={styles.moreMenuItemContent}>
                  <Text
                    style={[
                      styles.moreMenuItemTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    Inbox Nuke
                  </Text>
                  <Text
                    style={[
                      styles.moreMenuItemSubtitle,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Bulk delete old emails
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.moreMenuItem,
                  { borderBottomColor: theme.colors.border },
                ]}
                onPress={() => {
                  setShowMoreMenu(false);
                  handleRefresh();
                }}
              >
                <Icon name="refresh-cw" size="md" color={theme.colors.text} />
                <View style={styles.moreMenuItemContent}>
                  <Text
                    style={[
                      styles.moreMenuItemTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    Sync All Accounts
                  </Text>
                  <Text
                    style={[
                      styles.moreMenuItemSubtitle,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    Fetch new emails from all accounts
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  accountSwitcher: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerButton: {
    padding: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    paddingVertical: SPACING.sm,
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  filterBannerText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
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
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  sectionHeaderText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emailCardWrapper: {
    marginHorizontal: SPACING.md,
    overflow: 'hidden',
  },
  emailCardFirst: {
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    marginTop: SPACING.xs,
  },
  emailCardLast: {
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  emailCardMiddle: {
    borderRadius: 0,
  },
  emailDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SPACING.md,
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
  inlineLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  inlineLoadingText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: SPACING.lg,
  },
  paginationButton: {
    padding: SPACING.sm,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  filterMenuModal: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
  filterMenuTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.md,
  },
  filterOptionText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  // Full modal styles for filters
  fullModalContainer: {
    flex: 1,
  },
  fullModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fullModalTitle: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  fullModalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  fullModalFooter: {
    padding: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  filterSectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  filterSection: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  applyButton: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  // More menu styles
  moreMenuModal: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.md,
  },
  moreMenuItemContent: {
    flex: 1,
  },
  moreMenuItemTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  moreMenuItemSubtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
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
