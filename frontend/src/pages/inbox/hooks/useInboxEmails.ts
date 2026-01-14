import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import toast from 'react-hot-toast';
import {
  GET_EMAILS_QUERY,
  GET_EMAIL_ACCOUNTS_FOR_INBOX_QUERY,
  SYNC_ALL_ACCOUNTS_MUTATION,
  GET_EMAIL_COUNT_QUERY,
  BULK_UPDATE_EMAILS_MUTATION,
  BULK_DELETE_EMAILS_MUTATION,
} from '../queries';
import { EmailFolder } from '../../../__generated__/graphql';
import type { EmailFilters } from '../components';
import { useEmailStore } from '../../../stores/emailStore';

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_KEY = 'inboxPageSize';
const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (subscriptions handle real-time updates)

export const emptyFilters: EmailFilters = {
  fromContains: '',
  toContains: '',
  ccContains: '',
  bccContains: '',
  subjectContains: '',
  bodyContains: '',
  tagIds: [],
};

export interface UseInboxEmailsOptions {
  folder: EmailFolder;
  accountId?: string; // From URL params
  searchQuery?: string; // From URL params
  filters?: EmailFilters; // From URL params
}

export function useInboxEmails({
  folder,
  accountId,
  searchQuery: externalSearchQuery,
  filters: externalFilters,
}: UseInboxEmailsOptions) {
  // Use external values if provided, otherwise use internal state
  const [internalAccountTab, setInternalAccountTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [internalFilters, setInternalFilters] = useState<EmailFilters>(emptyFilters);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem(PAGE_SIZE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_PAGE_SIZE;
  });

  // Determine active values (external takes precedence)
  const activeAccountTab = accountId || internalAccountTab;
  const searchQuery = externalSearchQuery ?? internalSearchQuery;
  const advancedFilters = externalFilters ?? internalFilters;

  // Track previous email count for notifications
  const prevEmailCountRef = useRef<number | null>(null);
  const isDocumentVisibleRef = useRef(true);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    localStorage.setItem(PAGE_SIZE_KEY, String(newSize));
  }, []);

  // Reset page and selection when folder, tab, search, or filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [folder, activeAccountTab, searchQuery, advancedFilters]);

  // Load email accounts for tabs
  const { data: accountsData } = useQuery(GET_EMAIL_ACCOUNTS_FOR_INBOX_QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  const accounts = accountsData?.getEmailAccounts ?? [];

  // Determine which account to filter by
  const emailAccountId =
    activeAccountTab === 'all' ? undefined : activeAccountTab;

  const offset = (currentPage - 1) * pageSize;

  // Check if any advanced filters are active
  const hasActiveFilters = Object.entries(advancedFilters).some(([key, v]) => {
    if (key === 'tagIds') return (v as string[] || []).length > 0;
    return typeof v === 'string' && v.trim() !== '';
  });

  const queryInput = useMemo(
    () => ({
      folder,
      emailAccountId,
      limit: pageSize,
      offset,
      searchQuery: searchQuery.trim() || undefined,
      includeAllFolders: searchQuery.trim() ? true : undefined, // Include all folders when searching
      fromContains: (advancedFilters.fromContains || '').trim() || undefined,
      toContains: (advancedFilters.toContains || '').trim() || undefined,
      ccContains: (advancedFilters.ccContains || '').trim() || undefined,
      bccContains: (advancedFilters.bccContains || '').trim() || undefined,
      subjectContains: (advancedFilters.subjectContains || '').trim() || undefined,
      bodyContains: (advancedFilters.bodyContains || '').trim() || undefined,
      tagIds: (advancedFilters.tagIds || []).length > 0 ? advancedFilters.tagIds : undefined,
    }),
    [folder, emailAccountId, pageSize, offset, searchQuery, advancedFilters],
  );

  const countInput = useMemo(
    () => ({
      folder,
      emailAccountId,
      searchQuery: searchQuery.trim() || undefined,
      includeAllFolders: searchQuery.trim() ? true : undefined, // Include all folders when searching
      fromContains: (advancedFilters.fromContains || '').trim() || undefined,
      toContains: (advancedFilters.toContains || '').trim() || undefined,
      ccContains: (advancedFilters.ccContains || '').trim() || undefined,
      bccContains: (advancedFilters.bccContains || '').trim() || undefined,
      subjectContains: (advancedFilters.subjectContains || '').trim() || undefined,
      bodyContains: (advancedFilters.bodyContains || '').trim() || undefined,
      tagIds: (advancedFilters.tagIds || []).length > 0 ? advancedFilters.tagIds : undefined,
    }),
    [folder, emailAccountId, searchQuery, advancedFilters],
  );

  const { data, loading, refetch } = useQuery(GET_EMAILS_QUERY, {
    variables: { input: queryInput },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first', // After first fetch, use cache with network updates
    notifyOnNetworkStatusChange: true, // Ensure loading state updates on refetch
    // Poll every 10 minutes for inbox folder when not filtering
    pollInterval: folder === EmailFolder.Inbox && !hasActiveFilters && !searchQuery ? POLL_INTERVAL_MS : 0,
  });

  // Get total count for pagination
  const { data: countData } = useQuery(GET_EMAIL_COUNT_QUERY, {
    variables: { input: countInput },
    fetchPolicy: 'cache-and-network',
    // Also poll the count
    pollInterval: folder === EmailFolder.Inbox && !hasActiveFilters && !searchQuery ? POLL_INTERVAL_MS : 0,
  });

  const totalCount = countData?.getEmailCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Subscribe to real-time email updates from the store
  const lastUpdate = useEmailStore((state) => state.lastUpdate);
  const lastRefetchRef = useRef<string | null>(null);

  useEffect(() => {
    // When we receive a new email via subscription, refetch the list
    if (lastUpdate && lastUpdate !== lastRefetchRef.current) {
      lastRefetchRef.current = lastUpdate;
      // Only refetch if we're on page 1 or viewing inbox
      // (new emails typically appear at the top)
      if (folder === EmailFolder.Inbox || currentPage === 1) {
        refetch();
      }
    }
  }, [lastUpdate, folder, currentPage, refetch]);

  // Track document visibility for notifications
  useEffect(() => {
    const handleVisibilityChange = () => {
      isDocumentVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        // Reset the count when user comes back
        prevEmailCountRef.current = totalCount;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [totalCount]);

  // Notify on new emails
  useEffect(() => {
    if (folder !== EmailFolder.Inbox) return;
    if (prevEmailCountRef.current === null) {
      // Initial load
      prevEmailCountRef.current = totalCount;
      return;
    }

    const newEmailCount = totalCount - prevEmailCountRef.current;
    if (newEmailCount > 0 && !isDocumentVisibleRef.current) {
      // Show browser notification
      showNewEmailNotification(newEmailCount);
    }
    prevEmailCountRef.current = totalCount;
  }, [totalCount, folder]);

  const [bulkUpdateEmails] = useMutation(BULK_UPDATE_EMAILS_MUTATION, {
    refetchQueries: [
      { query: GET_EMAILS_QUERY, variables: { input: queryInput } },
      {
        query: GET_EMAIL_COUNT_QUERY,
        variables: { input: { folder: EmailFolder.Inbox, isRead: false } },
      },
    ],
  });

  const [bulkDeleteEmails] = useMutation(BULK_DELETE_EMAILS_MUTATION, {
    onCompleted: () => {
      toast.success(
        folder === EmailFolder.Trash
          ? 'Email(s) permanently deleted'
          : 'Email(s) moved to trash',
      );
    },
    refetchQueries: [
      { query: GET_EMAILS_QUERY, variables: { input: queryInput } },
      { query: GET_EMAIL_COUNT_QUERY, variables: { input: countInput } },
      {
        query: GET_EMAIL_COUNT_QUERY,
        variables: { input: { folder: EmailFolder.Trash } },
      },
    ],
  });

  const [syncAllAccounts, { loading: syncing }] = useMutation(
    SYNC_ALL_ACCOUNTS_MUTATION,
    {
      fetchPolicy: 'no-cache', // Always make a network request
      onCompleted: () => {
        toast.success('Sync started');
        refetch();
      },
    },
  );

  const handleStarToggle = useCallback(
    async (emailId: string, currentlyStarred: boolean) => {
      await bulkUpdateEmails({
        variables: { input: { ids: [emailId], isStarred: !currentlyStarred } },
      });
    },
    [bulkUpdateEmails],
  );

  const handleMarkRead = useCallback(
    async (emailId: string, isRead: boolean) => {
      await bulkUpdateEmails({
        variables: { input: { ids: [emailId], isRead } },
      });
    },
    [bulkUpdateEmails],
  );

  const handleDelete = useCallback(
    async (emailId: string) => {
      await bulkDeleteEmails({ variables: { ids: [emailId] } });
    },
    [bulkDeleteEmails],
  );

  const handleRefresh = useCallback(async () => {
    if (folder === EmailFolder.Inbox) {
      await syncAllAccounts();
    } else {
      await refetch();
    }
  }, [folder, syncAllAccounts, refetch]);

  // Bulk action handlers
  const handleBulkMarkRead = useCallback(
    async (isRead: boolean) => {
      if (selectedIds.size === 0) return;
      await bulkUpdateEmails({
        variables: { input: { ids: Array.from(selectedIds), isRead } },
      });
      toast.success(`Marked ${selectedIds.size} email(s) as ${isRead ? 'read' : 'unread'}`);
      setSelectedIds(new Set());
    },
    [selectedIds, bulkUpdateEmails],
  );

  const handleBulkStar = useCallback(
    async (isStarred: boolean) => {
      if (selectedIds.size === 0) return;
      await bulkUpdateEmails({
        variables: { input: { ids: Array.from(selectedIds), isStarred } },
      });
      toast.success(`${isStarred ? 'Starred' : 'Unstarred'} ${selectedIds.size} email(s)`);
      setSelectedIds(new Set());
    },
    [selectedIds, bulkUpdateEmails],
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await bulkDeleteEmails({
      variables: { ids: Array.from(selectedIds) },
    });
    setSelectedIds(new Set());
  }, [selectedIds, bulkDeleteEmails]);

  const handleBulkArchive = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await bulkUpdateEmails({
      variables: {
        input: { ids: Array.from(selectedIds), folder: EmailFolder.Archive },
      },
    });
    toast.success(`Archived ${selectedIds.size} email(s)`);
    setSelectedIds(new Set());
  }, [selectedIds, bulkUpdateEmails]);

  const handleArchive = useCallback(
    async (emailId: string) => {
      await bulkUpdateEmails({
        variables: {
          input: { ids: [emailId], folder: EmailFolder.Archive },
        },
      });
      toast.success('Email archived');
    },
    [bulkUpdateEmails],
  );

  const handleUnarchive = useCallback(
    async (emailId: string) => {
      await bulkUpdateEmails({
        variables: {
          input: { ids: [emailId], folder: EmailFolder.Inbox },
        },
      });
      toast.success('Email moved to inbox');
    },
    [bulkUpdateEmails],
  );

  const handleBulkUnarchive = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await bulkUpdateEmails({
      variables: {
        input: { ids: Array.from(selectedIds), folder: EmailFolder.Inbox },
      },
    });
    toast.success(`Moved ${selectedIds.size} email(s) to inbox`);
    setSelectedIds(new Set());
  }, [selectedIds, bulkUpdateEmails]);

  // Selection handlers
  const handleSelectEmail = useCallback((emailId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(emailId);
      } else {
        next.delete(emailId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const emails = data?.getEmails ?? [];
    if (selectedIds.size === emails.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all on current page
      setSelectedIds(new Set(emails.map((e) => e.id)));
    }
  }, [data?.getEmails, selectedIds.size]);

  // Account tab change handler
  const handleAccountTabChange = useCallback((tab: string) => {
    setInternalAccountTab(tab);
    setInternalSearchQuery('');
    setInternalFilters(emptyFilters);
  }, []);

  const emails = data?.getEmails ?? [];
  const showTabs = folder === EmailFolder.Inbox && accounts.length > 1;
  const allSelected = emails.length > 0 && selectedIds.size === emails.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < emails.length;

  return {
    emails,
    accounts,
    loading,
    syncing,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    activeAccountTab,
    showTabs,
    searchQuery,
    advancedFilters,
    hasActiveFilters: hasActiveFilters || searchQuery.trim() !== '',
    selectedIds,
    allSelected,
    someSelected,
    setCurrentPage,
    setActiveAccountTab: handleAccountTabChange,
    setPageSize: handlePageSizeChange,
    setSearchQuery: setInternalSearchQuery,
    setAdvancedFilters: setInternalFilters,
    handleStarToggle,
    handleMarkRead,
    handleDelete,
    handleRefresh,
    handleSelectEmail,
    handleSelectAll,
    handleBulkMarkRead,
    handleBulkStar,
    handleBulkDelete,
    handleBulkArchive,
    handleArchive,
    handleUnarchive,
    handleBulkUnarchive,
    refetch,
  };
}

/**
 * Show a browser notification for new emails
 */
function showNewEmailNotification(count: number) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification('New Email', {
      body: count === 1 ? 'You have 1 new email' : `You have ${count} new emails`,
      icon: '/icon-192x192.png',
      tag: 'new-email',
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification('New Email', {
          body: count === 1 ? 'You have 1 new email' : `You have ${count} new emails`,
          icon: '/icon-192x192.svg',
          tag: 'new-email',
        });
      }
    });
  }
}
