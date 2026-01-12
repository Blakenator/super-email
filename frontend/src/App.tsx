import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { Nav, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router';
import styled from 'styled-components';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { Inbox } from './pages/inbox/Inbox';
import { Compose } from './pages/compose/Compose';
import { Settings } from './pages/settings/Settings';
import { EmailFolder } from './__generated__/graphql';
import { useQuery } from '@apollo/client/react';
import { GET_EMAIL_COUNT_QUERY } from './pages/inbox/queries';
import { PageErrorBoundary } from './components/ErrorBoundary';

const AppWrapper = styled.div`
  display: flex;
  height: 100vh;
  background: var(--background-color);
`;

const Sidebar = styled.div`
  width: 240px;
  background: white;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  padding: 0.5rem 1.5rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
`;

const ComposeButton = styled(Button)`
  margin: 0 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 24px !important;
  padding: 0.75rem 1.5rem !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:hover {
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
    transform: translateY(-1px);
  }
`;

const NavSection = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const StyledNavLink = styled(Nav.Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem !important;
  color: ${(props) => (props.$active ? '#667eea' : 'var(--text-primary)')} !important;
  background: ${(props) => (props.$active ? '#e8f0fe' : 'transparent')};
  font-weight: ${(props) => (props.$active ? '600' : '400')};
  border-radius: 0 24px 24px 0;
  margin-right: 0.75rem;
  transition: all 0.15s ease;

  &:hover {
    background: var(--hover-bg);
  }
`;

const NavIcon = styled.span`
  margin-right: 0.75rem;
  font-size: 1.1rem;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

function AuthenticatedApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: unreadData } = useQuery(GET_EMAIL_COUNT_QUERY, {
    variables: { input: { folder: EmailFolder.Inbox, isRead: false } },
    pollInterval: 30000,
  });

  const unreadCount = unreadData?.getEmailCount ?? 0;

  const navItems = [
    {
      path: '/inbox',
      label: 'Inbox',
      icon: '📥',
      folder: EmailFolder.Inbox,
      showBadge: true,
    },
    { path: '/starred', label: 'Starred', icon: '⭐', folder: undefined },
    { path: '/sent', label: 'Sent', icon: '📤', folder: EmailFolder.Sent },
    {
      path: '/drafts',
      label: 'Drafts',
      icon: '📝',
      folder: EmailFolder.Drafts,
    },
    { path: '/trash', label: 'Trash', icon: '🗑️', folder: EmailFolder.Trash },
  ];

  return (
    <AppWrapper>
      <Sidebar>
        <Logo>📧 StacksMail</Logo>

        <ComposeButton onClick={() => navigate('/compose')}>
          ✏️ Compose
        </ComposeButton>

        <NavSection>
          <Nav className="flex-column">
            {navItems.map((item) => (
              <Nav.Item key={item.path}>
                <StyledNavLink
                  as={Link}
                  to={item.path}
                  $active={location.pathname === item.path}
                >
                  <span>
                    <NavIcon>{item.icon}</NavIcon>
                    {item.label}
                  </span>
                  {item.showBadge && unreadCount > 0 && (
                    <Badge bg="primary" pill>
                      {unreadCount}
                    </Badge>
                  )}
                </StyledNavLink>
              </Nav.Item>
            ))}
          </Nav>

          <hr style={{ margin: '1rem' }} />

          <Nav className="flex-column">
            <Nav.Item>
              <StyledNavLink
                as={Link}
                to="/settings"
                $active={location.pathname === '/settings'}
              >
                <span>
                  <NavIcon>⚙️</NavIcon>
                  Settings
                </span>
              </StyledNavLink>
            </Nav.Item>
          </Nav>
        </NavSection>
      </Sidebar>

      <MainContent>
        <PageErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/inbox" replace />} />
            <Route
              path="/inbox"
              element={<Inbox folder={EmailFolder.Inbox} />}
            />
            <Route
              path="/starred"
              element={<Inbox folder={EmailFolder.Inbox} />}
            />
            <Route path="/sent" element={<Inbox folder={EmailFolder.Sent} />} />
            <Route
              path="/drafts"
              element={<Inbox folder={EmailFolder.Drafts} />}
            />
            <Route
              path="/trash"
              element={<Inbox folder={EmailFolder.Trash} />}
            />
            <Route path="/compose" element={<Compose />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/inbox" replace />} />
          </Routes>
        </PageErrorBoundary>
      </MainContent>
    </AppWrapper>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div style={{ color: 'white', fontSize: '2rem' }}>📧 Loading...</div>
      </div>
    );
  }

  // Public routes
  if (location.pathname === '/login' || location.pathname === '/signup') {
    if (isAuthenticated) {
      return <Navigate to="/inbox" replace />;
    }
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    );
  }

  // Protected routes
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AuthenticatedApp />;
}

export default App;
