import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { LOGIN_MUTATION } from './queries';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  border: none;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const Logo = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  text-align: center;
  margin-bottom: 0.5rem;
`;

const Tagline = styled.p`
  color: #6c757d;
  text-align: center;
  margin-bottom: 2rem;
`;

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      login(data.login.token, {
        id: data.login.user.id,
        email: data.login.user.email,
        firstName: data.login.user.firstName,
        lastName: data.login.user.lastName,
      });
      navigate('/inbox');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation({
      variables: {
        input: { email, password },
      },
    });
  };

  return (
    <PageWrapper>
      <Container>
        <LoginCard className="mx-auto">
          <Card.Body className="p-5">
            <Logo>📧 StacksMail</Logo>
            <Tagline>Sign in to your account</Tagline>

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
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  size="lg"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  size="lg"
                />
              </Form.Group>

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
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <p className="text-center text-muted mb-0">
                Don't have an account?{' '}
                <Link to="/signup" style={{ color: '#667eea' }}>
                  Sign up
                </Link>
              </p>
            </Form>
          </Card.Body>
        </LoginCard>
      </Container>
    </PageWrapper>
  );
}
