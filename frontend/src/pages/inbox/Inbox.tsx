import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  ListGroup,
  Badge,
  Button,
  ButtonGroup,
  Tabs,
  Tab,
  Alert,
  Pagination,
} from 'react-bootstrap';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import {
  GET_EMAILS_QUERY,
  UPDATE_EMAIL_MUTATION,
  DELETE_EMAIL_MUTATION,
  GET_EMAIL_ACCOUNTS_FOR_INBOX_QUERY,
  SYNC_ALL_ACCOUNTS_MUTATION,
  GET_EMAIL_COUNT_QUERY,
} from './queries';
import { EmailFolder } from '../../__generated__/graphql';
import { EmailView } from './EmailView';
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
  faStar as faStarSolid,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
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

const EmailItem = styled(ListGroup.Item)<{ $isUnread: boolean }>`
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-left: none;
  border-right: none;
  background: ${(props) =>
    props.$isUnread
      ? props.theme.colors.unreadBackground
      : props.theme.colors.backgroundWhite};
  font-weight: ${(props) => (props.$isUnread ? '600' : '400')};

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
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

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`;

interface InboxProps {
  folder?: EmailFolder;
}

const ITEMS_PER_PAGE = 25;

const folderConfig = {
  [EmailFolder.Inbox]: { icon: faInbox, label: 'Inbox' },
  [EmailFolder.Sent]: { icon: faPaperPlane, label: 'Sent' },
  [EmailFolder.Drafts]: { icon: faFileAlt, label: 'Drafts' },
  [EmailFolder.Trash]: { icon: faTrash, label: 'Trash' },
  [EmailFolder.Spam]: { icon: faExclamationTriangle, label: 'Spam' },
  [EmailFolder.Archive]: { icon: faArchive, label: 'Archive' },
};

export function Inbox({ folder = EmailFolder.Inbox }: InboxProps) {
  const navigate = useNavigate();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeAccountTab, setActiveAccountTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset selected email and page when folder or tab changes
  useEffect(() => {
    setSelectedEmailId(null);
    setCurrentPage(1);
  }, [folder, activeAccountTab]);

  // Load email accounts for tabs
  const { data: accountsData } = useQuery(GET_EMAIL_ACCOUNTS_FOR_INBOX_QUERY);
  const accounts = accountsData?.getEmailAccounts ?? [];

  // Determine which account to filter by
  const emailAccountId =
    activeAccountTab === 'all' ? undefined : activeAccountTab;

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data, loading, refetch } = useQuery(GET_EMAILS_QUERY, {
    variables: {
      input: {
        folder,
        emailAccountId,
        limit: ITEMS_PER_PAGE,
        offset,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  // Get total count for pagination
  const { data: countData } = useQuery(GET_EMAIL_COUNT_QUERY, {
    variables: { input: { folder, emailAccountId } },
  });

  const totalCount = countData?.getEmailCount ?? 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const [updateEmail] = useMutation(UPDATE_EMAIL_MUTATION, {
    refetchQueries: [
      {
        query: GET_EMAILS_QUERY,
        variables: {
          input: { folder, emailAccountId, limit: ITEMS_PER_PAGE, offset },
        },
      },
      {
        query: GET_EMAIL_COUNT_QUERY,
        variables: { input: { folder: EmailFolder.Inbox, isRead: false } },
      },
    ],
  });

  const [deleteEmail] = useMutation(DELETE_EMAIL_MUTATION, {
    onCompleted: () => {
      toast.success(
        folder === EmailFolder.Trash
          ? 'Email permanently deleted'
          : 'Email moved to trash',
      );
    },
    refetchQueries: [
      {
        query: GET_EMAILS_QUERY,
        variables: {
          input: { folder, emailAccountId, limit: ITEMS_PER_PAGE, offset },
        },
      },
      {
        query: GET_EMAIL_COUNT_QUERY,
        variables: { input: { folder } },
      },
    ],
  });

  const [syncAllAccounts, { loading: syncing }] = useMutation(
    SYNC_ALL_ACCOUNTS_MUTATION,
    {
      onCompleted: () => {
        toast.success('Sync started');
        refetch();
      },
    },
  );

  const handleStarToggle = async (
    e: React.MouseEvent,
    emailId: string,
    currentlyStarred: boolean,
  ) => {
    e.stopPropagation();
    await updateEmail({
      variables: { input: { id: emailId, isStarred: !currentlyStarred } },
    });
  };

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
      await updateEmail({
        variables: { input: { id: email.id, isRead: true } },
      });
    }
    setSelectedEmailId(email.id);
  };

  const handleBack = () => {
    setSelectedEmailId(null);
  };

  const handleDelete = async (emailId: string) => {
    await deleteEmail({ variables: { id: emailId } });
    setSelectedEmailId(null);
  };

  const handleRefresh = async () => {
    if (folder === EmailFolder.Inbox) {
      await syncAllAccounts();
    } else {
      await refetch();
    }
  };

  const formatDate = (dateStr: string) => {
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
  };

  if (selectedEmailId) {
    return (
      <EmailView
        emailId={selectedEmailId}
        onBack={handleBack}
        onDelete={() => handleDelete(selectedEmailId)}
      />
    );
  }

  const emails = data?.getEmails ?? [];
  const config = folderConfig[folder];
  const showTabs = folder === EmailFolder.Inbox && accounts.length > 1;

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
          <ListGroup variant="flush">
            {emails.map((email) => {
              const account = accounts.find(
                (a) => a.id === email.emailAccountId,
              );
              return (
                <EmailItem
                  key={email.id}
                  $isUnread={!email.isRead}
                  onClick={() => handleEmailClick(email)}
                >
                  <EmailMeta>
                    <div>
                      <StarButton
                        $isStarred={email.isStarred}
                        onClick={(e) =>
                          handleStarToggle(e, email.id, email.isStarred)
                        }
                      >
                        <FontAwesomeIcon
                          icon={email.isStarred ? faStarSolid : faStarRegular}
                        />
                      </StarButton>
                      <SenderName>
                        {email.fromName || email.fromAddress}
                      </SenderName>
                      {activeAccountTab === 'all' && account && (
                        <AccountBadge bg="light" text="dark">
                          {account.name || account.email.split('@')[0]}
                        </AccountBadge>
                      )}
                    </div>
                    <EmailDate>{formatDate(email.receivedAt)}</EmailDate>
                  </EmailMeta>
                  <Subject>{email.subject}</Subject>
                  <Preview>
                    {email.textBody?.substring(0, 100) || '(No content)'}
                  </Preview>
                </EmailItem>
              );
            })}
          </ListGroup>
        )}
      </EmailListContainer>

      {totalPages > 1 && (
        <PaginationWrapper>
          <Pagination size="sm" className="mb-0">
            <Pagination.First
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            />

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === currentPage}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}

            <Pagination.Next
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            />
            <Pagination.Last
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </PaginationWrapper>
      )}
    </PageWrapper>
  );
}
