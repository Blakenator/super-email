import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import toast from 'react-hot-toast';
import {
  GET_EMAIL_ACCOUNTS_QUERY,
  CREATE_EMAIL_ACCOUNT_MUTATION,
  DELETE_EMAIL_ACCOUNT_MUTATION,
  SYNC_EMAIL_ACCOUNT_MUTATION,
  SYNC_ALL_ACCOUNTS_MUTATION,
  UPDATE_EMAIL_ACCOUNT_MUTATION,
  TEST_IMAP_CONNECTION_MUTATION,
} from '../queries';
import type { EmailAccountFormData } from '../components';
import { ImapAccountType } from '../../../__generated__/graphql';

export function useEmailAccounts() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pendingSmtpData, setPendingSmtpData] = useState<{
    name: string;
    email: string;
    providerId: string;
    password: string;
  } | null>(null);

  const {
    data,
    loading,
    refetch,
    startPolling,
    stopPolling,
  } = useQuery(GET_EMAIL_ACCOUNTS_QUERY, {
    notifyOnNetworkStatusChange: false,
  });

  const accounts = data?.getEmailAccounts ?? [];

  const isSyncing = accounts.some(
    (a) => a.imapSettings?.isHistoricalSyncing || a.imapSettings?.isUpdateSyncing,
  );

  useEffect(() => {
    if (isSyncing) {
      startPolling(10000);
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isSyncing, startPolling, stopPolling]);

  const [createAccount, { loading: creating }] = useMutation(
    CREATE_EMAIL_ACCOUNT_MUTATION,
  );

  const [deleteAccount, { loading: deleting }] = useMutation(
    DELETE_EMAIL_ACCOUNT_MUTATION,
    {
      onCompleted: () => {
        void refetch();
        setShowDeleteModal(false);
        setDeletingId(null);
        toast.success('Email account deleted');
      },
      onError: (err) => {
        setError(err.message);
        setShowDeleteModal(false);
        setDeletingId(null);
      },
    },
  );

  const [syncAccount] = useMutation(SYNC_EMAIL_ACCOUNT_MUTATION, {
    onCompleted: () => void refetch(),
    onError: (err) => setError(err.message),
  });

  const [syncAll, { loading: syncingAll }] = useMutation(
    SYNC_ALL_ACCOUNTS_MUTATION,
    {
      onCompleted: () => {
        void refetch();
        startPolling(2000);
      },
      onError: (err) => setError(err.message),
    },
  );

  const [updateAccount] = useMutation(UPDATE_EMAIL_ACCOUNT_MUTATION, {
    onCompleted: () => void refetch(),
    onError: (err) => setError(err.message),
  });

  const [testConnection, { loading: testing }] = useMutation(
    TEST_IMAP_CONNECTION_MUTATION,
  );

  const resetForm = () => {
    setEditingId(null);
    setTestResult(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (accountId: string) => {
    setEditingId(accountId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openDelete = (accountId: string) => {
    setDeletingId(accountId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingId(null);
  };

  const confirmDelete = () => {
    if (deletingId) {
      void deleteAccount({ variables: { id: deletingId } });
    }
  };

  const handleSync = (accountId: string) => {
    void syncAccount({ variables: { input: { emailAccountId: accountId } } });
  };

  const handleSyncAll = () => {
    void syncAll();
  };

  const handleTest = async (
    formData: EmailAccountFormData,
  ): Promise<{ success: boolean; message: string }> => {
    setError(null);
    setTestResult(null);
    try {
      const result = await testConnection({
        variables: {
          input: {
            host: formData.host,
            port: formData.port,
            username: formData.username,
            password: formData.password || null,
            accountType: formData.accountType as unknown as ImapAccountType,
            useSsl: formData.useSsl,
            accountId: editingId || null,
          },
        },
      });
      const testRes = result.data?.testImapConnection || {
        success: false,
        message: 'Unknown error',
      };
      setTestResult(testRes);
      return testRes;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const errorResult = { success: false, message };
      setTestResult(errorResult);
      return errorResult;
    }
  };

  const handleSubmit = async (formData: EmailAccountFormData) => {
    setError(null);
    try {
      if (editingId) {
        const result = await updateAccount({
          variables: {
            input: {
              id: editingId,
              name: formData.name,
              imapHost: formData.host || undefined,
              imapPort: formData.port || undefined,
              imapUsername: formData.username || undefined,
              imapPassword: formData.password || undefined,
              imapUseSsl: formData.useSsl,
              defaultSendProfileId: formData.defaultSendProfileId || undefined,
              providerId: formData.providerId || undefined,
              isDefault: formData.isDefault,
            },
          },
        });
        if (result.error) throw new Error(result.error.message);
        toast.success('Email account updated!');
      } else {
        const result = await createAccount({
          variables: {
            input: {
              name: formData.name,
              email: formData.email,
              type: formData.accountType,
              imapHost: formData.host,
              imapPort: formData.port,
              imapUsername: formData.username,
              imapPassword: formData.password,
              imapAccountType: formData.accountType as unknown as ImapAccountType,
              imapUseSsl: formData.useSsl,
              defaultSendProfileId: formData.defaultSendProfileId || undefined,
              providerId: formData.providerId || undefined,
              isDefault: formData.isDefault,
            },
          },
        });
        if (result.error) throw new Error(result.error.message);
        toast.success('Email account added!');

        if (formData.alsoCreateSmtpProfile) {
          setTimeout(() => {
            setPendingSmtpData({
              name: formData.name,
              email: formData.email,
              providerId: formData.providerId,
              password: formData.password,
            });
          }, 1000);
        }
      }
      closeModal();
      void refetch();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save email account';
      toast.error(message);
    }
  };

  const editingAccount = editingId
    ? accounts.find((a) => a.id === editingId) ?? null
    : null;

  const deletingAccount = deletingId
    ? accounts.find((a) => a.id === deletingId) ?? null
    : null;

  return {
    accounts,
    loading,
    error,
    setError,
    showModal,
    editingAccount,
    testResult,
    creating,
    testing,
    syncingAll,
    showDeleteModal,
    deletingAccount,
    deleting,
    pendingSmtpData,
    setPendingSmtpData,
    openCreate,
    openEdit,
    closeModal,
    openDelete,
    closeDeleteModal,
    confirmDelete,
    handleSync,
    handleSyncAll,
    handleTest,
    handleSubmit: (formData: EmailAccountFormData) =>
      void handleSubmit(formData),
    refetch,
  };
}
