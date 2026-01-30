import {
  Button,
  Badge,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faTrash, faEdit, faCheck } from '@fortawesome/free-solid-svg-icons';
import {
  AccountCardStyled,
  AccountCardHeader,
  AccountCardTitle,
  AccountCardSubtitle,
  AccountCardBody,
  AccountDetailRow,
  AccountDetailLabel,
  AccountCardFooter,
  AccountCardActions,
  SyncStatusContainer,
  SyncStatusHeader,
  SyncStatusText,
  SyncProgressBar,
} from './EmailAccountCard.wrappers';

export interface EmailAccountData {
  id: string;
  name: string;
  email: string;
  host: string;
  port: number;
  accountType: string;
  isHistoricalSyncing: boolean;
  historicalSyncProgress?: number | null;
  historicalSyncStatus?: string | null;
  isUpdateSyncing: boolean;
  updateSyncProgress?: number | null;
  updateSyncStatus?: string | null;
  lastSyncedAt?: string | null;
  defaultSmtpProfile?: { name: string } | null;
  isDefault?: boolean;
}

interface EmailAccountCardProps {
  account: EmailAccountData;
  onEdit: (id: string) => void;
  onSync: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EmailAccountCard({
  account,
  onEdit,
  onSync,
  onDelete,
}: EmailAccountCardProps) {
  // Derive syncing state from historical or update sync
  const isSyncing = account.isHistoricalSyncing || account.isUpdateSyncing;
  const syncProgress = account.isHistoricalSyncing
    ? account.historicalSyncProgress
    : account.updateSyncProgress;
  const syncStatus = account.isHistoricalSyncing
    ? account.historicalSyncStatus
    : account.updateSyncStatus;

  return (
    <AccountCardStyled $isSyncing={isSyncing}>
      <AccountCardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AccountCardTitle>{account.name}</AccountCardTitle>
          {account.isDefault && (
            <Badge bg="success" style={{ fontSize: '0.65rem' }}>
              <FontAwesomeIcon icon={faCheck} className="me-1" />
              Default
            </Badge>
          )}
        </div>
        <AccountCardSubtitle>{account.email}</AccountCardSubtitle>
      </AccountCardHeader>
      <AccountCardBody>
        <AccountDetailRow>
          <AccountDetailLabel>Server</AccountDetailLabel>
          <span>
            {account.host}:{account.port}
          </span>
        </AccountDetailRow>
        <AccountDetailRow>
          <AccountDetailLabel>Type</AccountDetailLabel>
          <Badge bg={account.accountType === 'IMAP' ? 'info' : 'secondary'}>
            {account.accountType}
          </Badge>
        </AccountDetailRow>
        <AccountDetailRow>
          <AccountDetailLabel>Default SMTP</AccountDetailLabel>
          {account.defaultSmtpProfile ? (
            <Badge bg="primary">{account.defaultSmtpProfile.name}</Badge>
          ) : (
            <span className="text-muted">—</span>
          )}
        </AccountDetailRow>
        <AccountDetailRow>
          <AccountDetailLabel>Last Sync</AccountDetailLabel>
          {account.lastSyncedAt ? (
            <span>
              {new Date(account.lastSyncedAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          ) : (
            <span className="text-muted">Never synced</span>
          )}
        </AccountDetailRow>
      </AccountCardBody>
      {isSyncing && (
        <AccountCardFooter>
          <SyncStatusContainer>
            <SyncStatusHeader>
              <Spinner
                animation="border"
                size="sm"
                style={{ width: '14px', height: '14px' }}
              />
              <SyncStatusText>
                {syncStatus || 'Syncing...'}
              </SyncStatusText>
            </SyncStatusHeader>
            {syncProgress !== null &&
              syncProgress !== undefined && (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id={`sync-progress-${account.id}`}>
                      {syncProgress}% complete
                    </Tooltip>
                  }
                >
                  <SyncProgressBar
                    now={syncProgress}
                    variant="primary"
                    animated
                  />
                </OverlayTrigger>
              )}
          </SyncStatusContainer>
        </AccountCardFooter>
      )}
      <AccountCardFooter>
        <AccountCardActions>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => onEdit(account.id)}
          >
            <FontAwesomeIcon icon={faEdit} className="me-1" />
            Edit
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onSync(account.id)}
            disabled={account.isSyncing}
          >
            {account.isSyncing ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <FontAwesomeIcon icon={faSync} className="me-1" />
                Sync
              </>
            )}
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onDelete(account.id)}
          >
            <FontAwesomeIcon icon={faTrash} className="me-1" />
            Delete
          </Button>
        </AccountCardActions>
      </AccountCardFooter>
    </AccountCardStyled>
  );
}
