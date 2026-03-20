import { useCallback, useEffect, useState } from 'react';
import { Container, Button, Alert, Modal, Tabs, Tab } from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faInbox,
  faPaperPlane,
  faShieldAlt,
  faTag,
  faFilter,
  faBell,
  faPalette,
  faSignOutAlt,
  faCreditCard,
  faGlobe,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { PageWrapper } from '../../core/components';
import {
  EmailAccountForm,
  SmtpProfileForm,
  DomainSettings,
  TagsManager,
  MailRulesManager,
  NotificationSettings,
  ThemeSettings,
  BillingSettings,
  AppInformation,
  EmailAccountsTab,
  SendProfilesTab,
  AuthMethodsTab,
} from './components';
import {
  useEmailAccounts,
  useSendProfiles,
  useAuthMethods,
  useCustomDomains,
} from './hooks';
import {
  Header,
  Title,
  UserInfo,
  Avatar,
  ResponsiveTabsWrapper,
  AppVersion,
} from './Settings.wrappers';

const TAB_MAPPING: Record<string, string> = {
  accounts: 'email-accounts',
  smtp: 'smtp-profiles',
  domains: 'custom-domains',
  auth: 'auth-methods',
  tags: 'tags',
  rules: 'rules',
  notifications: 'notifications',
  appearance: 'appearance',
  billing: 'billing',
  about: 'app-info',
};

const REVERSE_TAB_MAPPING = Object.fromEntries(
  Object.entries(TAB_MAPPING).map(([k, v]) => [v, k]),
);

export function Settings() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout, token } = useAuth();
  const [oauthResultModal, setOauthResultModal] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({ show: false, success: false, message: '' });

  const activeTab =
    tab && TAB_MAPPING[tab] ? TAB_MAPPING[tab] : 'email-accounts';

  const handleTabSelect = (key: string | null) => {
    if (key) {
      const urlTab = REVERSE_TAB_MAPPING[key] || 'accounts';
      void navigate(`/settings/${urlTab}`, { replace: true });
    }
  };

  const emailAccounts = useEmailAccounts();
  const customDomains = useCustomDomains();
  const sendProfiles = useSendProfiles(customDomains.domains);
  const authMethods = useAuthMethods();

  // Handle OAuth redirect result query params
  useEffect(() => {
    const oauthStatus = searchParams.get('oauth');
    if (!oauthStatus) return;

    if (oauthStatus === 'success') {
      const isReauth = searchParams.get('reauth') === 'true';
      setOauthResultModal({
        show: true,
        success: true,
        message: isReauth
          ? 'Account re-authenticated successfully.'
          : 'Email account connected successfully. Your IMAP and SMTP settings have been configured automatically.',
      });
      void emailAccounts.refetch();
      void sendProfiles.refetch();
    } else if (oauthStatus === 'error') {
      const reason = searchParams.get('reason') || 'unknown';
      const reasonMessages: Record<string, string> = {
        denied: 'You denied the authorization request.',
        access_denied: 'You denied the authorization request.',
        missing_token: 'Authentication token was missing. Please try again.',
        invalid_token: 'Authentication token was invalid. Please sign in again.',
        invalid_state: 'Security check failed. Please try again.',
        provider_mismatch: 'Provider mismatch detected. Please try again.',
        callback_failed: 'Failed to complete the OAuth flow. Please try again.',
        start_failed: 'Failed to start the OAuth flow. Please try again.',
        account_already_connected: 'This email account is already connected. To refresh its credentials, use the Re-authenticate button on the existing account.',
      };
      setOauthResultModal({
        show: true,
        success: false,
        message: reasonMessages[reason] || `OAuth connection failed: ${reason}`,
      });
    }

    // Clear query params
    searchParams.delete('oauth');
    searchParams.delete('reason');
    searchParams.delete('reauth');
    setSearchParams(searchParams, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReauth = useCallback(
    (accountId: string) => {
      if (!token) return;
      const account = emailAccounts.accounts.find((a) => a.id === accountId);
      if (!account) return;
      const providerMap: Record<string, string> = {
        OAUTH_GOOGLE: 'google',
        OAUTH_YAHOO: 'yahoo',
        OAUTH_OUTLOOK: 'outlook',
      };
      const oauthProvider = providerMap[account.authMethod];
      if (!oauthProvider) return;
      const oauthUrl = `${window.location.origin}/api/oauth/${oauthProvider}/start?token=${encodeURIComponent(token)}&accountId=${encodeURIComponent(accountId)}`;
      window.location.href = oauthUrl;
    },
    [token, emailAccounts.accounts],
  );

  // Open SMTP modal when email account is created with "also create SMTP" checked
  useEffect(() => {
    if (emailAccounts.pendingSmtpData) {
      sendProfiles.openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailAccounts.pendingSmtpData]);

  const error = emailAccounts.error || sendProfiles.error;
  const clearError = () => {
    emailAccounts.setError(null);
    sendProfiles.setError(null);
  };

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
          <Alert variant="danger" dismissible onClose={clearError}>
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
                  Email Accounts
                </>
              }
            >
              <EmailAccountsTab
                accounts={emailAccounts.accounts}
                loading={emailAccounts.loading}
                syncingAll={emailAccounts.syncingAll}
                showDeleteModal={emailAccounts.showDeleteModal}
                deletingAccount={emailAccounts.deletingAccount}
                deleting={emailAccounts.deleting}
                onAddAccount={emailAccounts.openCreate}
                onEditAccount={emailAccounts.openEdit}
                onSyncAccount={emailAccounts.handleSync}
                onDeleteAccount={emailAccounts.openDelete}
                onSyncAll={emailAccounts.handleSyncAll}
                onConfirmDelete={emailAccounts.confirmDelete}
                onCancelDelete={emailAccounts.closeDeleteModal}
                onReauth={handleReauth}
              />
            </Tab>

            <Tab
              eventKey="smtp-profiles"
              title={
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="me-1" />
                  Send Profiles
                </>
              }
            >
              <SendProfilesTab
                profiles={sendProfiles.profiles}
                loading={sendProfiles.loading}
                onAddProfile={sendProfiles.openCreate}
                onEditProfile={sendProfiles.openEdit}
                onDeleteProfile={sendProfiles.handleDelete}
              />
            </Tab>

            <Tab
              eventKey="custom-domains"
              title={
                <>
                  <FontAwesomeIcon icon={faGlobe} className="me-1" />
                  Domains
                </>
              }
            >
              <DomainSettings />
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
              <AuthMethodsTab
                methods={authMethods.methods}
                loading={authMethods.loading}
                deleting={authMethods.deleting}
                onDelete={authMethods.handleDelete}
              />
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

            <Tab
              eventKey="app-info"
              title={
                <>
                  <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                  App Information
                </>
              }
            >
              <AppInformation />
            </Tab>
          </Tabs>
        </ResponsiveTabsWrapper>

        <EmailAccountForm
          show={emailAccounts.showModal}
          onHide={emailAccounts.closeModal}
          onSubmit={emailAccounts.handleSubmit}
          onTest={emailAccounts.handleTest}
          editingAccount={emailAccounts.editingAccount}
          smtpProfiles={sendProfiles.profiles}
          isSubmitting={emailAccounts.creating}
          isTesting={emailAccounts.testing}
          testResult={emailAccounts.testResult}
          customDomains={customDomains.domains}
          onCreateCustomDomainAccount={(data) =>
            void customDomains.handleCreateAccount(data, () => {
              emailAccounts.closeModal();
              void emailAccounts.refetch();
              void sendProfiles.refetch();
            })
          }
          isCreatingCustomDomainAccount={customDomains.creatingAccount}
        />

        <SmtpProfileForm
          show={sendProfiles.showModal}
          onHide={() => {
            sendProfiles.closeModal();
            emailAccounts.setPendingSmtpData(null);
          }}
          onSubmit={(formData) => {
            sendProfiles.handleSubmit(formData);
            emailAccounts.setPendingSmtpData(null);
          }}
          onTest={sendProfiles.handleTest}
          editingProfile={sendProfiles.editingProfile}
          initialData={emailAccounts.pendingSmtpData}
          isSubmitting={sendProfiles.creating}
          isTesting={sendProfiles.testing}
          testResult={sendProfiles.testResult}
          customDomains={customDomains.domains}
          onCreateCustomDomainSendProfile={
            sendProfiles.handleCreateCustomDomainProfile
          }
          isCreatingCustomDomainSendProfile={sendProfiles.creatingCustomDomain}
        />

        <Modal
          show={oauthResultModal.show}
          onHide={() => setOauthResultModal((prev) => ({ ...prev, show: false }))}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {oauthResultModal.success ? 'Account Connected' : 'Connection Failed'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant={oauthResultModal.success ? 'success' : 'danger'} className="mb-0">
              {oauthResultModal.message}
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant={oauthResultModal.success ? 'primary' : 'secondary'}
              onClick={() => setOauthResultModal((prev) => ({ ...prev, show: false }))}
            >
              OK
            </Button>
          </Modal.Footer>
        </Modal>

        <AppVersion>v{__APP_VERSION__}</AppVersion>
      </Container>
    </PageWrapper>
  );
}
