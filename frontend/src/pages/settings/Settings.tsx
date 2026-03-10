import { useEffect } from 'react';
import { Container, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router';
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
  const { user, logout } = useAuth();

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

        <AppVersion>v{__APP_VERSION__}</AppVersion>
      </Container>
    </PageWrapper>
  );
}
