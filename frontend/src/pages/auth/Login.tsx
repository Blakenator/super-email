import { useState } from 'react';
import { Container, Form, Button, Alert, Spinner, Card } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faWifi,
  faTimes,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { PasswordInput } from '../../core/components/PasswordInput';
import {
  PageWrapper,
  AuthCard as LoginCard,
  Logo,
  Tagline,
  SavedUsersSection,
  SavedUsersList,
  SavedUserItem,
  SavedUserAvatar,
  SavedUserInfo,
  SavedUserName,
  SavedUserEmail,
  SavedUserRemove,
  Divider,
  RememberMeRow,
  OfflineNotice,
} from './auth.wrappers';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(false);
  const { login, savedUsers, removeSavedUser, isOffline } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get redirect path from URL params (set when session expired)
  const redirectPath = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      // Navigate to the redirect path if set, otherwise inbox
      navigate(redirectPath || '/inbox');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSavedUserClick = (savedUserEmail: string) => {
    setEmail(savedUserEmail);
    setShowLoginForm(true);
    setRememberMe(true);
    setIsEmailReadOnly(true);
  };

  const handleRemoveSavedUser = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    removeSavedUser(userId);
  };

  const getInitials = (
    firstName?: string | null,
    lastName?: string | null,
    email?: string,
  ) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const getDisplayName = (
    firstName?: string | null,
    lastName?: string | null,
    email?: string,
  ) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    return email || 'Unknown User';
  };

  const hasSavedUsers = savedUsers.length > 0;
  const shouldShowSavedUsers = hasSavedUsers && !showLoginForm;

  return (
    <PageWrapper>
      <Container>
        <LoginCard className="mx-auto">
          <Card.Body className="p-5">
            <Logo>
              <FontAwesomeIcon icon={faEnvelope} className="me-2" />
              StacksMail
            </Logo>
            <Tagline>
              {shouldShowSavedUsers
                ? 'Choose an account'
                : 'Sign in to your account'}
            </Tagline>

            {isOffline && (
              <OfflineNotice>
                <FontAwesomeIcon icon={faWifi} />
                You're offline. Sign in requires an internet connection.
              </OfflineNotice>
            )}

            {error && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {shouldShowSavedUsers && (
              <>
                <SavedUsersSection>
                  <SavedUsersList>
                    {savedUsers.map((savedUser) => (
                      <SavedUserItem
                        key={savedUser.id}
                        onClick={() => handleSavedUserClick(savedUser.email)}
                      >
                        <SavedUserAvatar>
                          {getInitials(
                            savedUser.firstName,
                            savedUser.lastName,
                            savedUser.email,
                          )}
                        </SavedUserAvatar>
                        <SavedUserInfo>
                          <SavedUserName>
                            {getDisplayName(
                              savedUser.firstName,
                              savedUser.lastName,
                              savedUser.email,
                            )}
                          </SavedUserName>
                          <SavedUserEmail>{savedUser.email}</SavedUserEmail>
                        </SavedUserInfo>
                        <SavedUserRemove
                          onClick={(e) =>
                            handleRemoveSavedUser(e, savedUser.id)
                          }
                          title="Remove from saved accounts"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </SavedUserRemove>
                      </SavedUserItem>
                    ))}
                  </SavedUsersList>
                </SavedUsersSection>

                <Divider>
                  <span>or</span>
                </Divider>

                <Button
                  variant="link"
                  size="lg"
                  className="w-100 mb-3"
                  onClick={() => setShowLoginForm(true)}
                  style={{ textDecoration: 'none' }}
                >
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Use another account
                </Button>
              </>
            )}

            {(!hasSavedUsers || showLoginForm) && (
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    size="lg"
                    autoFocus={showLoginForm && !isEmailReadOnly}
                    readOnly={isEmailReadOnly}
                    disabled={isEmailReadOnly}
                  />
                </Form.Group>

                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter your password"
                  label="Password"
                  required
                  size="lg"
                  className="mb-3"
                />

                <RememberMeRow>
                  <Form.Check
                    type="checkbox"
                    id="rememberMe"
                    label="Remember me on this device"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                </RememberMeRow>

                <Button
                  variant="primary"
                  type="submit"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={loading || isOffline}
                  style={{
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                  }}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                {showLoginForm && hasSavedUsers && (
                  <Button
                    variant="link"
                    className="w-100 mb-2"
                    onClick={() => {
                      setShowLoginForm(false);
                      setEmail('');
                      setPassword('');
                      setIsEmailReadOnly(false);
                    }}
                  >
                    ← Back to saved accounts
                  </Button>
                )}

                <p className="text-center text-muted mb-0">
                  Don't have an account?{' '}
                  <Link to="/signup" style={{ color: '#667eea' }}>
                    Sign up
                  </Link>
                </p>
              </Form>
            )}
          </Card.Body>
        </LoginCard>
      </Container>
    </PageWrapper>
  );
}
