import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Card,
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
  Badge,
  Accordion,
  Table,
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGlobe,
  faPlus,
  faTrash,
  faSync,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faEnvelope,
  faCopy,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import {
  GET_CUSTOM_DOMAINS_QUERY,
  ADD_CUSTOM_DOMAIN_MUTATION,
  VERIFY_CUSTOM_DOMAIN_MUTATION,
  DELETE_CUSTOM_DOMAIN_MUTATION,
  DELETE_CUSTOM_DOMAIN_ACCOUNT_MUTATION,
} from '../queries';

function getStatusBadge(status: string) {
  switch (status) {
    case 'VERIFIED':
      return (
        <Badge bg="success">
          <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
          Verified
        </Badge>
      );
    case 'PENDING_VERIFICATION':
      return (
        <Badge bg="warning" text="dark">
          <FontAwesomeIcon icon={faClock} className="me-1" />
          Pending Verification
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge bg="danger">
          <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
          Failed
        </Badge>
      );
    default:
      return <Badge bg="secondary">{status}</Badge>;
  }
}

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
}

export function DomainSettings() {
  const navigate = useNavigate();
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [showDeleteDomain, setShowDeleteDomain] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_CUSTOM_DOMAINS_QUERY);

  const [addDomain, { loading: addingDomain }] = useMutation(
    ADD_CUSTOM_DOMAIN_MUTATION,
    {
      onCompleted: () => {
        void refetch();
        setShowAddDomain(false);
        setNewDomain('');
        toast.success('Domain added! Configure the DNS records below to verify.');
      },
      onError: (err) => toast.error(err.message),
    },
  );

  const [verifyDomain, { loading: verifying }] = useMutation(
    VERIFY_CUSTOM_DOMAIN_MUTATION,
    {
      onCompleted: (result) => {
        void refetch();
        if (result.verifyCustomDomain?.status === 'VERIFIED') {
          toast.success('Domain verified successfully!');
        } else {
          toast('DNS records not yet verified. Please allow propagation time.', {
            icon: '⏳',
          });
        }
      },
      onError: (err) => toast.error(err.message),
    },
  );

  const [deleteDomain, { loading: deleting }] = useMutation(
    DELETE_CUSTOM_DOMAIN_MUTATION,
    {
      onCompleted: () => {
        void refetch();
        setShowDeleteDomain(null);
        toast.success('Domain deleted');
      },
      onError: (err) => toast.error(err.message),
    },
  );

  const [deleteAccount] = useMutation(
    DELETE_CUSTOM_DOMAIN_ACCOUNT_MUTATION,
    {
      onCompleted: () => {
        void refetch();
        toast.success('Account removed');
      },
      onError: (err) => toast.error(err.message),
    },
  );

  const domains = data?.getCustomDomains ?? [];

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Custom Domains</h5>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddDomain(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            Add Domain
          </Button>
        </div>

        {domains.length === 0 ? (
          <div className="text-center py-5">
            <FontAwesomeIcon
              icon={faGlobe}
              size="3x"
              className="text-muted mb-3"
            />
            <h5>No Custom Domains</h5>
            <p className="text-muted mb-3">
              Add your own domain to send and receive email with custom
              addresses like <code>you@yourdomain.com</code>.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowAddDomain(true)}
            >
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Add Your First Domain
            </Button>
          </div>
        ) : (
          <Accordion>
            {domains.map((domain) => (
              <Accordion.Item key={domain.id} eventKey={domain.id}>
                <Accordion.Header>
                  <div className="d-flex align-items-center gap-2 w-100 me-3">
                    <FontAwesomeIcon icon={faGlobe} className="text-primary" />
                    <strong>{domain.domain}</strong>
                    {getStatusBadge(domain.status)}
                    <small className="text-muted ms-auto">
                      {domain.accounts?.length ?? 0} account
                      {(domain.accounts?.length ?? 0) !== 1 ? 's' : ''}
                    </small>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  {/* DNS Records */}
                  <h6>DNS Records</h6>
                  <Alert variant="info" className="py-2">
                    <small>
                      Add these records to your domain's DNS configuration.
                      After adding them, click "Check Verification" to verify.
                    </small>
                  </Alert>
                  <Table size="sm" responsive className="mb-3">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Purpose</th>
                        <th>Name</th>
                        <th>Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domain.dnsRecords?.map((record) => (
                        <tr key={record.id}>
                          <td>
                            <Badge bg="secondary">{record.recordType}</Badge>
                          </td>
                          <td>
                            <small>{record.purpose}</small>
                          </td>
                          <td>
                            <code
                              style={{
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                              onClick={() => copyToClipboard(record.name)}
                              title="Click to copy"
                            >
                              {record.name.length > 40
                                ? record.name.slice(0, 37) + '...'
                                : record.name}
                            </code>
                            <FontAwesomeIcon
                              icon={faCopy}
                              className="ms-1 text-muted"
                              style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                              onClick={() => copyToClipboard(record.name)}
                            />
                          </td>
                          <td>
                            <code
                              style={{
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                              onClick={() => copyToClipboard(record.value)}
                              title="Click to copy"
                            >
                              {record.value.length > 40
                                ? record.value.slice(0, 37) + '...'
                                : record.value}
                            </code>
                            <FontAwesomeIcon
                              icon={faCopy}
                              className="ms-1 text-muted"
                              style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                              onClick={() => copyToClipboard(record.value)}
                            />
                          </td>
                          <td>
                            {record.isVerified ? (
                              <FontAwesomeIcon
                                icon={faCheckCircle}
                                className="text-success"
                              />
                            ) : (
                              <FontAwesomeIcon
                                icon={faTimesCircle}
                                className="text-warning"
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {domain.status !== 'VERIFIED' && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="mb-3"
                      onClick={() =>
                        void verifyDomain({ variables: { id: domain.id } })
                      }
                      disabled={verifying}
                    >
                      {verifying ? (
                        <Spinner animation="border" size="sm" className="me-1" />
                      ) : (
                        <FontAwesomeIcon icon={faSync} className="me-1" />
                      )}
                      Check Verification
                    </Button>
                  )}

                  {/* Email Accounts */}
                  <hr />
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Email Accounts</h6>
                    {domain.status === 'VERIFIED' && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => void navigate('/settings/accounts')}
                      >
                        <FontAwesomeIcon icon={faPlus} className="me-1" />
                        Add Account
                      </Button>
                    )}
                  </div>

                  {domain.status !== 'VERIFIED' && (
                    <Alert variant="warning" className="py-2">
                      <small>
                        Verify your domain first before creating email accounts.
                      </small>
                    </Alert>
                  )}

                  {(domain.accounts?.length ?? 0) === 0 ? (
                    <p className="text-muted small">
                      No email accounts yet.
                      {domain.status === 'VERIFIED' &&
                        ' Click "Add Account" to create one.'}
                    </p>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {domain.accounts?.map((account) => (
                        <div
                          key={account.id}
                          className="d-flex justify-content-between align-items-center border rounded p-2"
                        >
                          <div>
                            <FontAwesomeIcon
                              icon={faEnvelope}
                              className="text-primary me-2"
                            />
                            <strong>
                              {account.localPart}@{domain.domain}
                            </strong>
                          </div>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => void navigate('/settings/accounts')}
                              title="Edit in Email Accounts"
                            >
                              <FontAwesomeIcon icon={faExternalLinkAlt} className="me-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                void deleteAccount({
                                  variables: { id: account.id },
                                })
                              }
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Domain Actions */}
                  <hr />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setShowDeleteDomain(domain.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} className="me-1" />
                    Delete Domain
                  </Button>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        )}

        {/* Add Domain Modal */}
        <Modal
          show={showAddDomain}
          onHide={() => setShowAddDomain(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Add Custom Domain</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Domain Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
              <Form.Text className="text-muted">
                Enter your domain name without www or https.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAddDomain(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                void addDomain({
                  variables: { input: { domain: newDomain } },
                })
              }
              disabled={addingDomain || !newDomain.trim()}
            >
              {addingDomain ? (
                <Spinner animation="border" size="sm" className="me-1" />
              ) : (
                <FontAwesomeIcon icon={faPlus} className="me-1" />
              )}
              Add Domain
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Domain Confirmation */}
        <Modal
          show={showDeleteDomain !== null}
          onHide={() => setShowDeleteDomain(null)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Delete Custom Domain</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete{' '}
              <strong>
                {domains.find((d) => d.id === showDeleteDomain)?.domain}
              </strong>
              ?
            </p>
            <Alert variant="danger">
              <strong>Warning:</strong> This will permanently delete the
              domain, all associated email accounts, send profiles, and
              emails. This action cannot be undone.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDomain(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                void deleteDomain({
                  variables: { id: showDeleteDomain! },
                })
              }
              disabled={deleting}
            >
              {deleting ? (
                <Spinner animation="border" size="sm" className="me-1" />
              ) : null}
              Delete Domain
            </Button>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  );
}
