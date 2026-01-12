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

const ITEMS_PER_PAGE = 25;

export function useInboxEmails(folder: EmailFolder) {
  const [activeAccountTab, setActiveAccountTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

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

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data, loading, refetch } = useQuery(GET_EMAILS_QUERY, {
    variables: {
      input: {
        folder,
        emailAccountId,
        limit: ITEMS_PER_PAGE,
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
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const [updateEmail] = useMutation(UPDATE_EMAIL_MUTATION, {
    refetchQueries: [
      {
        query: GET_EMAILS_QUERY,
        variables: {
          input: { folder, emailAccountId, limit: ITEMS_PER_PAGE, offset },
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
          input: { folder, emailAccountId, limit: ITEMS_PER_PAGE, offset },
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
    async (emailId: string) => {
      await updateEmail({
        variables: { input: { id: emailId, isRead: true } },
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
    activeAccountTab,
    showTabs,
    setCurrentPage,
    setActiveAccountTab,
    handleStarToggle,
    handleMarkRead,
    handleDelete,
    handleRefresh,
  };
}
