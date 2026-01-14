import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Button,
  Spinner,
  Row,
  Col,
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
  faPlug,
  faSave,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import {
  EMAIL_PROVIDERS,
  IMAP_PORTS,
  type EmailProviderPreset,
  getProviderById,
} from '../../../core/emailProviders';
import { EmailAccountType } from '../../../__generated__/graphql';
import {
  ProviderGrid,
  ProviderCard,
  InstructionsCard,
  TestResult,
} from './EmailAccountForm.wrappers';

export interface EmailAccountFormData {
  name: string;
  email: string;
  host: string;
  port: number;
  username: string;
  password: string;
  accountType: EmailAccountType;
  useSsl: boolean;
  defaultSmtpProfileId: string;
  providerId: string;
  isDefault: boolean;
}

const defaultFormData: EmailAccountFormData = {
  name: '',
  email: '',
  host: '',
  port: 993,
  username: '',
  password: '',
  accountType: EmailAccountType.Imap,
  useSsl: true,
  defaultSmtpProfileId: '',
  providerId: 'custom',
  isDefault: false,
};

interface SmtpProfile {
  id: string;
  name: string;
  email: string;
  alias?: string | null;
}

interface EmailAccountFormProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: EmailAccountFormData) => void;
  onTest: (data: EmailAccountFormData) => Promise<{ success: boolean; message: string }>;
  editingAccount?: {
    id: string;
    name: string;
    email: string;
    host: string;
    port: number;
    useSsl: boolean;
    defaultSmtpProfileId?: string | null;
    providerId?: string | null;
    isDefault?: boolean;
  } | null;
  smtpProfiles: SmtpProfile[];
  isSubmitting: boolean;
  isTesting: boolean;
  testResult: { success: boolean; message: string } | null;
}

export function EmailAccountForm({
  show,
  onHide,
  onSubmit,
  onTest,
  editingAccount,
  smtpProfiles,
  isSubmitting,
  isTesting,
  testResult,
}: EmailAccountFormProps) {
  const [formData, setFormData] = useState<EmailAccountFormData>(defaultFormData);

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      if (editingAccount) {
        setFormData({
          name: editingAccount.name,
          email: editingAccount.email,
          host: editingAccount.host,
          port: editingAccount.port,
          username: editingAccount.email,
          password: '',
          accountType: EmailAccountType.Imap,
          useSsl: editingAccount.useSsl,
          defaultSmtpProfileId: editingAccount.defaultSmtpProfileId || '',
          providerId: editingAccount.providerId || 'custom',
          isDefault: editingAccount.isDefault || false,
        });
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [show, editingAccount]);

  const handleProviderSelect = (provider: EmailProviderPreset) => {
    setFormData((prev) => ({
      ...prev,
      providerId: provider.id,
      host: provider.imap.host,
      port: provider.imap.port,
      useSsl: provider.imap.useSsl,
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
            {editingAccount ? 'Edit Email Account' : 'Add Email Account'}
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
                <Form.Label>Account Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Personal Gmail"
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

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>IMAP Server</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="imap.example.com"
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
                  {IMAP_PORTS.map((port) => (
                    <option key={port} value={port}>
                      {port} {port === 993 ? '(SSL)' : port === 143 ? '(Plain)' : ''}
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
                  <option value="false">None</option>
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
                  {editingAccount ? 'Password (leave blank to keep)' : 'Password'}
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="App password or account password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingAccount}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Default SMTP Profile (for sending)</Form.Label>
            <Form.Select
              value={formData.defaultSmtpProfileId}
              onChange={(e) =>
                setFormData({ ...formData, defaultSmtpProfileId: e.target.value })
              }
            >
              <option value="">None</option>
              {smtpProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.alias || profile.email})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="isDefault"
              label="Set as default account for composing new emails"
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
                {editingAccount ? 'Update' : 'Add Account'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
