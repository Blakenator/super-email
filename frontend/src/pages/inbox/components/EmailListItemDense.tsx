import { useState } from 'react';
import { Badge, Button, Modal } from 'react-bootstrap';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar as faStarSolid,
  faReply,
  faTrash,
  faEnvelope,
  faEnvelopeOpen,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

const DenseRow = styled.div<{ $isUnread: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${(props) =>
    props.$isUnread
      ? props.theme.colors.unreadBackground
      : props.theme.colors.backgroundWhite};
  font-weight: ${(props) => (props.$isUnread ? '600' : '400')};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  gap: ${({ theme }) => theme.spacing.sm};
  position: relative;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }

  &:hover .quick-actions {
    opacity: 1;
  }
`;

const StarCell = styled.span<{ $isStarred: boolean }>`
  color: ${(props) =>
    props.$isStarred
      ? props.theme.colors.star
      : props.theme.colors.starInactive};
  cursor: pointer;
  flex-shrink: 0;
  width: 20px;

  &:hover {
    color: ${({ theme }) => theme.colors.star};
  }
`;

const SenderCell = styled.span`
  width: 180px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const SubjectCell = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const PreviewCell = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

const DateCell = styled.span`
  width: 80px;
  flex-shrink: 0;
  text-align: right;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AccountBadge = styled(Badge)`
  font-size: 0.65rem;
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

const QuickActions = styled.div`
  position: absolute;
  right: ${({ theme }) => theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  padding: 2px;
  border-radius: 4px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const ActionButton = styled(Button)`
  padding: 0.15rem 0.35rem;
  font-size: 0.65rem;
`;

interface Email {
  id: string;
  messageId: string;
  fromAddress: string;
  fromName?: string | null;
  subject: string;
  textBody?: string | null;
  htmlBody?: string | null;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  emailAccountId: string;
  toAddresses: string[];
  ccAddresses?: string[] | null;
  bccAddresses?: string[] | null;
  inReplyTo?: string | null;
}

interface Account {
  id: string;
  name: string;
  email: string;
}

interface EmailListItemDenseProps {
  email: Email;
  account?: Account;
  showAccount: boolean;
  onEmailClick: (email: Email) => void;
  onStarToggle: (emailId: string, isStarred: boolean) => void;
  onMarkRead: (emailId: string, isRead: boolean) => void;
  onReply: (email: Email) => void;
  onDelete: (emailId: string) => void;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function EmailListItemDense({
  email,
  account,
  showAccount,
  onEmailClick,
  onStarToggle,
  onMarkRead,
  onReply,
  onDelete,
}: EmailListItemDenseProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStarToggle(email.id, email.isStarred);
  };

  const handleReadToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkRead(email.id, !email.isRead);
  };

  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReply(email);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(email.id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <DenseRow $isUnread={!email.isRead} onClick={() => onEmailClick(email)}>
        <StarCell $isStarred={email.isStarred} onClick={handleStarClick}>
          <FontAwesomeIcon
            icon={email.isStarred ? faStarSolid : faStarRegular}
          />
        </StarCell>
        <SenderCell>
          {email.fromName || email.fromAddress}
          {showAccount && account && (
            <AccountBadge bg="light" text="dark">
              {account.name.slice(0, 10)}
            </AccountBadge>
          )}
        </SenderCell>
        <SubjectCell>{email.subject}</SubjectCell>
        <PreviewCell>
          — {email.textBody?.substring(0, 60) || '(No content)'}
        </PreviewCell>
        <DateCell>{formatDate(email.receivedAt)}</DateCell>

        <QuickActions className="quick-actions">
          <ActionButton
            variant="outline-secondary"
            size="sm"
            onClick={handleReadToggle}
            title={email.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            <FontAwesomeIcon icon={email.isRead ? faEnvelope : faEnvelopeOpen} />
          </ActionButton>
          <ActionButton
            variant="outline-primary"
            size="sm"
            onClick={handleReplyClick}
            title="Reply"
          >
            <FontAwesomeIcon icon={faReply} />
          </ActionButton>
          <ActionButton
            variant="outline-danger"
            size="sm"
            onClick={handleDeleteClick}
            title="Delete"
          >
            <FontAwesomeIcon icon={faTrash} />
          </ActionButton>
        </QuickActions>
      </DenseRow>

      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this email?
          <div className="mt-2 text-muted">
            <strong>Subject:</strong> {email.subject}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
