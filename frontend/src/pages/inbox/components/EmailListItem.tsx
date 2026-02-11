import { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DateTime } from 'luxon';
import { getEmailPreviewText } from '../../../utils/emailPreview';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faStar as faStarSolid,
  faReply,
  faTrash,
  faEnvelope,
  faEnvelopeOpen,
  faArchive,
  faInbox,
  faPaperPlane,
  faFileAlt,
  faExclamationTriangle,
  faPaperclip,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import {
  EmailItemWrapper,
  SelectionCheckbox,
  EmailContent,
  EmailMeta,
  SenderName,
  EmailDate,
  Subject,
  Preview,
  StarButton,
  AccountBadge,
  ThreadBadge,
  AttachmentBadge,
  QuickActions,
  ActionButton,
  FolderBadge,
  TagsRow,
  TagBadge,
} from './EmailListItem.wrappers';

// Folder config for badges
const FOLDER_BADGE_CONFIG: Record<string, { icon: IconDefinition; label: string; variant: string }> = {
  INBOX: { icon: faInbox, label: 'Inbox', variant: 'primary' },
  SENT: { icon: faPaperPlane, label: 'Sent', variant: 'success' },
  DRAFTS: { icon: faFileAlt, label: 'Drafts', variant: 'warning' },
  TRASH: { icon: faTrash, label: 'Trash', variant: 'danger' },
  SPAM: { icon: faExclamationTriangle, label: 'Spam', variant: 'secondary' },
  ARCHIVE: { icon: faArchive, label: 'Archive', variant: 'info' },
};

interface EmailTag {
  id: string;
  name: string;
  color: string;
}

interface Email {
  id: string;
  messageId: string;
  folder: string;
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
  hasAttachments?: boolean | null;
  attachmentCount?: number | null;
  tags?: EmailTag[] | null;
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
  showFolderBadge?: boolean;
  showTags?: boolean;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEmailClick: (email: Email) => void;
  onStarToggle: (emailId: string, isStarred: boolean) => void;
  onMarkRead: (emailId: string, isRead: boolean) => void;
  onReply: (email: Email) => void;
  onDelete: (emailId: string) => void;
  onArchive?: (emailId: string) => void;
  onUnarchive?: (emailId: string) => void;
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
  showFolderBadge = false,
  showTags = false,
  isSelected,
  onSelect,
  onEmailClick,
  onStarToggle,
  onMarkRead,
  onReply,
  onDelete,
  onArchive,
  onUnarchive,
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

  const handleUnarchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnarchive) {
      onUnarchive(email.id);
    }
  };

  const confirmDelete = () => {
    onDelete(email.id);
    setShowDeleteConfirm(false);
  };

  const folderConfig = FOLDER_BADGE_CONFIG[email.folder];

  return (
    <>
      <EmailItemWrapper
        $isUnread={!email.isRead}
        $isSelected={isSelected}
        onClick={() => onEmailClick(email)}
      >
        <SelectionCheckbox
          onClick={(e) => {
            e.stopPropagation();
            onSelect(!isSelected);
          }}
        >
          <Form.Check
            type="checkbox"
            checked={isSelected}
            readOnly
          />
        </SelectionCheckbox>
        {showFolderBadge && folderConfig && (
          <FolderBadge className={`badge bg-${folderConfig.variant}`}>
            <FontAwesomeIcon icon={folderConfig.icon} />
            {folderConfig.label}
          </FolderBadge>
        )}
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
                <AccountBadge className="badge bg-light text-dark">
                  {account.name || account.email.split('@')[0]}
                </AccountBadge>
              )}
            </div>
            <EmailDate>{formatDate(email.receivedAt)}</EmailDate>
          </EmailMeta>
          <Subject>
            {email.subject}
            {email.threadCount && email.threadCount > 1 && (
              <ThreadBadge className="badge">{email.threadCount}</ThreadBadge>
            )}
            {email.hasAttachments && email.attachmentCount && email.attachmentCount > 0 && (
              <AttachmentBadge className="badge">
                <FontAwesomeIcon icon={faPaperclip} />
                {email.attachmentCount}
              </AttachmentBadge>
            )}
          </Subject>
          <Preview>
            {getEmailPreviewText(email.textBody, email.htmlBody, 100)}
          </Preview>
          {showTags && email.tags && email.tags.length > 0 && (
            <TagsRow>
              {email.tags.map((tag) => (
                <TagBadge key={tag.id} $color={tag.color} className="badge">
                  {tag.name}
                </TagBadge>
              ))}
            </TagsRow>
          )}
        </EmailContent>

        <QuickActions className="quick-actions">
          <ActionButton
            className="btn btn-outline-secondary btn-sm"
            onClick={handleReadToggle}
            title={email.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            <FontAwesomeIcon icon={email.isRead ? faEnvelope : faEnvelopeOpen} />
          </ActionButton>
          <ActionButton
            className="btn btn-outline-primary btn-sm"
            onClick={handleReplyClick}
            title="Reply"
          >
            <FontAwesomeIcon icon={faReply} />
          </ActionButton>
          {onArchive && (
            <ActionButton
              className="btn btn-outline-secondary btn-sm"
              onClick={handleArchiveClick}
              title="Archive"
            >
              <FontAwesomeIcon icon={faArchive} />
            </ActionButton>
          )}
          {onUnarchive && (
            <ActionButton
              className="btn btn-outline-info btn-sm"
              onClick={handleUnarchiveClick}
              title="Move to Inbox"
            >
              <FontAwesomeIcon icon={faInbox} />
            </ActionButton>
          )}
          <ActionButton
            className="btn btn-outline-danger btn-sm"
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
