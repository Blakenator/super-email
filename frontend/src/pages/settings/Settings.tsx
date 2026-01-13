import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Container,
  Card,
  Button,
  Modal,
  Alert,
  Spinner,
  Badge,
  Tabs,
  Tab,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import {
  GET_EMAIL_ACCOUNTS_QUERY,
  CREATE_EMAIL_ACCOUNT_MUTATION,
  DELETE_EMAIL_ACCOUNT_MUTATION,
  SYNC_EMAIL_ACCOUNT_MUTATION,
  SYNC_ALL_ACCOUNTS_MUTATION,
  GET_SMTP_PROFILES_FULL_QUERY,
  CREATE_SMTP_PROFILE_MUTATION,
  DELETE_SMTP_PROFILE_MUTATION,
  TEST_EMAIL_ACCOUNT_CONNECTION_MUTATION,
  TEST_SMTP_CONNECTION_MUTATION,
  UPDATE_EMAIL_ACCOUNT_MUTATION,
  UPDATE_SMTP_PROFILE_MUTATION,
  GET_AUTHENTICATION_METHODS_QUERY,
  DELETE_AUTHENTICATION_METHOD_MUTATION,
} from './queries';
import { EmailAccountType } from '../../__generated__/graphql';
import { useAuth } from '../../contexts/AuthContext';
import {
  EmailAccountForm,
  type EmailAccountFormData,
  SmtpProfileForm,
  type SmtpProfileFormData,
  EmailAccountCard,
  SmtpProfileCard,
} from './components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faInbox,
  faPaperPlane,
  faSignOutAlt,
  faPlus,
  faSync,
  faTrash,
  faCheckCircle,
  faTimesCircle,
  faCircle,
  faKey,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import {
  faGoogle,
  faGithub,
  faApple,
  faMicrosoft,
} from '@fortawesome/free-brands-svg-icons';

const PageWrapper = styled.div`
  padding: 1.5rem;
  height: 100%;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const SectionCard = styled(Card)`
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  margin-bottom: 1.5rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f6f8fc;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const Avatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ProgressStepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
`;

const ProgressStep = styled.div<{
  $status: 'pending' | 'active' | 'success' | 'error';
}>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: ${(props) => {
    switch (props.$status) {
      case 'active':
        return '#e3f2fd';
      case 'success':
        return '#e8f5e9';
      case 'error':
        return '#ffebee';
      default:
        return '#f5f5f5';
    }
  }};
  transition: all 0.3s ease;
`;

const StepIcon = styled.div<{
  $status: 'pending' | 'active' | 'success' | 'error';
}>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: ${(props) => {
    switch (props.$status) {
      case 'active':
        return '#1976d2';
      case 'success':
        return '#2e7d32';
      case 'error':
        return '#c62828';
      default:
        return '#9e9e9e';
    }
  }};
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
`;

const StepSubtitle = styled.div`
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
`;

// Card grids for accounts and profiles
const AccountCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const SmtpCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

// Authentication Method styles
const AuthMethodCard = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: 0.75rem;
  background: white;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const AuthMethodIcon = styled.div<{ $provider: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;
  background: ${({ $provider }) => {
    switch ($provider) {
      case 'GOOGLE':
        return '#fff';
      case 'GITHUB':
        return '#24292e';
      case 'APPLE':
        return '#000';
      case 'MICROSOFT':
        return '#00a4ef';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
  color: ${({ $provider }) => {
    switch ($provider) {
      case 'GOOGLE':
        return '#4285f4';
      case 'GITHUB':
        return '#fff';
      case 'APPLE':
        return '#fff';
      case 'MICROSOFT':
        return '#fff';
      default:
        return '#fff';
    }
  }};
  border: ${({ $provider }) => ($provider === 'GOOGLE' ? '1px solid #e0e0e0' : 'none')};
`;

const AuthMethodInfo = styled.div`
  flex: 1;
`;

const AuthMethodName = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const AuthMethodEmail = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AuthMethodMeta = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 0.25rem;
`;

type SaveStep = {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'success' | 'error';
  message?: string;
};

export function Settings() {
  const { user, logout } = useAuth();
  const [showEmailAccountModal, setShowEmailAccountModal] = useState(false);
  const [showSmtpProfileModal, setShowSmtpProfileModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [connectionTested, setConnectionTested] = useState(false);

  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressType, setProgressType] = useState<'email' | 'smtp'>('email');
  const [saveSteps, setSaveSteps] = useState<SaveStep[]>([]);

  // Edit mode state
  const [editingEmailAccountId, setEditingEmailAccountId] = useState<
    string | null
  >(null);
  const [editingSmtpProfileId, setEditingSmtpProfileId] = useState<
    string | null
  >(null);

  // Email Account form state
  const [emailAccountForm, setEmailAccountForm] = useState({
    name: '',
    email: '',
    host: '',
    port: 993,
    username: '',
    password: '',
    accountType: EmailAccountType.Imap,
    useSsl: true,
    defaultSmtpProfileId: '' as string | null,
  });

  // SMTP Profile form state
  const [smtpProfileForm, setSmtpProfileForm] = useState({
    name: '',
    email: '',
    alias: '' as string | null,
    host: '',
    port: 587,
    username: '',
    password: '',
    useSsl: true,
    isDefault: false,
  });

  const {
    data: emailAccountsData,
    loading: emailAccountsLoading,
    refetch: refetchEmailAccounts,
    startPolling,
    stopPolling,
  } = useQuery(GET_EMAIL_ACCOUNTS_QUERY, {
    // Keep previous data while refetching to prevent flickering
    notifyOnNetworkStatusChange: false,
  });

  // Poll when any account is syncing
  const isSyncing = emailAccountsData?.getEmailAccounts?.some(
    (a) => a.isSyncing,
  );

  // Use useEffect for polling to avoid initialization error
  useEffect(() => {
    if (isSyncing) {
      startPolling(2000);
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isSyncing, startPolling, stopPolling]);

  const {
    data: smtpProfilesData,
    loading: smtpProfilesLoading,
    refetch: refetchSmtpProfiles,
  } = useQuery(GET_SMTP_PROFILES_FULL_QUERY);

  const {
    data: authMethodsData,
    loading: authMethodsLoading,
    refetch: refetchAuthMethods,
  } = useQuery(GET_AUTHENTICATION_METHODS_QUERY);

  const [deleteAuthMethod, { loading: deletingAuthMethod }] = useMutation(
    DELETE_AUTHENTICATION_METHOD_MUTATION,
    {
      onCompleted: () => {
        refetchAuthMethods();
        toast.success('Authentication method removed');
      },
      onError: (err) => toast.error(err.message),
    },
  );

  const authMethods = authMethodsData?.getAuthenticationMethods ?? [];

  const [createEmailAccount, { loading: creatingEmailAccount }] = useMutation(
    CREATE_EMAIL_ACCOUNT_MUTATION,
    {
      onCompleted: () => {
        setShowEmailAccountModal(false);
        refetchEmailAccounts();
        resetEmailAccountForm();
      },
      onError: (err) => setError(err.message),
    },
  );

  const [deleteEmailAccount] = useMutation(DELETE_EMAIL_ACCOUNT_MUTATION, {
    onCompleted: () => refetchEmailAccounts(),
    onError: (err) => setError(err.message),
  });

  const [syncEmailAccount, { loading: syncingAccount }] = useMutation(
    SYNC_EMAIL_ACCOUNT_MUTATION,
    {
      onCompleted: () => refetchEmailAccounts(),
      onError: (err) => setError(err.message),
    },
  );

  const [syncAllAccounts, { loading: syncingAll }] = useMutation(
    SYNC_ALL_ACCOUNTS_MUTATION,
    {
      onCompleted: async () => {
        // Refetch to get updated isSyncing state and trigger polling
        await refetchEmailAccounts();
        // Start polling immediately since accounts are now syncing
        startPolling(2000);
      },
      onError: (err) => setError(err.message),
    },
  );

  const [createSmtpProfile, { loading: creatingSmtpProfile }] = useMutation(
    CREATE_SMTP_PROFILE_MUTATION,
    {
      onCompleted: () => {
        setShowSmtpProfileModal(false);
        refetchSmtpProfiles();
        resetSmtpProfileForm();
      },
      onError: (err) => setError(err.message),
    },
  );

  const [deleteSmtpProfile] = useMutation(DELETE_SMTP_PROFILE_MUTATION, {
    onCompleted: () => refetchSmtpProfiles(),
    onError: (err) => setError(err.message),
  });

  const [testEmailAccountConnection, { loading: testingEmailAccount }] =
    useMutation(TEST_EMAIL_ACCOUNT_CONNECTION_MUTATION);

  const [testSmtpConnection, { loading: testingSmtp }] = useMutation(
    TEST_SMTP_CONNECTION_MUTATION,
  );

  const [updateEmailAccount] = useMutation(UPDATE_EMAIL_ACCOUNT_MUTATION, {
    onCompleted: () => refetchEmailAccounts(),
    onError: (err) => setError(err.message),
  });

  const [updateSmtpProfile] = useMutation(UPDATE_SMTP_PROFILE_MUTATION, {
    onCompleted: () => refetchSmtpProfiles(),
    onError: (err) => setError(err.message),
  });

  const resetEmailAccountForm = () => {
    setEmailAccountForm({
      name: '',
      email: '',
      host: '',
      port: 993,
      username: '',
      password: '',
      accountType: EmailAccountType.Imap,
      useSsl: true,
      defaultSmtpProfileId: null,
    });
    setEditingEmailAccountId(null);
    setTestResult(null);
    setConnectionTested(false);
  };

  const resetSmtpProfileForm = () => {
    setSmtpProfileForm({
      name: '',
      email: '',
      alias: null,
      host: '',
      port: 587,
      username: '',
      password: '',
      useSsl: true,
      isDefault: false,
    });
    setEditingSmtpProfileId(null);
    setTestResult(null);
    setConnectionTested(false);
  };

  const handleEditEmailAccount = (accountId: string) => {
    const account = emailAccounts.find((a) => a.id === accountId);
    if (account) {
      setEmailAccountForm({
        name: account.name,
        email: account.email,
        host: account.host,
        port: account.port,
        username: '', // Don't populate - user must re-enter for security
        password: '', // Don't populate - user must re-enter for security
        accountType: account.accountType as EmailAccountType,
        useSsl: account.useSsl,
        defaultSmtpProfileId: account.defaultSmtpProfileId || null,
      });
      setEditingEmailAccountId(accountId);
      setShowEmailAccountModal(true);
    }
  };

  const handleEditSmtpProfile = (profileId: string) => {
    const profile = smtpProfiles.find((p) => p.id === profileId);
    if (profile) {
      setSmtpProfileForm({
        name: profile.name,
        email: profile.email,
        alias: profile.alias || null,
        host: profile.host,
        port: profile.port,
        username: '', // Don't populate - user must re-enter for security
        password: '', // Don't populate - user must re-enter for security
        useSsl: profile.useSsl,
        isDefault: profile.isDefault,
      });
      setEditingSmtpProfileId(profileId);
      setShowSmtpProfileModal(true);
    }
  };

  const handleTestEmailAccountConnection = async () => {
    setError(null);
    setTestResult(null);
    try {
      const result = await testEmailAccountConnection({
        variables: {
          input: {
            host: emailAccountForm.host,
            port: emailAccountForm.port,
            username: emailAccountForm.username,
            password: emailAccountForm.password,
            accountType: emailAccountForm.accountType,
            useSsl: emailAccountForm.useSsl,
          },
        },
      });
      const testRes = result.data?.testEmailAccountConnection;
      if (testRes) {
        setTestResult(testRes);
        setConnectionTested(testRes.success);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    }
  };

  const handleTestSmtpConnection = async () => {
    setError(null);
    setTestResult(null);
    try {
      const result = await testSmtpConnection({
        variables: {
          input: {
            host: smtpProfileForm.host,
            port: smtpProfileForm.port,
            username: smtpProfileForm.username,
            password: smtpProfileForm.password,
            useSsl: smtpProfileForm.useSsl,
          },
        },
      });
      const testRes = result.data?.testSmtpConnection;
      if (testRes) {
        setTestResult(testRes);
        setConnectionTested(testRes.success);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    }
  };

  // Handler for the new EmailAccountForm component
  const handleEmailAccountFormTest = async (
    formData: EmailAccountFormData,
  ): Promise<{ success: boolean; message: string }> => {
    setError(null);
    setTestResult(null);
    try {
      const result = await testEmailAccountConnection({
        variables: {
          input: {
            host: formData.host,
            port: formData.port,
            username: formData.username,
            password: formData.password,
            accountType: formData.accountType,
            useSsl: formData.useSsl,
          },
        },
      });
      const testRes = result.data?.testEmailAccountConnection || {
        success: false,
        message: 'Unknown error',
      };
      setTestResult(testRes);
      return testRes;
    } catch (err: any) {
      const errorResult = { success: false, message: err.message };
      setTestResult(errorResult);
      return errorResult;
    }
  };

  const handleEmailAccountFormSubmit = async (
    formData: EmailAccountFormData,
  ) => {
    setError(null);

    if (editingEmailAccountId) {
      // Update existing account
      await updateEmailAccount({
        variables: {
          input: {
            id: editingEmailAccountId,
            name: formData.name,
            host: formData.host,
            port: formData.port,
            username: formData.username || undefined,
            password: formData.password || undefined,
            useSsl: formData.useSsl,
            defaultSmtpProfileId: formData.defaultSmtpProfileId || undefined,
            providerId: formData.providerId || undefined,
          },
        },
      });
      toast.success('Email account updated!');
    } else {
      // Create new account
      await createEmailAccount({
        variables: {
          input: {
            name: formData.name,
            email: formData.email,
            host: formData.host,
            port: formData.port,
            username: formData.username,
            password: formData.password,
            accountType: formData.accountType,
            useSsl: formData.useSsl,
            defaultSmtpProfileId: formData.defaultSmtpProfileId || undefined,
            providerId: formData.providerId || undefined,
          },
        },
      });
      toast.success('Email account added!');
    }
    setShowEmailAccountModal(false);
    resetEmailAccountForm();
    refetchEmailAccounts();
  };

  // Handler for the new SmtpProfileForm component
  const handleSmtpProfileFormTest = async (
    formData: SmtpProfileFormData,
  ): Promise<{ success: boolean; message: string }> => {
    setError(null);
    setTestResult(null);
    try {
      const result = await testSmtpConnection({
        variables: {
          input: {
            host: formData.host,
            port: formData.port,
            username: formData.username,
            password: formData.password,
            useSsl: formData.useSsl,
          },
        },
      });
      const testRes = result.data?.testSmtpConnection || {
        success: false,
        message: 'Unknown error',
      };
      setTestResult(testRes);
      return testRes;
    } catch (err: any) {
      const errorResult = { success: false, message: err.message };
      setTestResult(errorResult);
      return errorResult;
    }
  };

  const handleSmtpProfileFormSubmit = async (formData: SmtpProfileFormData) => {
    setError(null);

    if (editingSmtpProfileId) {
      // Update existing profile
      await updateSmtpProfile({
        variables: {
          input: {
            id: editingSmtpProfileId,
            name: formData.name,
            alias: formData.alias || undefined,
            host: formData.host,
            port: formData.port,
            username: formData.username || undefined,
            password: formData.password || undefined,
            useSsl: formData.useSsl,
            isDefault: formData.isDefault,
            providerId: formData.providerId || undefined,
          },
        },
      });
      toast.success('SMTP profile updated!');
    } else {
      // Create new profile
      await createSmtpProfile({
        variables: {
          input: {
            name: formData.name,
            email: formData.email,
            alias: formData.alias || undefined,
            host: formData.host,
            port: formData.port,
            username: formData.username,
            password: formData.password,
            useSsl: formData.useSsl,
            isDefault: formData.isDefault,
            providerId: formData.providerId || undefined,
          },
        },
      });
      toast.success('SMTP profile added!');
    }
    setShowSmtpProfileModal(false);
    resetSmtpProfileForm();
    refetchSmtpProfiles();
  };

  const handleSaveEmailAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowEmailAccountModal(false);
    setProgressType('email');

    const isEditing = !!editingEmailAccountId;
    const needsConnectionTest =
      emailAccountForm.username && emailAccountForm.password;

    const steps: SaveStep[] = needsConnectionTest
      ? [
          { id: 'test', title: 'Testing connection', status: 'pending' },
          {
            id: 'save',
            title: isEditing ? 'Updating account' : 'Saving account',
            status: 'pending',
          },
        ]
      : [
          {
            id: 'save',
            title: isEditing ? 'Updating account' : 'Saving account',
            status: 'pending',
          },
        ];
    setSaveSteps(steps);
    setShowProgressModal(true);

    try {
      // Step 1: Test connection (only if credentials provided)
      if (needsConnectionTest) {
        setSaveSteps((prev) =>
          prev.map((s) => (s.id === 'test' ? { ...s, status: 'active' } : s)),
        );

        const testResult = await testEmailAccountConnection({
          variables: {
            input: {
              host: emailAccountForm.host,
              port: emailAccountForm.port,
              username: emailAccountForm.username,
              password: emailAccountForm.password,
              accountType: emailAccountForm.accountType,
              useSsl: emailAccountForm.useSsl,
            },
          },
        });

        const testRes = testResult.data?.testEmailAccountConnection;
        if (!testRes?.success) {
          setSaveSteps((prev) =>
            prev.map((s) =>
              s.id === 'test'
                ? {
                    ...s,
                    status: 'error',
                    message: testRes?.message || 'Connection failed',
                  }
                : s,
            ),
          );
          return;
        }

        setSaveSteps((prev) =>
          prev.map((s) =>
            s.id === 'test'
              ? { ...s, status: 'success', message: 'Connection successful' }
              : s,
          ),
        );
      }

      // Step 2: Save/Update account
      setSaveSteps((prev) =>
        prev.map((s) => (s.id === 'save' ? { ...s, status: 'active' } : s)),
      );

      if (isEditing) {
        await updateEmailAccount({
          variables: {
            input: {
              id: editingEmailAccountId,
              name: emailAccountForm.name,
              host: emailAccountForm.host,
              port: emailAccountForm.port,
              useSsl: emailAccountForm.useSsl,
              defaultSmtpProfileId: emailAccountForm.defaultSmtpProfileId,
              ...(emailAccountForm.username && {
                username: emailAccountForm.username,
              }),
              ...(emailAccountForm.password && {
                password: emailAccountForm.password,
              }),
            },
          },
        });
      } else {
        await createEmailAccount({
          variables: {
            input: {
              ...emailAccountForm,
              defaultSmtpProfileId:
                emailAccountForm.defaultSmtpProfileId || undefined,
            },
          },
        });
      }

      setSaveSteps((prev) =>
        prev.map((s) =>
          s.id === 'save'
            ? { ...s, status: 'success', message: 'Account saved successfully' }
            : s,
        ),
      );

      // Auto-close after success
      setTimeout(() => {
        setShowProgressModal(false);
        resetEmailAccountForm();
        refetchEmailAccounts();
      }, 1500);
    } catch (err: any) {
      setSaveSteps((prev) =>
        prev.map((s) =>
          s.status === 'active'
            ? { ...s, status: 'error', message: err.message }
            : s,
        ),
      );
    }
  };

  const handleSaveSmtpProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowSmtpProfileModal(false);
    setProgressType('smtp');

    const isEditing = !!editingSmtpProfileId;
    const needsConnectionTest =
      smtpProfileForm.username && smtpProfileForm.password;

    const steps: SaveStep[] = needsConnectionTest
      ? [
          { id: 'test', title: 'Testing connection', status: 'pending' },
          {
            id: 'save',
            title: isEditing ? 'Updating profile' : 'Saving profile',
            status: 'pending',
          },
        ]
      : [
          {
            id: 'save',
            title: isEditing ? 'Updating profile' : 'Saving profile',
            status: 'pending',
          },
        ];
    setSaveSteps(steps);
    setShowProgressModal(true);

    try {
      // Step 1: Test connection (only if credentials provided)
      if (needsConnectionTest) {
        setSaveSteps((prev) =>
          prev.map((s) => (s.id === 'test' ? { ...s, status: 'active' } : s)),
        );

        const testResult = await testSmtpConnection({
          variables: {
            input: {
              host: smtpProfileForm.host,
              port: smtpProfileForm.port,
              username: smtpProfileForm.username,
              password: smtpProfileForm.password,
              useSsl: smtpProfileForm.useSsl,
            },
          },
        });

        const testRes = testResult.data?.testSmtpConnection;
        if (!testRes?.success) {
          setSaveSteps((prev) =>
            prev.map((s) =>
              s.id === 'test'
                ? {
                    ...s,
                    status: 'error',
                    message: testRes?.message || 'Connection failed',
                  }
                : s,
            ),
          );
          return;
        }

        setSaveSteps((prev) =>
          prev.map((s) =>
            s.id === 'test'
              ? { ...s, status: 'success', message: 'Connection successful' }
              : s,
          ),
        );
      }

      // Step 2: Save/Update profile
      setSaveSteps((prev) =>
        prev.map((s) => (s.id === 'save' ? { ...s, status: 'active' } : s)),
      );

      if (isEditing) {
        await updateSmtpProfile({
          variables: {
            input: {
              id: editingSmtpProfileId,
              name: smtpProfileForm.name,
              alias: smtpProfileForm.alias || undefined,
              host: smtpProfileForm.host,
              port: smtpProfileForm.port,
              useSsl: smtpProfileForm.useSsl,
              isDefault: smtpProfileForm.isDefault,
              ...(smtpProfileForm.username && {
                username: smtpProfileForm.username,
              }),
              ...(smtpProfileForm.password && {
                password: smtpProfileForm.password,
              }),
            },
          },
        });
      } else {
        await createSmtpProfile({
          variables: {
            input: {
              ...smtpProfileForm,
              alias: smtpProfileForm.alias || undefined,
            },
          },
        });
      }

      setSaveSteps((prev) =>
        prev.map((s) =>
          s.id === 'save'
            ? { ...s, status: 'success', message: 'Profile saved successfully' }
            : s,
        ),
      );

      // Auto-close after success
      setTimeout(() => {
        setShowProgressModal(false);
        resetSmtpProfileForm();
        refetchSmtpProfiles();
      }, 1500);
    } catch (err: any) {
      setSaveSteps((prev) =>
        prev.map((s) =>
          s.status === 'active'
            ? { ...s, status: 'error', message: err.message }
            : s,
        ),
      );
    }
  };

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
    // If there was an error, reopen the form modal
    const hasError = saveSteps.some((s) => s.status === 'error');
    if (hasError) {
      if (progressType === 'email') {
        setShowEmailAccountModal(true);
      } else {
        setShowSmtpProfileModal(true);
      }
    }
  };

  const emailAccounts = emailAccountsData?.getEmailAccounts ?? [];
  const smtpProfiles = smtpProfilesData?.getSmtpProfiles ?? [];

  return (
    <PageWrapper>
      <Container>
        <Header>
          <Title>
            <FontAwesomeIcon icon={faCog} className="me-2" />
            Settings
          </Title>
        </Header>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {user && (
          <UserInfo>
            <Avatar>
              {user.firstName[0]}
              {user.lastName[0]}
            </Avatar>
            <div>
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <div className="text-muted">{user.email}</div>
            </div>
            <Button
              variant="outline-danger"
              className="ms-auto"
              onClick={logout}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
              Sign Out
            </Button>
          </UserInfo>
        )}

        <Tabs defaultActiveKey="email-accounts" className="mb-3">
          <Tab
            eventKey="email-accounts"
            title={
              <>
                <FontAwesomeIcon icon={faInbox} className="me-1" />
                Email Accounts (IMAP/POP)
              </>
            }
          >
            <SectionCard>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Incoming Email Accounts</h5>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => syncAllAccounts()}
                      disabled={syncingAll || emailAccounts.length === 0}
                    >
                      {syncingAll ? (
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-1"
                        />
                      ) : (
                        <FontAwesomeIcon icon={faSync} className="me-1" />
                      )}
                      Sync All
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowEmailAccountModal(true)}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-1" />
                      Add Account
                    </Button>
                  </div>
                </div>

                {emailAccountsLoading && emailAccounts.length === 0 ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : emailAccounts.length === 0 ? (
                  <p className="text-muted text-center py-4">
                    No email accounts configured. Add one to start receiving
                    emails.
                  </p>
                ) : (
                  <AccountCardGrid>
                    {emailAccounts.map((account) => (
                      <EmailAccountCard
                        key={account.id}
                        account={account}
                        onEdit={handleEditEmailAccount}
                        onSync={(id) =>
                          syncEmailAccount({
                            variables: { input: { emailAccountId: id } },
                          })
                        }
                        onDelete={(id) =>
                          deleteEmailAccount({ variables: { id } })
                        }
                      />
                    ))}
                  </AccountCardGrid>
                )}
              </Card.Body>
            </SectionCard>
          </Tab>

          <Tab
            eventKey="smtp-profiles"
            title={
              <>
                <FontAwesomeIcon icon={faPaperPlane} className="me-1" />
                SMTP Profiles
              </>
            }
          >
            <SectionCard>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Outgoing Email Profiles</h5>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowSmtpProfileModal(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-1" />
                    Add Profile
                  </Button>
                </div>

                {smtpProfilesLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : smtpProfiles.length === 0 ? (
                  <p className="text-muted text-center py-4">
                    No SMTP profiles configured. Add one to start sending
                    emails.
                  </p>
                ) : (
                  <SmtpCardGrid>
                    {smtpProfiles.map((profile) => (
                      <SmtpProfileCard
                        key={profile.id}
                        profile={profile}
                        onEdit={handleEditSmtpProfile}
                        onDelete={(id) =>
                          deleteSmtpProfile({ variables: { id } })
                        }
                      />
                    ))}
                  </SmtpCardGrid>
                )}
              </Card.Body>
            </SectionCard>
          </Tab>

          <Tab
            eventKey="auth-methods"
            title={
              <>
                <FontAwesomeIcon icon={faShieldAlt} className="me-1" />
                Login Methods
              </>
            }
          >
            <SectionCard>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Authentication Methods</h5>
                </div>
                <p className="text-muted mb-4">
                  Manage the ways you can sign in to your account. You can link
                  multiple email addresses or social accounts.
                </p>

                {authMethodsLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : authMethods.length === 0 ? (
                  <Alert variant="warning">
                    No authentication methods found. This may indicate an issue
                    with your account.
                  </Alert>
                ) : (
                  <>
                    {authMethods.map((method) => {
                      const getProviderIcon = () => {
                        switch (method.provider) {
                          case 'GOOGLE':
                            return faGoogle;
                          case 'GITHUB':
                            return faGithub;
                          case 'APPLE':
                            return faApple;
                          case 'MICROSOFT':
                            return faMicrosoft;
                          default:
                            return faKey;
                        }
                      };

                      const getProviderName = () => {
                        switch (method.provider) {
                          case 'EMAIL_PASSWORD':
                            return 'Email & Password';
                          case 'GOOGLE':
                            return 'Google';
                          case 'GITHUB':
                            return 'GitHub';
                          case 'APPLE':
                            return 'Apple';
                          case 'MICROSOFT':
                            return 'Microsoft';
                          default:
                            return method.provider;
                        }
                      };

                      return (
                        <AuthMethodCard key={method.id}>
                          <AuthMethodIcon $provider={method.provider}>
                            <FontAwesomeIcon icon={getProviderIcon()} />
                          </AuthMethodIcon>
                          <AuthMethodInfo>
                            <AuthMethodName>{getProviderName()}</AuthMethodName>
                            <AuthMethodEmail>{method.email}</AuthMethodEmail>
                            <AuthMethodMeta>
                              Added{' '}
                              {method.createdAt
                                ? new Date(
                                    method.createdAt,
                                  ).toLocaleDateString()
                                : 'Unknown'}
                              {method.lastUsedAt && (
                                <>
                                  {' · '}Last used{' '}
                                  {new Date(
                                    method.lastUsedAt,
                                  ).toLocaleDateString()}
                                </>
                              )}
                            </AuthMethodMeta>
                          </AuthMethodInfo>
                          {authMethods.length > 1 && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                deleteAuthMethod({
                                  variables: { id: method.id },
                                })
                              }
                              disabled={deletingAuthMethod}
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="me-1"
                              />
                              Remove
                            </Button>
                          )}
                        </AuthMethodCard>
                      );
                    })}

                    <Alert variant="info" className="mt-4">
                      <FontAwesomeIcon icon={faShieldAlt} className="me-2" />
                      <strong>Coming Soon:</strong> Link additional sign-in
                      methods like Google, GitHub, Apple, or Microsoft to your
                      account.
                    </Alert>
                  </>
                )}
              </Card.Body>
            </SectionCard>
          </Tab>
        </Tabs>

        {/* Email Account Modal */}
        <EmailAccountForm
          show={showEmailAccountModal}
          onHide={() => {
            setShowEmailAccountModal(false);
            resetEmailAccountForm();
          }}
          onSubmit={handleEmailAccountFormSubmit}
          onTest={handleEmailAccountFormTest}
          editingAccount={
            editingEmailAccountId
              ? emailAccounts.find((a) => a.id === editingEmailAccountId)
              : null
          }
          smtpProfiles={smtpProfiles}
          isSubmitting={creatingEmailAccount}
          isTesting={testingEmailAccount}
          testResult={testResult}
        />

        {/* SMTP Profile Modal */}
        <SmtpProfileForm
          show={showSmtpProfileModal}
          onHide={() => {
            setShowSmtpProfileModal(false);
            resetSmtpProfileForm();
          }}
          onSubmit={handleSmtpProfileFormSubmit}
          onTest={handleSmtpProfileFormTest}
          editingProfile={
            editingSmtpProfileId
              ? smtpProfiles.find((p) => p.id === editingSmtpProfileId)
              : null
          }
          isSubmitting={creatingSmtpProfile}
          isTesting={testingSmtp}
          testResult={testResult}
        />

        {/* Progress Modal */}
        <Modal
          show={showProgressModal}
          onHide={handleCloseProgressModal}
          centered
          backdrop="static"
        >
          <Modal.Header
            closeButton={saveSteps.some(
              (s) => s.status === 'error' || s.status === 'success',
            )}
          >
            <Modal.Title>
              {progressType === 'email'
                ? editingEmailAccountId
                  ? 'Updating Email Account'
                  : 'Adding Email Account'
                : editingSmtpProfileId
                  ? 'Updating SMTP Profile'
                  : 'Adding SMTP Profile'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ProgressStepList>
              {saveSteps.map((step, index) => (
                <ProgressStep key={step.id} $status={step.status}>
                  <StepIcon $status={step.status}>
                    {step.status === 'pending' && (
                      <FontAwesomeIcon icon={faCircle} />
                    )}
                    {step.status === 'active' && (
                      <Spinner animation="border" size="sm" />
                    )}
                    {step.status === 'success' && (
                      <FontAwesomeIcon icon={faCheckCircle} />
                    )}
                    {step.status === 'error' && (
                      <FontAwesomeIcon icon={faTimesCircle} />
                    )}
                  </StepIcon>
                  <StepContent>
                    <StepTitle>
                      Step {index + 1}: {step.title}
                    </StepTitle>
                    {step.message && (
                      <StepSubtitle>{step.message}</StepSubtitle>
                    )}
                  </StepContent>
                </ProgressStep>
              ))}
            </ProgressStepList>
          </Modal.Body>
          {saveSteps.some((s) => s.status === 'error') && (
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseProgressModal}>
                Go Back &amp; Fix
              </Button>
            </Modal.Footer>
          )}
        </Modal>
      </Container>
    </PageWrapper>
  );
}
