import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import toast from 'react-hot-toast';
import {
  GET_EMAILS_QUERY,
  UPDATE_EMAIL_MUTATION,
  DELETE_EMAIL_MUTATION,
  GET_EMAIL_ACCOUNTS_FOR_INBOX_QUERY,
  SYNC_ALL_ACCOUNTS_MUTATION,
  GET_EMAIL_COUNT_QUERY,
} from '../queries';
import { EmailFolder } from '../../../__generated__/graphql';

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_KEY = 'inboxPageSize';

export function useInboxEmails(folder: EmailFolder) {
  const [activeAccountTab, setActiveAccountTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem(PAGE_SIZE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_PAGE_SIZE;
  });

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
    localStorage.setItem(PAGE_SIZE_KEY, String(newSize));
  }, []);

  // Reset page when folder or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [folder, activeAccountTab]);

  // Load email accounts for tabs
  const { data: accountsData } = useQuery(GET_EMAIL_ACCOUNTS_FOR_INBOX_QUERY);
  const accounts = accountsData?.getEmailAccounts ?? [];

  // Determine which account to filter by
  const emailAccountId =
    activeAccountTab === 'all' ? undefined : activeAccountTab;

  const offset = (currentPage - 1) * pageSize;

  const { data, loading, refetch } = useQuery(GET_EMAILS_QUERY, {
    variables: {
      input: {
        folder,
        emailAccountId,
        limit: pageSize,
        offset,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  // Get total count for pagination
  const { data: countData } = useQuery(GET_EMAIL_COUNT_QUERY, {
    variables: { input: { folder, emailAccountId } },
  });

  const totalCount = countData?.getEmailCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const [updateEmail] = useMutation(UPDATE_EMAIL_MUTATION, {
    refetchQueries: [
      {
        query: GET_EMAILS_QUERY,
        variables: {
          input: { folder, emailAccountId, limit: pageSize, offset },
        },
      },
      {
        query: GET_EMAIL_COUNT_QUERY,
        variables: { input: { folder: EmailFolder.Inbox, isRead: false } },
      },
    ],
  });

  const [deleteEmail] = useMutation(DELETE_EMAIL_MUTATION, {
    onCompleted: () => {
      toast.success(
        folder === EmailFolder.Trash
          ? 'Email permanently deleted'
          : 'Email moved to trash',
      );
    },
    refetchQueries: [
      {
        query: GET_EMAILS_QUERY,
        variables: {
          input: { folder, emailAccountId, limit: pageSize, offset },
        },
      },
      {
        query: GET_EMAIL_COUNT_QUERY,
        variables: { input: { folder } },
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
      await updateEmail({
        variables: { input: { id: emailId, isStarred: !currentlyStarred } },
      });
    },
    [updateEmail],
  );

  const handleMarkRead = useCallback(
    async (emailId: string, isRead: boolean) => {
      await updateEmail({
        variables: { input: { id: emailId, isRead } },
      });
    },
    [updateEmail],
  );

  const handleDelete = useCallback(
    async (emailId: string) => {
      await deleteEmail({ variables: { id: emailId } });
    },
    [deleteEmail],
  );

  const handleRefresh = useCallback(async () => {
    if (folder === EmailFolder.Inbox) {
      await syncAllAccounts();
    } else {
      await refetch();
    }
  }, [folder, syncAllAccounts, refetch]);

  const emails = data?.getEmails ?? [];
  const showTabs = folder === EmailFolder.Inbox && accounts.length > 1;

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
    setCurrentPage,
    setActiveAccountTab,
    setPageSize: handlePageSizeChange,
    handleStarToggle,
    handleMarkRead,
    handleDelete,
    handleRefresh,
  };
}
