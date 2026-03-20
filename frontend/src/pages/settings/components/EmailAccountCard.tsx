import {
  Alert,
  Button,
  Badge,
  Spinner,
  OverlayTrigger,
  Tooltip,
  ProgressBar,
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faSignInAlt,
  faSync,
  faTrash,
  faEdit,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faMicrosoft, faYahoo } from '@fortawesome/free-brands-svg-icons';
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
  authMethod?: string;
  needsReauth?: boolean;
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

const OAUTH_PROVIDER_LABELS: Record<string, { label: string; icon: typeof faGoogle }> = {
  OAUTH_GOOGLE: { label: 'Google', icon: faGoogle },
  OAUTH_YAHOO: { label: 'Yahoo', icon: faYahoo },
  OAUTH_OUTLOOK: { label: 'Outlook', icon: faMicrosoft },
};

interface EmailAccountCardProps {
  account: EmailAccountData;
  onEdit: (id: string) => void;
  onSync: (id: string) => void;
  onDelete: (id: string) => void;
  onReauth?: (id: string) => void;
}

export function EmailAccountCard({
  account,
  onEdit,
  onSync,
  onDelete,
  onReauth,
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
  const oauthInfo = account.authMethod ? OAUTH_PROVIDER_LABELS[account.authMethod] : null;
  const isOAuth = !!oauthInfo;

  return (
    <AccountCardStyled $isSyncing={isSyncing} className="card">
      {account.needsReauth && (
        <Alert variant="warning" className="mb-0 rounded-0 border-start-0 border-end-0 border-top-0 py-2 px-3">
          <div className="d-flex align-items-center justify-content-between">
            <small>
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
              This account needs to be re-authenticated
            </small>
            {onReauth && (
              <Button
                variant="warning"
                size="sm"
                onClick={() => onReauth(account.id)}
              >
                <FontAwesomeIcon icon={faSignInAlt} className="me-1" />
                Re-authenticate
              </Button>
            )}
          </div>
        </Alert>
      )}
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
        {imap && !isOAuth && (
          <AccountDetailRow>
            <AccountDetailLabel>Server</AccountDetailLabel>
            <span>
              {imap.host}:{imap.port}
            </span>
          </AccountDetailRow>
        )}
        <AccountDetailRow>
          <AccountDetailLabel>Type</AccountDetailLabel>
          {isOAuth ? (
            <Badge bg="primary">
              <FontAwesomeIcon icon={oauthInfo.icon} className="me-1" />
              Connected via {oauthInfo.label}
            </Badge>
          ) : (
            <Badge bg={isCustomDomain ? 'success' : 'info'}>
              {isCustomDomain ? 'Custom Domain' : imap?.accountType || account.type}
            </Badge>
          )}
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
          {!isCustomDomain && (
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
          )}
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
