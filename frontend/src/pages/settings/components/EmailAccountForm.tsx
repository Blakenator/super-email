import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Modal, Row, Spinner, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faInfoCircle,
  faPlug,
  faSave,
  faTimesCircle,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import {
  EMAIL_PROVIDERS,
  type EmailProviderPreset,
  getProviderById,
  IMAP_PORTS,
} from '../../../core/emailProviders';
import { EmailAccountType } from '../../../__generated__/graphql';
import {
  InstructionsCard,
  ProviderCard,
  ProviderGrid,
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
  defaultSendProfileId: string;
  providerId: string;
  isDefault: boolean;
  alsoCreateSmtpProfile: boolean;
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
  defaultSendProfileId: '',
  providerId: 'custom',
  isDefault: false,
  alsoCreateSmtpProfile: false,
};

interface SmtpProfile {
  id: string;
  name: string;
  email: string;
  alias?: string | null;
}

export interface CustomDomainOption {
  id: string;
  domain: string;
  status: string;
}

export interface CustomDomainAccountData {
  customDomainId: string;
  localPart: string;
  name?: string;
}

interface EmailAccountFormProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: EmailAccountFormData) => void;
  onTest: (
    data: EmailAccountFormData,
  ) => Promise<{ success: boolean; message: string }>;
  editingAccount?: {
    id: string;
    name: string;
    email: string;
    type?: string;
    imapSettings?: {
      host: string;
      port: number;
      useSsl: boolean;
    } | null;
    defaultSendProfileId?: string | null;
    providerId?: string | null;
    isDefault?: boolean;
  } | null;
  smtpProfiles: SmtpProfile[];
  isSubmitting: boolean;
  isTesting: boolean;
  testResult: { success: boolean; message: string } | null;
  customDomains?: CustomDomainOption[];
  onCreateCustomDomainAccount?: (data: CustomDomainAccountData) => void;
  isCreatingCustomDomainAccount?: boolean;
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
  customDomains,
  onCreateCustomDomainAccount,
  isCreatingCustomDomainAccount,
}: EmailAccountFormProps) {
  const [formData, setFormData] =
    useState<EmailAccountFormData>(defaultFormData);
  const [activeTab, setActiveTab] = useState<string>('imap');
  const [cdLocalPart, setCdLocalPart] = useState('');
  const [cdDisplayName, setCdDisplayName] = useState('');
  const [cdDomainId, setCdDomainId] = useState('');

  const verifiedDomains = (customDomains ?? []).filter(
    (d) => d.status === 'VERIFIED',
  );
  const showTabs = !editingAccount && verifiedDomains.length > 0;

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      if (editingAccount) {
        setFormData({
          name: editingAccount.name,
          email: editingAccount.email,
          host: editingAccount.imapSettings?.host || '',
          port: editingAccount.imapSettings?.port || 993,
          username: editingAccount.email,
          password: '',
          accountType: EmailAccountType.Imap,
          useSsl: editingAccount.imapSettings?.useSsl ?? true,
          defaultSendProfileId: editingAccount.defaultSendProfileId || '',
          providerId: editingAccount.providerId || 'custom',
          isDefault: editingAccount.isDefault || false,
          alsoCreateSmtpProfile: false,
        });
        setActiveTab('imap');
      } else {
        setFormData(defaultFormData);
        setActiveTab('imap');
        setCdLocalPart('');
        setCdDisplayName('');
        setCdDomainId(verifiedDomains[0]?.id ?? '');
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
    void onTest(formData);
  };

  const selectedProvider =
    getProviderById(formData.providerId) ||
    EMAIL_PROVIDERS.find((p) => p.id === 'custom')!;
  const showInstructions =
    formData.providerId !== 'custom' && selectedProvider.instructions;

  const handleCustomDomainSubmit = () => {
    if (onCreateCustomDomainAccount && cdDomainId && cdLocalPart.trim()) {
      onCreateCustomDomainAccount({
        customDomainId: cdDomainId,
        localPart: cdLocalPart.trim(),
        name: cdDisplayName.trim() || undefined,
      });
    }
  };

  const imapForm = (
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
                  {port}{' '}
                  {port === 993 ? '(SSL)' : port === 143 ? '(Plain)' : ''}
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
              {editingAccount
                ? 'Password (leave blank to keep)'
                : 'Password'}
            </Form.Label>
            <Form.Control
              type="password"
              placeholder="App password or account password"
              value={formData.password}
              autoComplete="off"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required={!editingAccount}
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Default Send Profile (for sending)</Form.Label>
        <Form.Select
          value={formData.defaultSendProfileId}
          onChange={(e) =>
            setFormData({
              ...formData,
              defaultSendProfileId: e.target.value,
            })
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

      {!editingAccount && (
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="alsoCreateSmtpProfile"
            label="Also create a send profile for sending emails from this account"
            checked={formData.alsoCreateSmtpProfile}
            onChange={(e) =>
              setFormData({
                ...formData,
                alsoCreateSmtpProfile: e.target.checked,
              })
            }
          />
          <Form.Text className="text-muted">
            To send emails, you'll need a send profile with the same
            credentials.
          </Form.Text>
        </Form.Group>
      )}
    </>
  );

  const customDomainForm = (
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
        <Form.Label>Display Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="e.g. Blake Smith"
          value={cdDisplayName}
          onChange={(e) => setCdDisplayName(e.target.value)}
        />
        <Form.Text className="text-muted">
          Optional. Defaults to the full email address if left blank. This will
          create both an email account (for receiving) and a send profile (for
          sending).
        </Form.Text>
      </Form.Group>
    </>
  );

  const isCustomDomainTab = activeTab === 'custom-domain';
  const isEditingCustomDomain = editingAccount?.type === 'CUSTOM_DOMAIN';

  const customDomainEditForm = (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Email Address</Form.Label>
        <Form.Control type="text" value={formData.email} disabled />
        <Form.Text className="text-muted">
          The email address for a custom domain account cannot be changed.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Account Name</Form.Label>
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
        <Form.Label>Default Send Profile (for sending)</Form.Label>
        <Form.Select
          value={formData.defaultSendProfileId}
          onChange={(e) =>
            setFormData({
              ...formData,
              defaultSendProfileId: e.target.value,
            })
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
    </>
  );

  const renderBody = () => {
    if (isEditingCustomDomain) {
      return customDomainEditForm;
    }
    if (showTabs) {
      return (
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k ?? 'imap')}
          className="mb-3"
        >
          <Tab eventKey="imap" title="IMAP Account">
            {imapForm}
          </Tab>
          <Tab eventKey="custom-domain" title="Custom Domain">
            {customDomainForm}
          </Tab>
        </Tabs>
      );
    }
    return imapForm;
  };

  const renderFooterActions = () => {
    if (isCustomDomainTab && !editingAccount) {
      return (
        <Button
          variant="primary"
          onClick={handleCustomDomainSubmit}
          disabled={isCreatingCustomDomainAccount || !cdLocalPart.trim() || !cdDomainId}
        >
          {isCreatingCustomDomainAccount ? (
            <>
              <Spinner size="sm" className="me-1" /> Creating...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faUserPlus} className="me-1" />
              Create Account
            </>
          )}
        </Button>
      );
    }
    if (isEditingCustomDomain) {
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
              {editingAccount ? 'Update' : 'Add Account'}
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
            {editingAccount ? 'Edit Email Account' : 'Add Email Account'}
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
