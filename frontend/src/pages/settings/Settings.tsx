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
} from './queries';
import { EmailAccountType } from '../../__generated__/graphql';
import { useAuth } from '../../contexts/AuthContext';

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

export function Settings() {
  const { user, logout } = useAuth();
  const [showEmailAccountModal, setShowEmailAccountModal] = useState(false);
  const [showSmtpProfileModal, setShowSmtpProfileModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    });
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
  };

  const handleCreateEmailAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createEmailAccount({ variables: { input: emailAccountForm } });
  };

  const handleCreateSmtpProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createSmtpProfile({ variables: { input: smtpProfileForm } });
  };

  const emailAccounts = emailAccountsData?.getEmailAccounts ?? [];
  const smtpProfiles = smtpProfilesData?.getSmtpProfiles ?? [];

  return (
    <PageWrapper>
      <Container>
        <Header>
          <Title>⚙️ Settings</Title>
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
              Sign Out
            </Button>
          </UserInfo>
        )}

        <Tabs defaultActiveKey="email-accounts" className="mb-3">
          <Tab eventKey="email-accounts" title="📥 Email Accounts (IMAP/POP)">
            <SectionCard>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Incoming Email Accounts</h5>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowEmailAccountModal(true)}
                  >
                    + Add Account
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
                            {account.lastSyncedAt
                              ? new Date(account.lastSyncedAt).toLocaleString()
                              : 'Never'}
                          </td>
                          <td>
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

          <Tab eventKey="smtp-profiles" title="📤 SMTP Profiles">
            <SectionCard>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Outgoing Email Profiles</h5>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowSmtpProfileModal(true)}
                  >
                    + Add Profile
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
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                deleteSmtpProfile({
                                  variables: { id: profile.id },
                                })
                              }
                            >
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
          onHide={() => setShowEmailAccountModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Add Email Account</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleCreateEmailAccount}>
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
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="you@gmail.com"
                  value={emailAccountForm.username}
                  onChange={(e) =>
                    setEmailAccountForm({
                      ...emailAccountForm,
                      username: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password / App Password</Form.Label>
                <Form.Control
                  type="password"
                  value={emailAccountForm.password}
                  onChange={(e) =>
                    setEmailAccountForm({
                      ...emailAccountForm,
                      password: e.target.value,
                    })
                  }
                  required
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
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowEmailAccountModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={creatingEmailAccount}
              >
                {creatingEmailAccount ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  'Add Account'
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* SMTP Profile Modal */}
        <Modal
          show={showSmtpProfileModal}
          onHide={() => setShowSmtpProfileModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Add SMTP Profile</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleCreateSmtpProfile}>
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
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="you@company.com"
                  value={smtpProfileForm.username}
                  onChange={(e) =>
                    setSmtpProfileForm({
                      ...smtpProfileForm,
                      username: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password / App Password</Form.Label>
                <Form.Control
                  type="password"
                  value={smtpProfileForm.password}
                  onChange={(e) =>
                    setSmtpProfileForm({
                      ...smtpProfileForm,
                      password: e.target.value,
                    })
                  }
                  required
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
                variant="primary"
                type="submit"
                disabled={creatingSmtpProfile}
              >
                {creatingSmtpProfile ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  'Add Profile'
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </PageWrapper>
  );
}
