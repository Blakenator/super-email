import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Container,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Alert,
  Spinner,
  Badge,
  Tabs,
  Tab,
  ProgressBar,
  OverlayTrigger,
  Tooltip,
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faInbox,
  faPaperPlane,
  faSignOutAlt,
  faPlus,
  faSync,
  faTrash,
  faPlug,
  faCheckCircle,
  faTimesCircle,
  faCircle,
  faSave,
  faEdit,
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

const SyncStatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SyncStatusHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SyncStatusText = styled.span`
  font-size: 0.8rem;
  color: #667eea;
  font-weight: 500;
`;

const SyncProgressBar = styled(ProgressBar)`
  height: 8px;
  border-radius: 4px;
  background-color: #e0e0e0 !important;

  .progress-bar {
    border-radius: 4px;
  }
`;

// Email Account Card Grid
const AccountCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const AccountCard = styled(Card)<{ $isSyncing?: boolean }>`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  overflow: hidden;

  ${({ $isSyncing }) =>
    $isSyncing &&
    `
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  `}

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const AccountCardHeader = styled(Card.Header)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: ${({ theme }) => theme.spacing.md};
  border: none;
`;

const AccountCardTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const AccountCardSubtitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: 0.9;
`;

const AccountCardBody = styled(Card.Body)`
  padding: ${({ theme }) => theme.spacing.md};
`;

const AccountDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AccountDetailLabel = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const AccountCardFooter = styled(Card.Footer)`
  background: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
`;

const AccountCardActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
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
                      <AccountCard
                        key={account.id}
                        $isSyncing={account.isSyncing}
                      >
                        <AccountCardHeader>
                          <AccountCardTitle>{account.name}</AccountCardTitle>
                          <AccountCardSubtitle>
                            {account.email}
                          </AccountCardSubtitle>
                        </AccountCardHeader>
                        <AccountCardBody>
                          <AccountDetailRow>
                            <AccountDetailLabel>Server</AccountDetailLabel>
                            <span>
                              {account.host}:{account.port}
                            </span>
                          </AccountDetailRow>
                          <AccountDetailRow>
                            <AccountDetailLabel>Type</AccountDetailLabel>
                            <Badge
                              bg={
                                account.accountType === 'IMAP'
                                  ? 'info'
                                  : 'secondary'
                              }
                            >
                              {account.accountType}
                            </Badge>
                          </AccountDetailRow>
                          <AccountDetailRow>
                            <AccountDetailLabel>
                              Default SMTP
                            </AccountDetailLabel>
                            {account.defaultSmtpProfile ? (
                              <Badge bg="primary">
                                {account.defaultSmtpProfile.name}
                              </Badge>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </AccountDetailRow>
                          <AccountDetailRow>
                            <AccountDetailLabel>Last Sync</AccountDetailLabel>
                            {account.lastSyncedAt ? (
                              <span>
                                {new Date(account.lastSyncedAt).toLocaleString(
                                  [],
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )}
                              </span>
                            ) : (
                              <span className="text-muted">Never synced</span>
                            )}
                          </AccountDetailRow>
                        </AccountCardBody>
                        {account.isSyncing && (
                          <AccountCardFooter>
                            <SyncStatusContainer>
                              <SyncStatusHeader>
                                <Spinner
                                  animation="border"
                                  size="sm"
                                  style={{ width: '14px', height: '14px' }}
                                />
                                <SyncStatusText>
                                  {account.syncStatus || 'Syncing...'}
                                </SyncStatusText>
                              </SyncStatusHeader>
                              {account.syncProgress !== null &&
                                account.syncProgress !== undefined && (
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={
                                      <Tooltip
                                        id={`sync-progress-${account.id}`}
                                      >
                                        {account.syncProgress}% complete
                                      </Tooltip>
                                    }
                                  >
                                    <SyncProgressBar
                                      now={account.syncProgress}
                                      variant="primary"
                                      animated
                                    />
                                  </OverlayTrigger>
                                )}
                            </SyncStatusContainer>
                          </AccountCardFooter>
                        )}
                        <AccountCardFooter>
                          <AccountCardActions>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleEditEmailAccount(account.id)}
                            >
                              <FontAwesomeIcon icon={faEdit} className="me-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() =>
                                syncEmailAccount({
                                  variables: {
                                    input: { emailAccountId: account.id },
                                  },
                                })
                              }
                              disabled={account.isSyncing}
                            >
                              {account.isSyncing ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <>
                                  <FontAwesomeIcon
                                    icon={faSync}
                                    className="me-1"
                                  />
                                  Sync
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                deleteEmailAccount({
                                  variables: { id: account.id },
                                })
                              }
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="me-1"
                              />
                              Delete
                            </Button>
                          </AccountCardActions>
                        </AccountCardFooter>
                      </AccountCard>
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
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Server</th>
                        <th>Default</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {smtpProfiles.map((profile) => (
                        <tr key={profile.id}>
                          <td>{profile.name}</td>
                          <td>{profile.email}</td>
                          <td>
                            {profile.host}:{profile.port}
                          </td>
                          <td>
                            {profile.isDefault && (
                              <Badge bg="success">Default</Badge>
                            )}
                          </td>
                          <td>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="me-1"
                              onClick={() => handleEditSmtpProfile(profile.id)}
                            >
                              <FontAwesomeIcon icon={faEdit} className="me-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                deleteSmtpProfile({
                                  variables: { id: profile.id },
                                })
                              }
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="me-1"
                              />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
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
        <Modal
          show={showEmailAccountModal}
          onHide={() => {
            setShowEmailAccountModal(false);
            resetEmailAccountForm();
          }}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {editingEmailAccountId
                ? 'Edit Email Account'
                : 'Add Email Account'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSaveEmailAccount}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Account Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Personal Gmail"
                  value={emailAccountForm.name}
                  onChange={(e) =>
                    setEmailAccountForm({
                      ...emailAccountForm,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="you@gmail.com"
                  value={emailAccountForm.email}
                  onChange={(e) =>
                    setEmailAccountForm({
                      ...emailAccountForm,
                      email: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Account Type</Form.Label>
                <Form.Select
                  value={emailAccountForm.accountType}
                  onChange={(e) =>
                    setEmailAccountForm({
                      ...emailAccountForm,
                      accountType: e.target.value as EmailAccountType,
                      port: e.target.value === 'IMAP' ? 993 : 995,
                    })
                  }
                >
                  <option value="IMAP">IMAP</option>
                  <option value="POP3">POP3</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Server Host</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="imap.gmail.com"
                  value={emailAccountForm.host}
                  onChange={(e) =>
                    setEmailAccountForm({
                      ...emailAccountForm,
                      host: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Port</Form.Label>
                <Form.Control
                  type="number"
                  value={emailAccountForm.port}
                  onChange={(e) =>
                    setEmailAccountForm({
                      ...emailAccountForm,
                      port: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  Username
                  {editingEmailAccountId && (
                    <span className="text-muted ms-2">
                      (leave blank to keep current)
                    </span>
                  )}
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder={
                    editingEmailAccountId ? '(unchanged)' : 'you@gmail.com'
                  }
                  value={emailAccountForm.username}
                  onChange={(e) =>
                    setEmailAccountForm({
                      ...emailAccountForm,
                      username: e.target.value,
                    })
                  }
                  required={!editingEmailAccountId}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  Password / App Password
                  {editingEmailAccountId && (
                    <span className="text-muted ms-2">
                      (leave blank to keep current)
                    </span>
                  )}
                </Form.Label>
                <Form.Control
                  type="password"
                  value={emailAccountForm.password}
                  onChange={(e) =>
                    setEmailAccountForm({
                      ...emailAccountForm,
                      password: e.target.value,
                    })
                  }
                  required={!editingEmailAccountId}
                  placeholder={editingEmailAccountId ? '••••••••' : ''}
                />
              </Form.Group>
              <Form.Check
                type="checkbox"
                label="Use SSL/TLS"
                checked={emailAccountForm.useSsl}
                onChange={(e) =>
                  setEmailAccountForm({
                    ...emailAccountForm,
                    useSsl: e.target.checked,
                  })
                }
                className="mb-3"
              />
              <Form.Group className="mb-3">
                <Form.Label>Default SMTP Profile for Sending</Form.Label>
                <Form.Select
                  value={emailAccountForm.defaultSmtpProfileId || ''}
                  onChange={(e) =>
                    setEmailAccountForm({
                      ...emailAccountForm,
                      defaultSmtpProfileId: e.target.value || null,
                    })
                  }
                >
                  <option value="">-- None --</option>
                  {smtpProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} ({profile.email})
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Select a default SMTP profile for sending replies from this
                  account
                </Form.Text>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowEmailAccountModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline-info"
                onClick={handleTestEmailAccountConnection}
                disabled={
                  testingEmailAccount ||
                  !emailAccountForm.host ||
                  !emailAccountForm.username ||
                  !emailAccountForm.password
                }
              >
                {testingEmailAccount ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlug} className="me-1" />
                    Test Only
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={
                  !emailAccountForm.host ||
                  !emailAccountForm.name ||
                  (!editingEmailAccountId &&
                    (!emailAccountForm.username || !emailAccountForm.password))
                }
              >
                <FontAwesomeIcon icon={faSave} className="me-1" />
                {editingEmailAccountId ? 'Save Changes' : 'Test & Save'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* SMTP Profile Modal */}
        <Modal
          show={showSmtpProfileModal}
          onHide={() => {
            setShowSmtpProfileModal(false);
            resetSmtpProfileForm();
          }}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {editingSmtpProfileId ? 'Edit SMTP Profile' : 'Add SMTP Profile'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSaveSmtpProfile}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Profile Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Work Email"
                  value={smtpProfileForm.name}
                  onChange={(e) =>
                    setSmtpProfileForm({
                      ...smtpProfileForm,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>From Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="you@company.com"
                  value={smtpProfileForm.email}
                  onChange={(e) =>
                    setSmtpProfileForm({
                      ...smtpProfileForm,
                      email: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  Email Alias (optional)
                  <span className="text-muted ms-2">
                    Display name for sent emails
                  </span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="John Doe"
                  value={smtpProfileForm.alias || ''}
                  onChange={(e) =>
                    setSmtpProfileForm({
                      ...smtpProfileForm,
                      alias: e.target.value || null,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>SMTP Server Host</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={smtpProfileForm.host}
                  onChange={(e) =>
                    setSmtpProfileForm({
                      ...smtpProfileForm,
                      host: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Port</Form.Label>
                <Form.Control
                  type="number"
                  value={smtpProfileForm.port}
                  onChange={(e) =>
                    setSmtpProfileForm({
                      ...smtpProfileForm,
                      port: parseInt(e.target.value),
                    })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  Username
                  {editingSmtpProfileId && (
                    <span className="text-muted ms-2">
                      (leave blank to keep current)
                    </span>
                  )}
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder={
                    editingSmtpProfileId ? '(unchanged)' : 'you@company.com'
                  }
                  value={smtpProfileForm.username}
                  onChange={(e) =>
                    setSmtpProfileForm({
                      ...smtpProfileForm,
                      username: e.target.value,
                    })
                  }
                  required={!editingSmtpProfileId}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  Password / App Password
                  {editingSmtpProfileId && (
                    <span className="text-muted ms-2">
                      (leave blank to keep current)
                    </span>
                  )}
                </Form.Label>
                <Form.Control
                  type="password"
                  value={smtpProfileForm.password}
                  onChange={(e) =>
                    setSmtpProfileForm({
                      ...smtpProfileForm,
                      password: e.target.value,
                    })
                  }
                  required={!editingSmtpProfileId}
                  placeholder={editingSmtpProfileId ? '••••••••' : ''}
                />
              </Form.Group>
              <Form.Check
                type="checkbox"
                label="Use SSL/TLS"
                checked={smtpProfileForm.useSsl}
                onChange={(e) =>
                  setSmtpProfileForm({
                    ...smtpProfileForm,
                    useSsl: e.target.checked,
                  })
                }
                className="mb-2"
              />
              <Form.Check
                type="checkbox"
                label="Set as default profile"
                checked={smtpProfileForm.isDefault}
                onChange={(e) =>
                  setSmtpProfileForm({
                    ...smtpProfileForm,
                    isDefault: e.target.checked,
                  })
                }
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowSmtpProfileModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline-info"
                onClick={handleTestSmtpConnection}
                disabled={
                  testingSmtp ||
                  !smtpProfileForm.host ||
                  !smtpProfileForm.username ||
                  !smtpProfileForm.password
                }
              >
                {testingSmtp ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlug} className="me-1" />
                    Test Only
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={
                  !smtpProfileForm.host ||
                  !smtpProfileForm.name ||
                  (!editingSmtpProfileId &&
                    (!smtpProfileForm.username || !smtpProfileForm.password))
                }
              >
                <FontAwesomeIcon icon={faSave} className="me-1" />
                {editingSmtpProfileId ? 'Save Changes' : 'Test & Save'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

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
