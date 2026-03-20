import { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Row, Col, Card, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
  faPlug,
  faSave,
  faInfoCircle,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import {
  EMAIL_PROVIDERS,
  SMTP_PORTS,
  type EmailProviderPreset,
  getProviderById,
} from '../../../core/emailProviders';
import {
  ProviderGrid,
  ProviderCard,
  InstructionsCard,
  TestResult,
} from './SmtpProfileForm.wrappers';
import type { CustomDomainOption } from './EmailAccountForm';

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

export interface CustomDomainSendProfileData {
  customDomainId: string;
  localPart: string;
  name?: string;
  alias?: string;
}

interface SmtpProfileFormProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: SmtpProfileFormData) => void;
  onTest: (
    data: SmtpProfileFormData,
  ) => Promise<{ success: boolean; message: string }>;
  editingProfile?: {
    id: string;
    name: string;
    email: string;
    alias?: string | null;
    type?: string;
    isDefault: boolean;
    providerId?: string | null;
    authMethod?: string;
    smtpSettings?: {
      host: string;
      port: number;
      useSsl: boolean;
    } | null;
  } | null;
  /** Initial data for pre-filling the form (e.g., from email account creation) */
  initialData?: {
    name: string;
    email: string;
    providerId: string;
    password?: string;
  } | null;
  isSubmitting: boolean;
  isTesting: boolean;
  testResult: { success: boolean; message: string } | null;
  customDomains?: CustomDomainOption[];
  onCreateCustomDomainSendProfile?: (data: CustomDomainSendProfileData) => void;
  isCreatingCustomDomainSendProfile?: boolean;
}

export function SmtpProfileForm({
  show,
  onHide,
  onSubmit,
  onTest,
  editingProfile,
  initialData,
  isSubmitting,
  isTesting,
  testResult,
  customDomains,
  onCreateCustomDomainSendProfile,
  isCreatingCustomDomainSendProfile,
}: SmtpProfileFormProps) {
  const [formData, setFormData] =
    useState<SmtpProfileFormData>(defaultFormData);
  const [activeTab, setActiveTab] = useState<string>('smtp');
  const [cdLocalPart, setCdLocalPart] = useState('');
  const [cdDisplayName, setCdDisplayName] = useState('');
  const [cdAlias, setCdAlias] = useState('');
  const [cdDomainId, setCdDomainId] = useState('');

  const verifiedDomains = (customDomains ?? []).filter(
    (d) => d.status === 'VERIFIED',
  );
  const showTabs = !editingProfile && !initialData && verifiedDomains.length > 0;

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      if (editingProfile) {
        setFormData({
          name: editingProfile.name,
          email: editingProfile.email,
          alias: editingProfile.alias || '',
          host: editingProfile.smtpSettings?.host || '',
          port: editingProfile.smtpSettings?.port || 587,
          username: editingProfile.email,
          password: '',
          useSsl: editingProfile.smtpSettings?.useSsl ?? false,
          isDefault: editingProfile.isDefault,
          providerId: editingProfile.providerId || 'custom',
        });
        setActiveTab('smtp');
      } else if (initialData) {
        const provider = getProviderById(initialData.providerId);
        setFormData({
          name: initialData.name,
          email: initialData.email,
          alias: initialData.name,
          host: provider?.smtp.host || '',
          port: provider?.smtp.port || 587,
          username: initialData.email,
          password: initialData.password || '',
          useSsl: provider?.smtp.useSsl ?? false,
          isDefault: false,
          providerId: initialData.providerId,
        });
        setActiveTab('smtp');
      } else {
        setFormData(defaultFormData);
        setActiveTab('smtp');
        setCdLocalPart('');
        setCdDisplayName('');
        setCdAlias('');
        setCdDomainId(verifiedDomains[0]?.id ?? '');
      }
    }
  }, [show, editingProfile, initialData]);

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
    void onTest(formData);
  };

  const selectedProvider =
    getProviderById(formData.providerId) ||
    EMAIL_PROVIDERS.find((p) => p.id === 'custom')!;
  const showInstructions =
    formData.providerId !== 'custom' && selectedProvider.instructions;

  const handleCustomDomainSubmit = () => {
    if (onCreateCustomDomainSendProfile && cdDomainId && cdLocalPart.trim()) {
      onCreateCustomDomainSendProfile({
        customDomainId: cdDomainId,
        localPart: cdLocalPart.trim(),
        name: cdDisplayName.trim() || undefined,
        alias: cdAlias.trim() || undefined,
      });
    }
  };

  const isCustomDomainTab = activeTab === 'custom-domain';
  const isEditingCustomDomain = editingProfile?.type === 'CUSTOM_DOMAIN';

  const smtpForm = (
    <>
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
        <InstructionsCard className="card">
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
                setFormData({
                  ...formData,
                  useSsl: e.target.value === 'true',
                })
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
              {editingProfile
                ? 'Password (leave blank to keep)'
                : 'Password'}
            </Form.Label>
            <Form.Control
              type="password"
              placeholder="App password or account password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required={!editingProfile}
              autoComplete="off"
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          id="smtp-isDefault"
          label="Set as default sending profile"
          checked={formData.isDefault}
          onChange={(e) =>
            setFormData({ ...formData, isDefault: e.target.checked })
          }
        />
      </Form.Group>
    </>
  );

  const customDomainCreateForm = (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Domain</Form.Label>
        <Form.Select
          value={cdDomainId}
          onChange={(e) => setCdDomainId(e.target.value)}
        >
          {verifiedDomains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.domain}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Email Address</Form.Label>
        <div className="d-flex align-items-center gap-1">
          <Form.Control
            type="text"
            placeholder="username"
            value={cdLocalPart}
            onChange={(e) => setCdLocalPart(e.target.value)}
            style={{ maxWidth: '200px' }}
          />
          <span className="text-muted">
            @{verifiedDomains.find((d) => d.id === cdDomainId)?.domain ?? '...'}
          </span>
        </div>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Profile Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="e.g. Blake Smith"
          value={cdDisplayName}
          onChange={(e) => setCdDisplayName(e.target.value)}
        />
        <Form.Text className="text-muted">
          Optional. Defaults to the full email address if left blank.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Alias (Optional)</Form.Label>
        <Form.Control
          type="text"
          placeholder="Display name, e.g., John Doe"
          value={cdAlias}
          onChange={(e) => setCdAlias(e.target.value)}
        />
        <Form.Text className="text-muted">
          This name will appear as the sender in outgoing emails.
        </Form.Text>
      </Form.Group>
    </>
  );

  const customDomainEditForm = (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Email Address</Form.Label>
        <Form.Control type="text" value={formData.email} disabled />
        <Form.Text className="text-muted">
          The email address for a custom domain send profile cannot be changed.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Profile Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Display name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          required
        />
      </Form.Group>

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

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          id="smtp-isDefault"
          label="Set as default sending profile"
          checked={formData.isDefault}
          onChange={(e) =>
            setFormData({ ...formData, isDefault: e.target.checked })
          }
        />
      </Form.Group>
    </>
  );

  const isEditingOAuth = !!editingProfile && !!editingProfile.authMethod && editingProfile.authMethod !== 'PASSWORD';

  const oauthEditForm = (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Email Address</Form.Label>
        <Form.Control type="text" value={formData.email} disabled />
        <Form.Text className="text-muted">
          This send profile is managed by an OAuth connection. The email and SMTP settings cannot be changed.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Profile Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Display name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          required
        />
      </Form.Group>

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

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          id="smtp-isDefault"
          label="Set as default sending profile"
          checked={formData.isDefault}
          onChange={(e) =>
            setFormData({ ...formData, isDefault: e.target.checked })
          }
        />
      </Form.Group>
    </>
  );

  const renderBody = () => {
    if (isEditingOAuth) {
      return oauthEditForm;
    }
    if (isEditingCustomDomain) {
      return customDomainEditForm;
    }
    if (showTabs) {
      return (
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k ?? 'smtp')}
          className="mb-3"
        >
          <Tab eventKey="smtp" title="SMTP Profile">
            {smtpForm}
          </Tab>
          <Tab eventKey="custom-domain" title="Custom Domain">
            {customDomainCreateForm}
          </Tab>
        </Tabs>
      );
    }
    return smtpForm;
  };

  const renderFooterActions = () => {
    if (isCustomDomainTab && !editingProfile) {
      return (
        <Button
          variant="primary"
          onClick={handleCustomDomainSubmit}
          disabled={isCreatingCustomDomainSendProfile || !cdLocalPart.trim() || !cdDomainId}
        >
          {isCreatingCustomDomainSendProfile ? (
            <>
              <Spinner size="sm" className="me-1" /> Creating...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faUserPlus} className="me-1" />
              Create Profile
            </>
          )}
        </Button>
      );
    }
    if (isEditingCustomDomain || isEditingOAuth) {
      return (
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="me-1" /> Saving...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSave} className="me-1" />
              Update
            </>
          )}
        </Button>
      );
    }
    return (
      <>
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
      </>
    );
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProfile ? 'Edit Send Profile' : 'Add Send Profile'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderBody()}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          {renderFooterActions()}
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
