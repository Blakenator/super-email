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

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_KEY = 'inboxPageSize';
const POLL_INTERVAL_MS = 60 * 1000; // 1 minute

const emptyFilters: EmailFilters = {
  fromContains: '',
  toContains: '',
  ccContains: '',
  bccContains: '',
  subjectContains: '',
  bodyContains: '',
};

export function useInboxEmails(folder: EmailFolder) {
  const [activeAccountTab, setActiveAccountTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [advancedFilters, setAdvancedFilters] = useState<EmailFilters>(emptyFilters);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem(PAGE_SIZE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_PAGE_SIZE;
  });

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
  const { data: accountsData } = useQuery(GET_EMAIL_ACCOUNTS_FOR_INBOX_QUERY);
  const accounts = accountsData?.getEmailAccounts ?? [];

  // Determine which account to filter by
  const emailAccountId =
    activeAccountTab === 'all' ? undefined : activeAccountTab;

  const offset = (currentPage - 1) * pageSize;

  // Check if any advanced filters are active
  const hasActiveFilters = Object.values(advancedFilters).some((v) => v.trim() !== '');

  const queryInput = useMemo(
    () => ({
      folder,
      emailAccountId,
      limit: pageSize,
      offset,
      searchQuery: searchQuery.trim() || undefined,
      fromContains: advancedFilters.fromContains.trim() || undefined,
      toContains: advancedFilters.toContains.trim() || undefined,
      ccContains: advancedFilters.ccContains.trim() || undefined,
      bccContains: advancedFilters.bccContains.trim() || undefined,
      subjectContains: advancedFilters.subjectContains.trim() || undefined,
      bodyContains: advancedFilters.bodyContains.trim() || undefined,
    }),
    [folder, emailAccountId, pageSize, offset, searchQuery, advancedFilters],
  );

  const countInput = useMemo(
    () => ({
      folder,
      emailAccountId,
      searchQuery: searchQuery.trim() || undefined,
      fromContains: advancedFilters.fromContains.trim() || undefined,
      toContains: advancedFilters.toContains.trim() || undefined,
      ccContains: advancedFilters.ccContains.trim() || undefined,
      bccContains: advancedFilters.bccContains.trim() || undefined,
      subjectContains: advancedFilters.subjectContains.trim() || undefined,
      bodyContains: advancedFilters.bodyContains.trim() || undefined,
    }),
    [folder, emailAccountId, searchQuery, advancedFilters],
  );

  const { data, loading, refetch } = useQuery(GET_EMAILS_QUERY, {
    variables: { input: queryInput },
    fetchPolicy: 'cache-and-network',
    // Poll every minute for inbox folder when not filtering
    pollInterval: folder === EmailFolder.Inbox && !hasActiveFilters && !searchQuery ? POLL_INTERVAL_MS : 0,
  });

  // Get total count for pagination
  const { data: countData } = useQuery(GET_EMAIL_COUNT_QUERY, {
    variables: { input: countInput },
    // Also poll the count
    pollInterval: folder === EmailFolder.Inbox && !hasActiveFilters && !searchQuery ? POLL_INTERVAL_MS : 0,
  });

  const totalCount = countData?.getEmailCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

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
    selectedIds,
    allSelected,
    someSelected,
    setCurrentPage,
    setActiveAccountTab,
    setPageSize: handlePageSizeChange,
    setSearchQuery,
    setAdvancedFilters,
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
