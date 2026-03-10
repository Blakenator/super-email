import { Button, Card, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faKey, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import {
  faGoogle,
  faGithub,
  faApple,
  faMicrosoft,
} from '@fortawesome/free-brands-svg-icons';
import { AuthProvider } from '../../../__generated__/graphql';
import {
  SectionCard,
  AuthMethodCard,
  AuthMethodIcon,
  AuthMethodInfo,
  AuthMethodName,
  AuthMethodEmail,
  AuthMethodMeta,
} from '../Settings.wrappers';

const PROVIDER_ICONS = {
  [AuthProvider.Google]: faGoogle,
  [AuthProvider.Github]: faGithub,
  [AuthProvider.Apple]: faApple,
  [AuthProvider.Microsoft]: faMicrosoft,
} as const;

const PROVIDER_NAMES = {
  [AuthProvider.EmailPassword]: 'Email & Password',
  [AuthProvider.Google]: 'Google',
  [AuthProvider.Github]: 'GitHub',
  [AuthProvider.Apple]: 'Apple',
  [AuthProvider.Microsoft]: 'Microsoft',
} as const;

function getProviderIcon(provider: AuthProvider) {
  return PROVIDER_ICONS[provider as keyof typeof PROVIDER_ICONS] ?? faKey;
}

function getProviderName(provider: AuthProvider) {
  return PROVIDER_NAMES[provider as keyof typeof PROVIDER_NAMES] ?? provider;
}

interface AuthMethodsTabProps {
  methods: any[];
  loading: boolean;
  deleting: boolean;
  onDelete: (id: string) => void;
}

export function AuthMethodsTab({
  methods,
  loading,
  deleting,
  onDelete,
}: AuthMethodsTabProps) {
  return (
    <SectionCard className="card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Authentication Methods</h5>
        </div>
        <p className="text-muted mb-4">
          Manage the ways you can sign in to your account. You can link multiple
          email addresses or social accounts.
        </p>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" />
          </div>
        ) : methods.length === 0 ? (
          <Alert variant="warning">
            No authentication methods found. This may indicate an issue with
            your account.
          </Alert>
        ) : (
          <>
            {methods.map((method) => (
              <AuthMethodCard key={method.id}>
                <AuthMethodIcon $provider={method.provider}>
                  <FontAwesomeIcon icon={getProviderIcon(method.provider)} />
                </AuthMethodIcon>
                <AuthMethodInfo>
                  <AuthMethodName>
                    {getProviderName(method.provider)}
                  </AuthMethodName>
                  <AuthMethodEmail>{method.email}</AuthMethodEmail>
                  <AuthMethodMeta>
                    Added{' '}
                    {method.createdAt
                      ? new Date(method.createdAt).toLocaleDateString()
                      : 'Unknown'}
                    {method.lastUsedAt && (
                      <>
                        {' · '}Last used{' '}
                        {new Date(method.lastUsedAt).toLocaleDateString()}
                      </>
                    )}
                  </AuthMethodMeta>
                </AuthMethodInfo>
                {methods.length > 1 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete(method.id)}
                    disabled={deleting}
                  >
                    <FontAwesomeIcon icon={faTrash} className="me-1" />
                    Remove
                  </Button>
                )}
              </AuthMethodCard>
            ))}

            <Alert variant="info" className="mt-4">
              <FontAwesomeIcon icon={faShieldAlt} className="me-2" />
              <strong>Coming Soon:</strong> Link additional sign-in methods like
              Google, GitHub, Apple, or Microsoft to your account.
            </Alert>
          </>
        )}
      </Card.Body>
    </SectionCard>
  );
}
