import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
  Card,
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
  faPlug,
  faSave,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import {
  EMAIL_PROVIDERS,
  SMTP_PORTS,
  type EmailProviderPreset,
  getProviderById,
} from '../../../core/emailProviders';

const ProviderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const ProviderCard = styled.div<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid
    ${({ $selected, theme }) =>
      $selected ? theme.colors.primary : theme.colors.border};
  background: ${({ $selected, theme }) =>
    $selected ? `${theme.colors.primary}10` : 'white'};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}05`};
  }

  .provider-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .provider-name {
    font-size: 0.75rem;
    text-align: center;
    font-weight: 500;
  }
`;

const InstructionsCard = styled(Card)`
  background: ${({ theme }) => `${theme.colors.info}10`};
  border: 1px solid ${({ theme }) => `${theme.colors.info}30`};
  margin-bottom: 1rem;
`;

const TestResult = styled.div<{ $success: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  background: ${({ $success }) => ($success ? '#d4edda' : '#f8d7da')};
  color: ${({ $success }) => ($success ? '#155724' : '#721c24')};
  font-size: 0.875rem;
`;

export interface SmtpProfileFormData {
  name: string;
  email: string;
  alias: string;
  host: string;
  port: number;
  username: string;
  password: string;
  useSsl: boolean;
  isDefault: boolean;
  providerId: string;
}

const defaultFormData: SmtpProfileFormData = {
  name: '',
  email: '',
  alias: '',
  host: '',
  port: 587,
  username: '',
  password: '',
  useSsl: false,
  isDefault: false,
  providerId: 'custom',
};

interface SmtpProfileFormProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: SmtpProfileFormData) => void;
  onTest: (data: SmtpProfileFormData) => Promise<{ success: boolean; message: string }>;
  editingProfile?: {
    id: string;
    name: string;
    email: string;
    alias?: string | null;
    host: string;
    port: number;
    useSsl: boolean;
    isDefault: boolean;
    providerId?: string | null;
  } | null;
  isSubmitting: boolean;
  isTesting: boolean;
  testResult: { success: boolean; message: string } | null;
}

export function SmtpProfileForm({
  show,
  onHide,
  onSubmit,
  onTest,
  editingProfile,
  isSubmitting,
  isTesting,
  testResult,
}: SmtpProfileFormProps) {
  const [formData, setFormData] = useState<SmtpProfileFormData>(defaultFormData);

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      if (editingProfile) {
        setFormData({
          name: editingProfile.name,
          email: editingProfile.email,
          alias: editingProfile.alias || '',
          host: editingProfile.host,
          port: editingProfile.port,
          username: editingProfile.email,
          password: '',
          useSsl: editingProfile.useSsl,
          isDefault: editingProfile.isDefault,
          providerId: editingProfile.providerId || 'custom',
        });
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [show, editingProfile]);

  const handleProviderSelect = (provider: EmailProviderPreset) => {
    setFormData((prev) => ({
      ...prev,
      providerId: provider.id,
      host: provider.smtp.host,
      port: provider.smtp.port,
      useSsl: provider.smtp.useSsl,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleTest = () => {
    onTest(formData);
  };

  const selectedProvider = getProviderById(formData.providerId) || EMAIL_PROVIDERS.find((p) => p.id === 'custom')!;
  const showInstructions = formData.providerId !== 'custom' && selectedProvider.instructions;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProfile ? 'Edit SMTP Profile' : 'Add SMTP Profile'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Provider Selection */}
          <Form.Group className="mb-3">
            <Form.Label>Email Provider</Form.Label>
            <ProviderGrid>
              {EMAIL_PROVIDERS.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  $selected={formData.providerId === provider.id}
                  onClick={() => handleProviderSelect(provider)}
                >
                  <FontAwesomeIcon
                    icon={provider.icon}
                    className="provider-icon"
                    style={{ color: provider.iconColor }}
                  />
                  <span className="provider-name">{provider.name}</span>
                </ProviderCard>
              ))}
            </ProviderGrid>
          </Form.Group>

          {/* Provider Instructions */}
          {showInstructions && (
            <InstructionsCard>
              <Card.Body className="py-2 px-3">
                <small className="d-flex align-items-start gap-2">
                  <FontAwesomeIcon icon={faInfoCircle} className="mt-1" />
                  <span>{selectedProvider.instructions}</span>
                </small>
              </Card.Body>
            </InstructionsCard>
          )}

          {/* Test Result */}
          {testResult && (
            <TestResult $success={testResult.success}>
              <FontAwesomeIcon
                icon={testResult.success ? faCheckCircle : faTimesCircle}
              />
              {testResult.message}
            </TestResult>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Profile Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Work Gmail"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                      username: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Alias (Optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Display name, e.g., John Doe"
              value={formData.alias}
              onChange={(e) =>
                setFormData({ ...formData, alias: e.target.value })
              }
            />
            <Form.Text className="text-muted">
              This name will appear as the sender in outgoing emails.
            </Form.Text>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>SMTP Server</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="smtp.example.com"
                  value={formData.host}
                  onChange={(e) =>
                    setFormData({ ...formData, host: e.target.value })
                  }
                  required
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Port</Form.Label>
                <Form.Select
                  value={formData.port}
                  onChange={(e) =>
                    setFormData({ ...formData, port: parseInt(e.target.value) })
                  }
                >
                  {SMTP_PORTS.map((port) => (
                    <option key={port} value={port}>
                      {port}{' '}
                      {port === 587
                        ? '(STARTTLS)'
                        : port === 465
                          ? '(SSL)'
                          : port === 25
                            ? '(Plain)'
                            : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>SSL/TLS</Form.Label>
                <Form.Select
                  value={formData.useSsl ? 'true' : 'false'}
                  onChange={(e) =>
                    setFormData({ ...formData, useSsl: e.target.value === 'true' })
                  }
                >
                  <option value="true">SSL/TLS</option>
                  <option value="false">STARTTLS / None</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Usually your email address"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  {editingProfile ? 'Password (leave blank to keep)' : 'Password'}
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="App password or account password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingProfile}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Set as default sending profile"
              checked={formData.isDefault}
              onChange={(e) =>
                setFormData({ ...formData, isDefault: e.target.checked })
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button
            variant="outline-primary"
            onClick={handleTest}
            disabled={isTesting || !formData.host || !formData.username}
          >
            {isTesting ? (
              <>
                <Spinner size="sm" className="me-1" /> Testing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlug} className="me-1" /> Test
              </>
            )}
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="me-1" /> Saving...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="me-1" />
                {editingProfile ? 'Update' : 'Add Profile'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
