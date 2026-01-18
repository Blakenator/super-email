import { useState } from 'react';
import {
  Container,
  Form,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
  Card,
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { PasswordInput } from '../../core/components/PasswordInput';
import { PageWrapper, SignUpCard, Logo, Tagline } from './auth.wrappers';

export function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, firstName, lastName);
      navigate('/inbox');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Container>
        <SignUpCard className="mx-auto">
          <Card.Body className="p-5">
            <Logo>
              <FontAwesomeIcon icon={faEnvelope} className="me-2" />
              StacksMail
            </Logo>
            <Tagline>Create your account</Tagline>

            {error && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="Create a password"
                label="Password"
                required
                className="mb-3"
              />

              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm your password"
                label="Confirm Password"
                required
                className="mb-4"
              />

              <Button
                variant="primary"
                type="submit"
                size="lg"
                className="w-100 mb-3"
                disabled={loading}
                style={{
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                }}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <p className="text-center text-muted mb-0">
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#667eea' }}>
                  Sign in
                </Link>
              </p>
            </Form>
          </Card.Body>
        </SignUpCard>
      </Container>
    </PageWrapper>
  );
}
