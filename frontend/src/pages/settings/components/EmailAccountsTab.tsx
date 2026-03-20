import { Button, Card, Spinner, Modal, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faInbox,
  faPlus,
  faSync,
} from '@fortawesome/free-solid-svg-icons';
import { EmailAccountCard } from './EmailAccountCard';
import { SectionCard, AccountCardGrid } from '../Settings.wrappers';

interface EmailAccountsTabProps {
  accounts: any[];
  loading: boolean;
  syncingAll: boolean;
  showDeleteModal: boolean;
  deletingAccount: any | null;
  deleting: boolean;
  onAddAccount: () => void;
  onEditAccount: (id: string) => void;
  onSyncAccount: (id: string) => void;
  onDeleteAccount: (id: string) => void;
  onSyncAll: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onReauth?: (id: string) => void;
}

export function EmailAccountsTab({
  accounts,
  loading,
  syncingAll,
  showDeleteModal,
  deletingAccount,
  deleting,
  onAddAccount,
  onEditAccount,
  onSyncAccount,
  onDeleteAccount,
  onSyncAll,
  onConfirmDelete,
  onCancelDelete,
  onReauth,
}: EmailAccountsTabProps) {
  const needsReauthCount = accounts.filter((a) => a.needsReauth).length;
  const isOAuthAccount = deletingAccount?.authMethod?.startsWith('OAUTH_');

  return (
    <>
      {needsReauthCount > 0 && (
        <Alert variant="warning" className="mb-3">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {needsReauthCount === 1
            ? '1 account needs re-authentication'
            : `${needsReauthCount} accounts need re-authentication`}
        </Alert>
      )}
      <SectionCard className="card">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Incoming Email Accounts</h5>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={onSyncAll}
                disabled={syncingAll || accounts.length === 0}
              >
                {syncingAll ? (
                  <Spinner animation="border" size="sm" className="me-1" />
                ) : (
                  <FontAwesomeIcon icon={faSync} className="me-1" />
                )}
                Sync All
              </Button>
              <Button variant="primary" size="sm" onClick={onAddAccount}>
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Add Account
              </Button>
            </div>
          </div>

          {loading && accounts.length === 0 ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-5">
              <FontAwesomeIcon
                icon={faInbox}
                size="3x"
                className="text-muted mb-3"
              />
              <h5>No Email Accounts Yet</h5>
              <p className="text-muted mb-3">
                Add an email account to start receiving emails. You'll need your
                email server's IMAP settings (host, port) and your credentials
                (usually your email and an app password).
              </p>
              <p className="text-muted small mb-4">
                <strong>First time setup:</strong> After adding an email
                account, you'll also need to add a send profile to send emails.
                You can check "Also create a send profile" when adding your
                account to set this up automatically.
              </p>
              <Button variant="primary" onClick={onAddAccount}>
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Add Your First Account
              </Button>
            </div>
          ) : (
            <AccountCardGrid>
              {accounts.map((account) => (
                <EmailAccountCard
                  key={account.id}
                  account={account}
                  onEdit={onEditAccount}
                  onSync={onSyncAccount}
                  onDelete={onDeleteAccount}
                  onReauth={onReauth}
                />
              ))}
            </AccountCardGrid>
          )}
        </Card.Body>
      </SectionCard>

      <Modal show={showDeleteModal} onHide={onCancelDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Email Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the account{' '}
            <strong>{deletingAccount?.name}</strong>?
          </p>
          <Alert variant="danger">
            <strong>Warning:</strong> This will permanently delete the email
            account and all associated emails. This action cannot be undone.
            {isOAuthAccount && (
              <>
                {' '}Additionally, the OAuth access granted to this application will
                be revoked with the provider.
              </>
            )}
          </Alert>
          <div className="text-muted small">
            <strong>Account:</strong> {deletingAccount?.email}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={onCancelDelete}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
