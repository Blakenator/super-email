import {
  Card,
  Button,
  Badge,
  Spinner,
  ProgressBar,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';

const AccountCardStyled = styled(Card)<{ $isSyncing?: boolean }>`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  overflow: hidden;

  ${({ $isSyncing }) =>
    $isSyncing &&
    `
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  `}

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const AccountCardHeader = styled(Card.Header)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: ${({ theme }) => theme.spacing.md};
  border: none;
`;

const AccountCardTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const AccountCardSubtitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: 0.9;
`;

const AccountCardBody = styled(Card.Body)`
  padding: ${({ theme }) => theme.spacing.md};
`;

const AccountDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AccountDetailLabel = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const AccountCardFooter = styled(Card.Footer)`
  background: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
`;

const AccountCardActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

const SyncStatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SyncStatusHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SyncStatusText = styled.span`
  font-size: 0.8rem;
  color: #667eea;
  font-weight: 500;
`;

const SyncProgressBar = styled(ProgressBar)`
  height: 8px;
  border-radius: 4px;
  background-color: #e0e0e0 !important;

  .progress-bar {
    border-radius: 4px;
  }
`;

export interface EmailAccountData {
  id: string;
  name: string;
  email: string;
  host: string;
  port: number;
  accountType: string;
  isSyncing: boolean;
  syncProgress?: number | null;
  syncStatus?: string | null;
  lastSyncedAt?: string | null;
  defaultSmtpProfile?: { name: string } | null;
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
  return (
    <AccountCardStyled $isSyncing={account.isSyncing}>
      <AccountCardHeader>
        <AccountCardTitle>{account.name}</AccountCardTitle>
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
      {account.isSyncing && (
        <AccountCardFooter>
          <SyncStatusContainer>
            <SyncStatusHeader>
              <Spinner
                animation="border"
                size="sm"
                style={{ width: '14px', height: '14px' }}
              />
              <SyncStatusText>
                {account.syncStatus || 'Syncing...'}
              </SyncStatusText>
            </SyncStatusHeader>
            {account.syncProgress !== null &&
              account.syncProgress !== undefined && (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id={`sync-progress-${account.id}`}>
                      {account.syncProgress}% complete
                    </Tooltip>
                  }
                >
                  <SyncProgressBar
                    now={account.syncProgress}
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
