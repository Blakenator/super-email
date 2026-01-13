import { useState } from 'react';
import { Badge, Button, Modal, Form } from 'react-bootstrap';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DateTime } from 'luxon';
import {
  faStar as faStarSolid,
  faReply,
  faTrash,
  faEnvelope,
  faEnvelopeOpen,
  faArchive,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

const EmailItemWrapper = styled.div<{ $isUnread: boolean; $isSelected: boolean }>`
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${(props) =>
    props.$isSelected
      ? `${props.theme.colors.primary}15`
      : props.$isUnread
        ? props.theme.colors.unreadBackground
        : props.theme.colors.backgroundWhite};
  font-weight: ${(props) => (props.$isUnread ? '600' : '400')};
  position: relative;

  &:hover {
    background: ${({ theme, $isSelected }) =>
      $isSelected ? `${theme.colors.primary}20` : theme.colors.backgroundHover};
  }

  &:hover .quick-actions {
    opacity: 1;
  }
`;

const SelectionCheckbox = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding-top: 2px;
`;

const EmailContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const EmailMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const SenderName = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const EmailDate = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 400;
`;

const Subject = styled.div`
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Preview = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
`;

const StarButton = styled.span<{ $isStarred: boolean }>`
  color: ${(props) =>
    props.$isStarred
      ? props.theme.colors.star
      : props.theme.colors.starInactive};
  cursor: pointer;
  margin-right: ${({ theme }) => theme.spacing.sm};
  font-size: 1.2rem;

  &:hover {
    color: ${({ theme }) => theme.colors.star};
  }
`;

const AccountBadge = styled(Badge)`
  font-size: 0.7rem;
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

const ThreadBadge = styled(Badge)`
  font-size: 0.65rem;
  margin-left: ${({ theme }) => theme.spacing.xs};
  background-color: ${({ theme }) => theme.colors.primary} !important;
`;

const QuickActions = styled.div`
  position: absolute;
  right: ${({ theme }) => theme.spacing.lg};
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  opacity: 0;
  transition: opacity 0.15s ease;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const ActionButton = styled(Button)`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
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
  threadId?: string | null;
  threadCount?: number | null;
}

interface Account {
  id: string;
  name: string;
  email: string;
}

interface EmailListItemProps {
  email: Email;
  account?: Account;
  showAccount: boolean;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEmailClick: (email: Email) => void;
  onStarToggle: (emailId: string, isStarred: boolean) => void;
  onMarkRead: (emailId: string, isRead: boolean) => void;
  onReply: (email: Email) => void;
  onDelete: (emailId: string) => void;
  onArchive?: (emailId: string) => void;
}

function formatDate(dateStr: string) {
  const date = DateTime.fromISO(dateStr);
  const now = DateTime.now();

  if (!date.isValid) {
    return dateStr;
  }

  const isToday = date.hasSame(now, 'day');
  const isSameYear = date.hasSame(now, 'year');
  const monthsDiff = now.diff(date, 'months').months;
  const isWithin3Months = monthsDiff >= 0 && monthsDiff < 3;

  if (isToday) {
    // Show time for today (e.g., "2:30 PM")
    return date.toFormat('h:mm a');
  } else if (isSameYear && isWithin3Months) {
    // Show "Nov 20" format for within 3 months
    return date.toFormat('LLL d');
  } else {
    // Show "1/17/2010" format for older dates
    return date.toFormat('M/d/yyyy');
  }
}

export function EmailListItem({
  email,
  account,
  showAccount,
  isSelected,
  onSelect,
  onEmailClick,
  onStarToggle,
  onMarkRead,
  onReply,
  onDelete,
  onArchive,
}: EmailListItemProps) {
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

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArchive) {
      onArchive(email.id);
    }
  };

  const confirmDelete = () => {
    onDelete(email.id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <EmailItemWrapper
        $isUnread={!email.isRead}
        $isSelected={isSelected}
        onClick={() => onEmailClick(email)}
      >
        <SelectionCheckbox>
          <Form.Check
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </SelectionCheckbox>
        <EmailContent>
          <EmailMeta>
            <div>
              <StarButton $isStarred={email.isStarred} onClick={handleStarClick}>
                <FontAwesomeIcon
                  icon={email.isStarred ? faStarSolid : faStarRegular}
                />
              </StarButton>
              <SenderName>{email.fromName || email.fromAddress}</SenderName>
              {showAccount && account && (
                <AccountBadge bg="light" text="dark">
                  {account.name || account.email.split('@')[0]}
                </AccountBadge>
              )}
            </div>
            <EmailDate>{formatDate(email.receivedAt)}</EmailDate>
          </EmailMeta>
          <Subject>
            {email.subject}
            {email.threadCount && email.threadCount > 1 && (
              <ThreadBadge>{email.threadCount}</ThreadBadge>
            )}
          </Subject>
          <Preview>
            {email.textBody?.substring(0, 100) || '(No content)'}
          </Preview>
        </EmailContent>

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
          {onArchive && (
            <ActionButton
              variant="outline-secondary"
              size="sm"
              onClick={handleArchiveClick}
              title="Archive"
            >
              <FontAwesomeIcon icon={faArchive} />
            </ActionButton>
          )}
          <ActionButton
            variant="outline-danger"
            size="sm"
            onClick={handleDeleteClick}
            title="Delete"
          >
            <FontAwesomeIcon icon={faTrash} />
          </ActionButton>
        </QuickActions>
      </EmailItemWrapper>

      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
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
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
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
