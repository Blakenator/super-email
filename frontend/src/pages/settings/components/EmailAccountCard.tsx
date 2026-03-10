import {
  Button,
  Badge,
  Spinner,
  OverlayTrigger,
  Tooltip,
  ProgressBar,
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
  SyncProgressBarWrapper,
} from './EmailAccountCard.wrappers';

export interface EmailAccountData {
  id: string;
  name: string;
  email: string;
  type: string;
  imapSettings?: {
    host: string;
    port: number;
    accountType: string;
    useSsl: boolean;
    lastSyncedAt?: string | null;
    isHistoricalSyncing: boolean;
    historicalSyncProgress?: number | null;
    historicalSyncStatus?: string | null;
    isUpdateSyncing: boolean;
    updateSyncProgress?: number | null;
    updateSyncStatus?: string | null;
  } | null;
  defaultSendProfile?: { id: string; name: string } | null;
  defaultSendProfileId?: string | null;
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
  const imap = account.imapSettings;
  const isSyncing = imap?.isHistoricalSyncing || imap?.isUpdateSyncing || false;
  const syncProgress = imap?.isHistoricalSyncing
    ? imap?.historicalSyncProgress
    : imap?.updateSyncProgress;
  const syncStatus = imap?.isHistoricalSyncing
    ? imap?.historicalSyncStatus
    : imap?.updateSyncStatus;
  const isCustomDomain = account.type === 'CUSTOM_DOMAIN';

  return (
    <AccountCardStyled $isSyncing={isSyncing} className="card">
      <AccountCardHeader className="card-header">
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
      <AccountCardBody className="card-body">
        {imap && (
          <AccountDetailRow>
            <AccountDetailLabel>Server</AccountDetailLabel>
            <span>
              {imap.host}:{imap.port}
            </span>
          </AccountDetailRow>
        )}
        <AccountDetailRow>
          <AccountDetailLabel>Type</AccountDetailLabel>
          <Badge bg={isCustomDomain ? 'success' : 'info'}>
            {isCustomDomain ? 'Custom Domain' : imap?.accountType || account.type}
          </Badge>
        </AccountDetailRow>
        <AccountDetailRow>
          <AccountDetailLabel>Default Send Profile</AccountDetailLabel>
          {account.defaultSendProfile ? (
            <Badge bg="primary">{account.defaultSendProfile.name}</Badge>
          ) : (
            <span className="text-muted">—</span>
          )}
        </AccountDetailRow>
        {imap && (
          <AccountDetailRow>
            <AccountDetailLabel>Last Sync</AccountDetailLabel>
            {imap.lastSyncedAt ? (
              <span>
                {new Date(imap.lastSyncedAt).toLocaleString([], {
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
        )}
      </AccountCardBody>
      {isSyncing && (
        <AccountCardFooter className="card-footer">
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
                  <SyncProgressBarWrapper>
                    <ProgressBar
                      now={syncProgress}
                      variant="primary"
                      animated
                    />
                  </SyncProgressBarWrapper>
                </OverlayTrigger>
              )}
          </SyncStatusContainer>
        </AccountCardFooter>
      )}
      <AccountCardFooter className="card-footer">
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
            disabled={isSyncing}
          >
            {isSyncing ? (
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
