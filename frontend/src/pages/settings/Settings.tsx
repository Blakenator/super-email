import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Container,
  Card,
  Button,
  Modal,
  Alert,
  Spinner,
  Tabs,
  Tab,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router';
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
import { AuthProvider, EmailAccountType } from '../../__generated__/graphql';
import { useAuth } from '../../contexts/AuthContext';
import {
  EmailAccountForm,
  type EmailAccountFormData,
  SmtpProfileForm,
  type SmtpProfileFormData,
  EmailAccountCard,
  SmtpProfileCard,
  TagsManager,
  MailRulesManager,
  NotificationSettings,
  ThemeSettings,
  BillingSettings,
} from './components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faInbox,
  faPaperPlane,
  faPlus,
  faSync,
  faTrash,
  faKey,
  faShieldAlt,
  faTag,
  faFilter,
  faBell,
  faPalette,
  faSignOutAlt,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import {
  faGoogle,
  faGithub,
  faApple,
  faMicrosoft,
} from '@fortawesome/free-brands-svg-icons';
import { PageWrapper } from '../../core/components';
import {
  Header,
  Title,
  SectionCard,
  UserInfo,
  Avatar,
  AccountCardGrid,
  SmtpCardGrid,
  AuthMethodCard,
  AuthMethodIcon,
  AuthMethodInfo,
  AuthMethodName,
  AuthMethodEmail,
  AuthMethodMeta,
  ResponsiveTabsWrapper,
} from './Settings.wrappers';

// Map URL tab slugs to internal tab keys
const TAB_MAPPING: Record<string, string> = {
  accounts: 'email-accounts',
  smtp: 'smtp-profiles',
  auth: 'auth-methods',
  tags: 'tags',
  rules: 'rules',
  notifications: 'notifications',
  appearance: 'appearance',
  billing: 'billing',
};

const REVERSE_TAB_MAPPING = Object.fromEntries(
  Object.entries(TAB_MAPPING).map(([k, v]) => [v, k]),
);

/* eslint-disable max-lines-per-function -- Settings page consolidates multiple tabs; refactor would require significant restructuring */
export function Settings() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showEmailAccountModal, setShowEmailAccountModal] = useState(false);
  const [showSmtpProfileModal, setShowSmtpProfileModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [, setConnectionTested] = useState(false);

  // Determine active tab from URL
  const activeTab =
    tab && TAB_MAPPING[tab] ? TAB_MAPPING[tab] : 'email-accounts';

  const handleTabSelect = (key: string | null) => {
    if (key) {
      const urlTab = REVERSE_TAB_MAPPING[key] || 'accounts';
      void navigate(`/settings/${urlTab}`, { replace: true });
    }
  };

  // Edit mode state
  const [editingEmailAccountId, setEditingEmailAccountId] = useState<
    string | null
  >(null);
  const [editingSmtpProfileId, setEditingSmtpProfileId] = useState<
    string | null
  >(null);

  // Delete confirmation state
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(
    null,
  );

  // Pending SMTP profile creation (for "also create SMTP" flow)
  const [pendingSmtpData, setPendingSmtpData] = useState<{
    name: string;
    email: string;
    providerId: string;
    password: string;
  } | null>(null);

  // Email Account form state
  const [, setEmailAccountForm] = useState({
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
  const [, setSmtpProfileForm] = useState({
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
    (a) => a.isHistoricalSyncing || a.isUpdateSyncing,
  );

  // Use useEffect for polling to avoid initialization error
  useEffect(() => {
    if (isSyncing) {
      startPolling(10000);
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isSyncing, startPolling, stopPolling]);

  // Open SMTP modal when email account is created with "also create SMTP" checked
  useEffect(() => {
    if (pendingSmtpData) {
      setShowSmtpProfileModal(true);
    }
  }, [pendingSmtpData]);

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
        void refetchAuthMethods();
        toast.success('Authentication method removed');
      },
      onError: (err) => toast.error(err.message),
    },
  );

  const authMethods = authMethodsData?.getAuthenticationMethods ?? [];

  const [createEmailAccount, { loading: creatingEmailAccount }] = useMutation(
    CREATE_EMAIL_ACCOUNT_MUTATION,
  );

  const [deleteEmailAccount, { loading: deletingAccount }] = useMutation(
    DELETE_EMAIL_ACCOUNT_MUTATION,
    {
      onCompleted: () => {
        void refetchEmailAccounts();
        setShowDeleteAccountModal(false);
        setDeletingAccountId(null);
        toast.success('Email account deleted');
      },
      onError: (err) => {
        setError(err.message);
        setShowDeleteAccountModal(false);
        setDeletingAccountId(null);
      },
    },
  );

  const handleDeleteAccountClick = (accountId: string) => {
    setDeletingAccountId(accountId);
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = () => {
    if (deletingAccountId) {
      void deleteEmailAccount({ variables: { id: deletingAccountId } });
    }
  };

  const [syncEmailAccount] = useMutation(SYNC_EMAIL_ACCOUNT_MUTATION, {
    onCompleted: () => void refetchEmailAccounts(),
    onError: (err) => setError(err.message),
  });

  const [syncAllAccounts, { loading: syncingAll }] = useMutation(
    SYNC_ALL_ACCOUNTS_MUTATION,
    {
      onCompleted: () => {
        // Refetch to get updated isSyncing state and trigger polling
        void refetchEmailAccounts();
        // Start polling immediately since accounts are now syncing
        startPolling(2000);
      },
      onError: (err) => setError(err.message),
    },
  );

  const [createSmtpProfile, { loading: creatingSmtpProfile }] = useMutation(
    CREATE_SMTP_PROFILE_MUTATION,
  );

  const [deleteSmtpProfile] = useMutation(DELETE_SMTP_PROFILE_MUTATION, {
    onCompleted: () => void refetchSmtpProfiles(),
    onError: (err) => setError(err.message),
  });

  const [testEmailAccountConnection, { loading: testingEmailAccount }] =
    useMutation(TEST_EMAIL_ACCOUNT_CONNECTION_MUTATION);

  const [testSmtpConnection, { loading: testingSmtp }] = useMutation(
    TEST_SMTP_CONNECTION_MUTATION,
  );

  const [updateEmailAccount] = useMutation(UPDATE_EMAIL_ACCOUNT_MUTATION, {
    onCompleted: () => void refetchEmailAccounts(),
    onError: (err) => setError(err.message),
  });

  const [updateSmtpProfile] = useMutation(UPDATE_SMTP_PROFILE_MUTATION, {
    onCompleted: () => void refetchSmtpProfiles(),
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
        accountType: account.accountType,
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
            password: formData.password || null,
            accountType: formData.accountType,
            useSsl: formData.useSsl,
            // Pass accountId when editing to use saved password
            accountId: editingEmailAccountId || null,
          },
        },
      });
      const testRes = result.data?.testEmailAccountConnection || {
        success: false,
        message: 'Unknown error',
      };
      setTestResult(testRes);
      return testRes;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const errorResult = { success: false, message };
      setTestResult(errorResult);
      return errorResult;
    }
  };

  const handleEmailAccountFormSubmit = async (
    formData: EmailAccountFormData,
  ) => {
    setError(null);

    try {
      if (editingEmailAccountId) {
        // Update existing account
        const result = await updateEmailAccount({
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
              isDefault: formData.isDefault,
            },
          },
        });
        if (result.error) {
          throw new Error(result.error?.message);
        }
        toast.success('Email account updated!');
      } else {
        // Create new account
        const result = await createEmailAccount({
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
              isDefault: formData.isDefault,
            },
          },
        });
        if (result.error) {
          throw new Error(result.error?.message);
        }
        toast.success('Email account added!');

        // If user wants to also create SMTP profile, save the data and open modal after 1s
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
      setShowEmailAccountModal(false);
      resetEmailAccountForm();
      void refetchEmailAccounts();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to save email account';
      toast.error(message);
    }
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
            password: formData.password || null,
            useSsl: formData.useSsl,
            // Pass profileId when editing to use saved password
            profileId: editingSmtpProfileId || null,
          },
        },
      });
      const testRes = result.data?.testSmtpConnection || {
        success: false,
        message: 'Unknown error',
      };
      setTestResult(testRes);
      return testRes;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const errorResult = { success: false, message };
      setTestResult(errorResult);
      return errorResult;
    }
  };

  const handleSmtpProfileFormSubmit = async (formData: SmtpProfileFormData) => {
    setError(null);

    try {
      if (editingSmtpProfileId) {
        // Update existing profile
        const result = await updateSmtpProfile({
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
        if (result.error) {
          throw new Error(result.error.message);
        }
        toast.success('SMTP profile updated!');
      } else {
        // Create new profile
        const result = await createSmtpProfile({
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
        if (result.error) {
          throw new Error(result.error.message);
        }
        toast.success('SMTP profile added!');
      }
      setShowSmtpProfileModal(false);
      resetSmtpProfileForm();
      void refetchSmtpProfiles();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to save SMTP profile';
      toast.error(message);
    }
  };

  const emailAccounts = emailAccountsData?.getEmailAccounts ?? [];
  const smtpProfiles = smtpProfilesData?.getSmtpProfiles ?? [];
  const deletingAccountData = emailAccounts.find(
    (a) => a.id === deletingAccountId,
  );

  return (
    <PageWrapper $padding $overflow="auto">
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
              {user.firstName?.[0] ?? ''}
              {user.lastName?.[0] ?? ''}
            </Avatar>
            <div>
              <strong>
                {user.firstName ?? ''} {user.lastName ?? ''}
              </strong>
              <div className="text-muted">{user.email}</div>
            </div>
            <Button
              variant="outline-danger"
              className="ms-auto"
              onClick={() => void logout()}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
              Sign Out
            </Button>
          </UserInfo>
        )}

        <ResponsiveTabsWrapper>
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabSelect}
            className="mb-3"
          >
            <Tab
              eventKey="email-accounts"
              title={
                <>
                  <FontAwesomeIcon icon={faInbox} className="me-1" />
                  Email Accounts (IMAP/POP)
                </>
              }
            >
              <SectionCard className="card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Incoming Email Accounts</h5>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => void syncAllAccounts()}
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
                    <div className="text-center py-5">
                      <FontAwesomeIcon
                        icon={faInbox}
                        size="3x"
                        className="text-muted mb-3"
                      />
                      <h5>No Email Accounts Yet</h5>
                      <p className="text-muted mb-3">
                        Add an email account to start receiving emails. You'll
                        need your email server's IMAP settings (host, port) and
                        your credentials (usually your email and an app
                        password).
                      </p>
                      <p className="text-muted small mb-4">
                        <strong>First time setup:</strong> After adding an email
                        account, you'll also need to add an SMTP profile to send
                        emails. You can check "Also create an SMTP profile" when
                        adding your account to set this up automatically.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => setShowEmailAccountModal(true)}
                      >
                        <FontAwesomeIcon icon={faPlus} className="me-1" />
                        Add Your First Account
                      </Button>
                    </div>
                  ) : (
                    <AccountCardGrid>
                      {emailAccounts.map((account) => (
                        <EmailAccountCard
                          key={account.id}
                          account={account}
                          onEdit={handleEditEmailAccount}
                          onSync={(id) =>
                            void syncEmailAccount({
                              variables: { input: { emailAccountId: id } },
                            })
                          }
                          onDelete={(id) => handleDeleteAccountClick(id)}
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
              <SectionCard className="card">
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
                    <div className="text-center py-5">
                      <FontAwesomeIcon
                        icon={faPaperPlane}
                        size="3x"
                        className="text-muted mb-3"
                      />
                      <h5>No SMTP Profiles Yet</h5>
                      <p className="text-muted mb-3">
                        Add an SMTP profile to send emails. You'll need your
                        email server's SMTP settings (host, port) and your
                        credentials (usually your email and an app password).
                      </p>
                      <p className="text-muted small mb-4">
                        <strong>Tip:</strong> Most email providers use the same
                        credentials for IMAP and SMTP, but different servers.
                        For example, Gmail uses <code>imap.gmail.com</code> for
                        receiving and <code>smtp.gmail.com</code> for sending.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => setShowSmtpProfileModal(true)}
                      >
                        <FontAwesomeIcon icon={faPlus} className="me-1" />
                        Add Your First Profile
                      </Button>
                    </div>
                  ) : (
                    <SmtpCardGrid>
                      {smtpProfiles.map((profile) => (
                        <SmtpProfileCard
                          key={profile.id}
                          profile={profile}
                          onEdit={handleEditSmtpProfile}
                          onDelete={(id) =>
                            void deleteSmtpProfile({ variables: { id } })
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
              <SectionCard className="card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Authentication Methods</h5>
                  </div>
                  <p className="text-muted mb-4">
                    Manage the ways you can sign in to your account. You can
                    link multiple email addresses or social accounts.
                  </p>

                  {authMethodsLoading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : authMethods.length === 0 ? (
                    <Alert variant="warning">
                      No authentication methods found. This may indicate an
                      issue with your account.
                    </Alert>
                  ) : (
                    <>
                      {authMethods.map((method) => {
                        const provider = method.provider;
                        const getProviderIcon = () => {
                          switch (provider) {
                            case AuthProvider.Google:
                              return faGoogle;
                            case AuthProvider.Github:
                              return faGithub;
                            case AuthProvider.Apple:
                              return faApple;
                            case AuthProvider.Microsoft:
                              return faMicrosoft;
                            default:
                              return faKey;
                          }
                        };

                        const getProviderName = () => {
                          switch (provider) {
                            case AuthProvider.EmailPassword:
                              return 'Email & Password';
                            case AuthProvider.Google:
                              return 'Google';
                            case AuthProvider.Github:
                              return 'GitHub';
                            case AuthProvider.Apple:
                              return 'Apple';
                            case AuthProvider.Microsoft:
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
                              <AuthMethodName>
                                {getProviderName()}
                              </AuthMethodName>
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
                                  void deleteAuthMethod({
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

            <Tab
              eventKey="tags"
              title={
                <>
                  <FontAwesomeIcon icon={faTag} className="me-1" />
                  Tags
                </>
              }
            >
              <TagsManager />
            </Tab>

            <Tab
              eventKey="rules"
              title={
                <>
                  <FontAwesomeIcon icon={faFilter} className="me-1" />
                  Mail Rules
                </>
              }
            >
              <MailRulesManager />
            </Tab>

            <Tab
              eventKey="notifications"
              title={
                <>
                  <FontAwesomeIcon icon={faBell} className="me-1" />
                  Notifications
                </>
              }
            >
              <NotificationSettings />
            </Tab>

            <Tab
              eventKey="appearance"
              title={
                <>
                  <FontAwesomeIcon icon={faPalette} className="me-1" />
                  Appearance
                </>
              }
            >
              <ThemeSettings />
            </Tab>

            <Tab
              eventKey="billing"
              title={
                <>
                  <FontAwesomeIcon icon={faCreditCard} className="me-1" />
                  Billing
                </>
              }
            >
              <BillingSettings />
            </Tab>
          </Tabs>
        </ResponsiveTabsWrapper>

        {/* Email Account Modal */}
        <EmailAccountForm
          show={showEmailAccountModal}
          onHide={() => {
            setShowEmailAccountModal(false);
            resetEmailAccountForm();
          }}
          onSubmit={(formData) => void handleEmailAccountFormSubmit(formData)}
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
            setPendingSmtpData(null);
          }}
          onSubmit={(formData) => {
            void handleSmtpProfileFormSubmit(formData);
            setPendingSmtpData(null);
          }}
          onTest={handleSmtpProfileFormTest}
          editingProfile={
            editingSmtpProfileId
              ? smtpProfiles.find((p) => p.id === editingSmtpProfileId)
              : null
          }
          initialData={pendingSmtpData}
          isSubmitting={creatingSmtpProfile}
          isTesting={testingSmtp}
          testResult={testResult}
        />

        {/* Delete Account Confirmation Modal */}
        <Modal
          show={showDeleteAccountModal}
          onHide={() => {
            setShowDeleteAccountModal(false);
            setDeletingAccountId(null);
          }}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Delete Email Account</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete the account{' '}
              <strong>{deletingAccountData?.name}</strong>?
            </p>
            <Alert variant="danger">
              <strong>Warning:</strong> This will permanently delete the email
              account and all associated emails. This action cannot be undone.
            </Alert>
            <div className="text-muted small">
              <strong>Account:</strong> {deletingAccountData?.email}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteAccountModal(false);
                setDeletingAccountId(null);
              }}
              disabled={deletingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </PageWrapper>
  );
}
