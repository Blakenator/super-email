import { useState } from 'react';
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
} from 'react-bootstrap';
import styled from 'styled-components';
import {
  GET_EMAIL_ACCOUNTS_QUERY,
  CREATE_EMAIL_ACCOUNT_MUTATION,
  DELETE_EMAIL_ACCOUNT_MUTATION,
  SYNC_EMAIL_ACCOUNT_MUTATION,
  GET_SMTP_PROFILES_FULL_QUERY,
  CREATE_SMTP_PROFILE_MUTATION,
  DELETE_SMTP_PROFILE_MUTATION,
  TEST_EMAIL_ACCOUNT_CONNECTION_MUTATION,
  TEST_SMTP_CONNECTION_MUTATION,
  UPDATE_EMAIL_ACCOUNT_MUTATION,
  UPDATE_SMTP_PROFILE_MUTATION,
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
} from '@fortawesome/free-solid-svg-icons';

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
  } = useQuery(GET_EMAIL_ACCOUNTS_QUERY);

  const {
    data: smtpProfilesData,
    loading: smtpProfilesLoading,
    refetch: refetchSmtpProfiles,
  } = useQuery(GET_SMTP_PROFILES_FULL_QUERY);

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

  const [syncEmailAccount] = useMutation(SYNC_EMAIL_ACCOUNT_MUTATION, {
    onCompleted: () => refetchEmailAccounts(),
    onError: (err) => setError(err.message),
  });

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
        await createSmtpProfile({ variables: { input: smtpProfileForm } });
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
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowEmailAccountModal(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-1" />
                    Add Account
                  </Button>
                </div>

                {emailAccountsLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : emailAccounts.length === 0 ? (
                  <p className="text-muted text-center py-4">
                    No email accounts configured. Add one to start receiving
                    emails.
                  </p>
                ) : (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Server</th>
                        <th>Type</th>
                        <th>Default SMTP</th>
                        <th>Last Sync</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailAccounts.map((account) => (
                        <tr key={account.id}>
                          <td>{account.name}</td>
                          <td>{account.email}</td>
                          <td>
                            {account.host}:{account.port}
                          </td>
                          <td>
                            <Badge
                              bg={
                                account.accountType === 'IMAP'
                                  ? 'info'
                                  : 'secondary'
                              }
                            >
                              {account.accountType}
                            </Badge>
                          </td>
                          <td>
                            {account.defaultSmtpProfile ? (
                              <Badge bg="primary">
                                {account.defaultSmtpProfile.name}
                              </Badge>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            {account.lastSyncedAt
                              ? new Date(account.lastSyncedAt).toLocaleString()
                              : 'Never'}
                          </td>
                          <td>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="me-1"
                              onClick={() => handleEditEmailAccount(account.id)}
                            >
                              <FontAwesomeIcon icon={faEdit} className="me-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() =>
                                syncEmailAccount({
                                  variables: {
                                    input: { emailAccountId: account.id },
                                  },
                                })
                              }
                            >
                              <FontAwesomeIcon icon={faSync} className="me-1" />
                              Sync
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
