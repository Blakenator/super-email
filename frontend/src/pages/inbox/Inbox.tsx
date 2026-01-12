import { useState, useEffect } from 'react';
import { Badge, Button, ButtonGroup, Tabs, Tab, Alert } from 'react-bootstrap';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { EmailFolder } from '../../__generated__/graphql';
import { EmailView } from './EmailView';
import { EmailListItem, InboxPagination } from './components';
import { useInboxEmails } from './hooks';
import { LoadingSpinner, EmptyState } from '../../core/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInbox,
  faPaperPlane,
  faFileAlt,
  faTrash,
  faExclamationTriangle,
  faArchive,
  faSync,
  faEnvelopeOpen,
} from '@fortawesome/free-solid-svg-icons';

// Styled components
const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const PageToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`;

const PageTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
`;

const TabsWrapper = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`;

const TrashWarning = styled(Alert)`
  margin: ${({ theme }) => theme.spacing.md};
  margin-bottom: 0;
  flex-shrink: 0;
`;

const EmailListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.backgroundWhite};
`;

// Folder configuration
const FOLDER_CONFIG = {
  [EmailFolder.Inbox]: { icon: faInbox, label: 'Inbox' },
  [EmailFolder.Sent]: { icon: faPaperPlane, label: 'Sent' },
  [EmailFolder.Drafts]: { icon: faFileAlt, label: 'Drafts' },
  [EmailFolder.Trash]: { icon: faTrash, label: 'Trash' },
  [EmailFolder.Spam]: { icon: faExclamationTriangle, label: 'Spam' },
  [EmailFolder.Archive]: { icon: faArchive, label: 'Archive' },
};

interface InboxProps {
  folder?: EmailFolder;
}

export function Inbox({ folder = EmailFolder.Inbox }: InboxProps) {
  const navigate = useNavigate();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const {
    emails,
    accounts,
    loading,
    syncing,
    totalCount,
    totalPages,
    currentPage,
    activeAccountTab,
    showTabs,
    setCurrentPage,
    setActiveAccountTab,
    handleStarToggle,
    handleMarkRead,
    handleDelete,
    handleRefresh,
  } = useInboxEmails(folder);

  // Reset selected email when folder or tab changes
  useEffect(() => {
    setSelectedEmailId(null);
  }, [folder, activeAccountTab]);

  const handleEmailClick = async (email: {
    id: string;
    isRead: boolean;
    emailAccountId: string;
    toAddresses: string[];
    ccAddresses?: string[] | null;
    bccAddresses?: string[] | null;
    subject: string;
    textBody?: string | null;
    htmlBody?: string | null;
    inReplyTo?: string | null;
    fromAddress?: string;
    fromName?: string | null;
    receivedAt?: string;
    messageId?: string;
  }) => {
    // For drafts, navigate to compose instead of email view
    if (folder === EmailFolder.Drafts) {
      navigate('/compose', {
        state: {
          draft: {
            draftId: email.id,
            emailAccountId: email.emailAccountId,
            to: email.toAddresses?.join(', ') || '',
            cc: email.ccAddresses?.join(', ') || '',
            bcc: email.bccAddresses?.join(', ') || '',
            subject: email.subject,
            body: email.textBody || '',
            htmlBody: email.htmlBody || '',
            inReplyTo: email.inReplyTo,
            originalBody: email.inReplyTo ? email.textBody : undefined,
            originalHtmlBody: email.inReplyTo ? email.htmlBody : undefined,
            originalFrom: email.fromName || email.fromAddress,
            originalDate: email.receivedAt,
          },
        },
      });
      return;
    }

    if (!email.isRead) {
      await handleMarkRead(email.id);
    }
    setSelectedEmailId(email.id);
  };

  const handleReply = (email: {
    fromAddress?: string;
    subject: string;
    messageId?: string;
    textBody?: string | null;
    htmlBody?: string | null;
    fromName?: string | null;
    receivedAt?: string;
    emailAccountId: string;
  }) => {
    navigate('/compose', {
      state: {
        replyTo: {
          to: email.fromAddress,
          subject: email.subject.startsWith('Re:')
            ? email.subject
            : `Re: ${email.subject}`,
          inReplyTo: email.messageId,
          originalBody: email.textBody,
          originalHtmlBody: email.htmlBody,
          originalFrom: email.fromName || email.fromAddress,
          originalDate: email.receivedAt,
          emailAccountId: email.emailAccountId,
        },
      },
    });
  };

  const handleBack = () => {
    setSelectedEmailId(null);
  };

  const handleDeleteFromView = async (emailId: string) => {
    await handleDelete(emailId);
    setSelectedEmailId(null);
  };

  // Show email view when an email is selected
  if (selectedEmailId) {
    return (
      <EmailView
        emailId={selectedEmailId}
        onBack={handleBack}
        onDelete={() => handleDeleteFromView(selectedEmailId)}
      />
    );
  }

  const config = FOLDER_CONFIG[folder];

  return (
    <PageWrapper>
      <PageToolbar>
        <PageTitle>
          <FontAwesomeIcon icon={config.icon} />
          {config.label}
          <Badge bg="secondary">{totalCount}</Badge>
        </PageTitle>
        <ButtonGroup size="sm">
          <Button
            variant="outline-secondary"
            onClick={handleRefresh}
            disabled={syncing || loading}
          >
            <FontAwesomeIcon icon={faSync} spin={syncing} className="me-1" />
            {syncing ? 'Syncing...' : 'Refresh'}
          </Button>
        </ButtonGroup>
      </PageToolbar>

      {showTabs && (
        <TabsWrapper>
          <Tabs
            activeKey={activeAccountTab}
            onSelect={(k) => setActiveAccountTab(k || 'all')}
            className="mb-0"
          >
            <Tab eventKey="all" title="All Inboxes" />
            {accounts.map((account) => (
              <Tab
                key={account.id}
                eventKey={account.id}
                title={account.name || account.email}
              />
            ))}
          </Tabs>
        </TabsWrapper>
      )}

      {folder === EmailFolder.Trash && emails.length > 0 && (
        <TrashWarning variant="warning">
          <FontAwesomeIcon icon={faTrash} className="me-2" />
          Emails in trash will be permanently deleted after 30 days.
        </TrashWarning>
      )}

      <EmailListContainer>
        {loading && emails.length === 0 ? (
          <LoadingSpinner
            message={`Loading ${config.label.toLowerCase()}...`}
          />
        ) : emails.length === 0 ? (
          <EmptyState
            icon={faEnvelopeOpen}
            title={`No emails in ${config.label.toLowerCase()}`}
            description={
              folder === EmailFolder.Inbox
                ? 'Your inbox is empty. New emails will appear here.'
                : folder === EmailFolder.Trash
                  ? 'Your trash is empty.'
                  : undefined
            }
          />
        ) : (
          emails.map((email) => {
            const account = accounts.find((a) => a.id === email.emailAccountId);
            return (
              <EmailListItem
                key={email.id}
                email={email}
                account={account}
                showAccount={activeAccountTab === 'all'}
                onEmailClick={handleEmailClick}
                onStarToggle={handleStarToggle}
                onReply={handleReply}
                onDelete={handleDelete}
              />
            );
          })
        )}
      </EmailListContainer>

      <InboxPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </PageWrapper>
  );
}
