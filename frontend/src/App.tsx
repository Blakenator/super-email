import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from 'react-router';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { SetupWizard } from './pages/setup/SetupWizard';
import { Inbox } from './pages/inbox/Inbox';
import { StarredInbox } from './pages/inbox/StarredInbox';
import { Compose } from './pages/compose/Compose';
import { Settings } from './pages/settings/Settings';
import { Contacts } from './pages/contacts/Contacts';
import { Triage } from './pages/triage';
import { EmailFolder } from './__generated__/graphql';
import { useQuery } from '@apollo/client/react';
import { GET_EMAIL_COUNT_QUERY } from './pages/inbox/queries';
import { PageErrorBoundary } from './core/components/ErrorBoundary';
import { LoadingSpinner } from './core/components';
import { useMailboxSubscription } from './hooks';
import { Sidebar, MobileNavbar } from './components';
import { AppWrapper, MainContent } from './App.wrappers';
import { useEmailStore } from './stores/emailStore';

function AuthenticatedApp() {
  const location = useLocation();
  const { user, logout, updatePreferences } = useAuth();
  const isOnline = useEmailStore((state) => state.isOnline);
  const cachedEmails = useEmailStore((state) => state.emails);
  const hasBanner = !isOnline;

  // Start the mailbox subscription for real-time updates
  useMailboxSubscription();

  const { data: unreadData } = useQuery(GET_EMAIL_COUNT_QUERY, {
    variables: { input: { folder: EmailFolder.Inbox, isRead: false } },
    pollInterval: isOnline ? 30000 : 0, // Don't poll when offline
    fetchPolicy: isOnline ? 'cache-and-network' : 'cache-only',
  });

  // Calculate unread count from server or fall back to cached emails when offline
  const serverUnreadCount = unreadData?.getEmailCount ?? 0;
  const cachedUnreadCount = Object.values(cachedEmails).filter(
    (email) => email.folder === 'INBOX' && !email.isRead,
  ).length;
  const unreadCount =
    serverUnreadCount > 0 ? serverUnreadCount : cachedUnreadCount;
  const isCollapsed = user?.navbarCollapsed ?? false;

  const handleToggleCollapse = async () => {
    try {
      await updatePreferences({ navbarCollapsed: !isCollapsed });
    } catch (error) {
      console.error('Failed to update navbar state:', error);
    }
  };

  const handleLogout = async () => {
    await logout(location.pathname);
  };

  return (
    <AppWrapper $hasBanner={hasBanner}>
      <Sidebar
        user={user}
        isCollapsed={isCollapsed}
        unreadCount={unreadCount}
        onToggleCollapse={handleToggleCollapse}
        onLogout={handleLogout}
      />
      <MainContent>
        <MobileNavbar
          user={user}
          unreadCount={unreadCount}
          onLogout={handleLogout}
        />
        <PageErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/inbox" replace />} />
            {/* Inbox routes with optional account and email params */}
            <Route
              path="/inbox"
              element={<Inbox folder={EmailFolder.Inbox} />}
            />
            <Route
              path="/inbox/account/:accountId"
              element={<Inbox folder={EmailFolder.Inbox} />}
            />
            <Route
              path="/inbox/email/:emailId"
              element={<Inbox folder={EmailFolder.Inbox} />}
            />
            <Route
              path="/inbox/account/:accountId/email/:emailId"
              element={<Inbox folder={EmailFolder.Inbox} />}
            />

            <Route path="/starred" element={<StarredInbox />} />

            {/* Sent routes */}
            <Route path="/sent" element={<Inbox folder={EmailFolder.Sent} />} />
            <Route
              path="/sent/account/:accountId"
              element={<Inbox folder={EmailFolder.Sent} />}
            />
            <Route
              path="/sent/email/:emailId"
              element={<Inbox folder={EmailFolder.Sent} />}
            />
            <Route
              path="/sent/account/:accountId/email/:emailId"
              element={<Inbox folder={EmailFolder.Sent} />}
            />

            {/* Drafts routes */}
            <Route
              path="/drafts"
              element={<Inbox folder={EmailFolder.Drafts} />}
            />
            <Route
              path="/drafts/account/:accountId"
              element={<Inbox folder={EmailFolder.Drafts} />}
            />

            {/* Trash routes */}
            <Route
              path="/trash"
              element={<Inbox folder={EmailFolder.Trash} />}
            />
            <Route
              path="/trash/account/:accountId"
              element={<Inbox folder={EmailFolder.Trash} />}
            />
            <Route
              path="/trash/email/:emailId"
              element={<Inbox folder={EmailFolder.Trash} />}
            />
            <Route
              path="/trash/account/:accountId/email/:emailId"
              element={<Inbox folder={EmailFolder.Trash} />}
            />

            {/* Archive routes */}
            <Route
              path="/archive"
              element={<Inbox folder={EmailFolder.Archive} />}
            />
            <Route
              path="/archive/account/:accountId"
              element={<Inbox folder={EmailFolder.Archive} />}
            />
            <Route
              path="/archive/email/:emailId"
              element={<Inbox folder={EmailFolder.Archive} />}
            />
            <Route
              path="/archive/account/:accountId/email/:emailId"
              element={<Inbox folder={EmailFolder.Archive} />}
            />

            <Route path="/compose" element={<Compose />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/triage" element={<Triage />} />

            {/* Settings routes with tabs */}
            <Route
              path="/settings"
              element={<Navigate to="/settings/accounts" replace />}
            />
            <Route path="/settings/:tab" element={<Settings />} />

            <Route path="*" element={<Navigate to="/inbox" replace />} />
          </Routes>
        </PageErrorBoundary>
      </MainContent>
    </AppWrapper>
  );
}

function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading SuperMail..." />;
  }

  // Public routes
  if (location.pathname === '/login' || location.pathname === '/signup') {
    if (isAuthenticated) {
      const redirectPath = searchParams.get('redirect');
      if (redirectPath) {
        return <Navigate to={redirectPath} replace />;
      }
      if (user?.setupWizardCompletedAt === null) {
        return <Navigate to="/setup" replace />;
      }
      return <Navigate to="/inbox" replace />;
    }
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    );
  }

  // Protected routes - redirect to login with current path for post-login redirect
  if (!isAuthenticated) {
    const currentPath = location.pathname + location.search;
    const redirectTo =
      currentPath !== '/'
        ? `/login?redirect=${encodeURIComponent(currentPath)}`
        : '/login';
    return <Navigate to={redirectTo} replace />;
  }

  if (user?.setupWizardCompletedAt === null) {
    return (
      <Routes>
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  return <AuthenticatedApp />;
}

export default App;
