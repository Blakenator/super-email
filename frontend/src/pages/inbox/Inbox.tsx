import { useState, useEffect } from 'react';
import {
  Badge,
  Button,
  ButtonGroup,
  Tabs,
  Tab,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Form,
  InputGroup,
  Dropdown,
} from 'react-bootstrap';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { EmailFolder } from '../../__generated__/graphql';
import { EmailView } from './EmailView';
import {
  EmailListItem,
  EmailListItemDense,
  InboxPagination,
} from './components';
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
  faList,
  faBars,
  faSearch,
  faCheckSquare,
  faStar,
  faEnvelope,
  faTimes,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import {
  faSquare,
  faCheckSquare as faCheckSquareRegular,
} from '@fortawesome/free-regular-svg-icons';

type ViewMode = 'spacious' | 'dense';

// Recency grouping
enum RecencyGroup {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_MONTH = 'LAST_MONTH',
  LAST_3_MONTHS = 'LAST_3_MONTHS',
  LAST_6_MONTHS = 'LAST_6_MONTHS',
  LAST_YEAR = 'LAST_YEAR',
  OLDER = 'OLDER',
}

const RECENCY_GROUP_LABELS: Record<RecencyGroup, string> = {
  [RecencyGroup.TODAY]: 'Today',
  [RecencyGroup.YESTERDAY]: 'Yesterday',
  [RecencyGroup.LAST_7_DAYS]: 'Last 7 Days',
  [RecencyGroup.LAST_MONTH]: 'Last Month',
  [RecencyGroup.LAST_3_MONTHS]: 'Last 3 Months',
  [RecencyGroup.LAST_6_MONTHS]: 'Last 6 Months',
  [RecencyGroup.LAST_YEAR]: 'Last Year',
  [RecencyGroup.OLDER]: 'Older',
};

function getRecencyGroup(dateStr: string): RecencyGroup {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const start7DaysAgo = new Date(startOfToday);
  start7DaysAgo.setDate(start7DaysAgo.getDate() - 7);
  const start1MonthAgo = new Date(startOfToday);
  start1MonthAgo.setMonth(start1MonthAgo.getMonth() - 1);
  const start3MonthsAgo = new Date(startOfToday);
  start3MonthsAgo.setMonth(start3MonthsAgo.getMonth() - 3);
  const start6MonthsAgo = new Date(startOfToday);
  start6MonthsAgo.setMonth(start6MonthsAgo.getMonth() - 6);
  const start1YearAgo = new Date(startOfToday);
  start1YearAgo.setFullYear(start1YearAgo.getFullYear() - 1);

  if (date >= startOfToday) return RecencyGroup.TODAY;
  if (date >= startOfYesterday) return RecencyGroup.YESTERDAY;
  if (date >= start7DaysAgo) return RecencyGroup.LAST_7_DAYS;
  if (date >= start1MonthAgo) return RecencyGroup.LAST_MONTH;
  if (date >= start3MonthsAgo) return RecencyGroup.LAST_3_MONTHS;
  if (date >= start6MonthsAgo) return RecencyGroup.LAST_6_MONTHS;
  if (date >= start1YearAgo) return RecencyGroup.LAST_YEAR;
  return RecencyGroup.OLDER;
}

interface GroupedEmails<T> {
  group: RecencyGroup;
  emails: T[];
}

function groupEmailsByRecency<T extends { receivedAt: string }>(
  emails: T[],
): GroupedEmails<T>[] {
  const groups = new Map<RecencyGroup, T[]>();

  // Initialize all groups in order
  Object.values(RecencyGroup).forEach((group) => {
    groups.set(group, []);
  });

  // Group emails
  emails.forEach((email) => {
    const group = getRecencyGroup(email.receivedAt);
    groups.get(group)!.push(email);
  });

  // Return only non-empty groups in order
  return Object.values(RecencyGroup)
    .map((group) => ({
      group,
      emails: groups.get(group) || [],
    }))
    .filter((g) => g.emails.length > 0);
}

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
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

const PageTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
`;

const SearchWrapper = styled.div`
  flex: 1;
  max-width: 400px;
`;

const ToolbarActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const TabsWrapper = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`;

const BulkActionsBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.primary}10;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`;

const SelectAllCheckbox = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.primary};

  &:hover {
    color: ${({ theme }) => theme.colors.primaryDark};
  }
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

const GroupHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 1;
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
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('inboxViewMode');
    return (saved as ViewMode) || 'spacious';
  });

  const handleViewModeChange = (val: ViewMode) => {
    if (val) {
      setViewMode(val);
      localStorage.setItem('inboxViewMode', val);
    }
  };

  const [groupByRecency, setGroupByRecency] = useState<boolean>(() => {
    const saved = localStorage.getItem('inboxGroupByRecency');
    return saved === 'true';
  });

  const handleGroupByRecencyChange = (enabled: boolean) => {
    setGroupByRecency(enabled);
    localStorage.setItem('inboxGroupByRecency', String(enabled));
  };

  const {
    emails,
    accounts,
    loading,
    syncing,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    activeAccountTab,
    showTabs,
    searchQuery,
    selectedIds,
    allSelected,
    someSelected,
    setCurrentPage,
    setActiveAccountTab,
    setPageSize,
    setSearchQuery,
    handleStarToggle,
    handleMarkRead,
    handleDelete,
    handleRefresh,
    handleSelectEmail,
    handleSelectAll,
    handleBulkMarkRead,
    handleBulkStar,
    handleBulkDelete,
    handleBulkArchive,
    handleArchive,
  } = useInboxEmails(folder);

  // Reset selected email when folder or tab changes
  useEffect(() => {
    setSelectedEmailId(null);
  }, [folder, activeAccountTab]);

  // Sync search input with debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput, setSearchQuery]);

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
      await handleMarkRead(email.id, true);
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

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  // Show email view when an email is selected
  if (selectedEmailId) {
    return (
      <EmailView
        emailId={selectedEmailId}
        onBack={handleBack}
        onDelete={() => handleDeleteFromView(selectedEmailId)}
        onArchive={
          folder !== EmailFolder.Archive
            ? () => {
                handleArchive(selectedEmailId);
                setSelectedEmailId(null);
              }
            : undefined
        }
      />
    );
  }

  const config = FOLDER_CONFIG[folder];
  const hasSelection = selectedIds.size > 0;

  return (
    <PageWrapper>
      <PageToolbar>
        <PageTitle>
          <FontAwesomeIcon icon={config.icon} />
          {config.label}
          <Badge bg="secondary">{totalCount}</Badge>
        </PageTitle>

        <SearchWrapper>
          <InputGroup size="sm">
            <InputGroup.Text>
              <FontAwesomeIcon icon={faSearch} />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search emails..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <Button variant="outline-secondary" onClick={clearSearch}>
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            )}
          </InputGroup>
        </SearchWrapper>

        <ToolbarActions>
          <ToggleButtonGroup
            type="radio"
            name="viewMode"
            value={viewMode}
            onChange={handleViewModeChange}
            size="sm"
          >
            <ToggleButton
              id="view-spacious"
              value="spacious"
              variant="outline-secondary"
              title="Spacious view"
            >
              <FontAwesomeIcon icon={faBars} />
            </ToggleButton>
            <ToggleButton
              id="view-dense"
              value="dense"
              variant="outline-secondary"
              title="Dense view"
            >
              <FontAwesomeIcon icon={faList} />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant={groupByRecency ? 'primary' : 'outline-secondary'}
            size="sm"
            onClick={() => handleGroupByRecencyChange(!groupByRecency)}
            title={
              groupByRecency ? 'Disable grouping by date' : 'Group by date'
            }
          >
            <FontAwesomeIcon icon={faLayerGroup} />
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={syncing || loading}
          >
            <FontAwesomeIcon icon={faSync} spin={syncing} className="me-1" />
            {syncing ? 'Syncing...' : 'Refresh'}
          </Button>
        </ToolbarActions>
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

      {/* Bulk Actions Bar */}
      <BulkActionsBar>
        <SelectAllCheckbox onClick={handleSelectAll}>
          <FontAwesomeIcon
            icon={
              allSelected
                ? faCheckSquare
                : someSelected
                  ? faCheckSquareRegular
                  : faSquare
            }
            size="lg"
          />
        </SelectAllCheckbox>

        {hasSelection ? (
          <>
            <span>{selectedIds.size} selected</span>
            <ButtonGroup size="sm">
              <Button
                variant="outline-secondary"
                onClick={() => handleBulkMarkRead(true)}
                title="Mark as read"
              >
                <FontAwesomeIcon icon={faEnvelopeOpen} className="me-1" />
                Read
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => handleBulkMarkRead(false)}
                title="Mark as unread"
              >
                <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                Unread
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => handleBulkStar(true)}
                title="Star"
              >
                <FontAwesomeIcon icon={faStar} className="me-1" />
                Star
              </Button>
              {folder !== EmailFolder.Archive && (
                <Button
                  variant="outline-secondary"
                  onClick={handleBulkArchive}
                  title="Archive"
                >
                  <FontAwesomeIcon icon={faArchive} className="me-1" />
                  Archive
                </Button>
              )}
              <Button
                variant="outline-danger"
                onClick={handleBulkDelete}
                title="Delete"
              >
                <FontAwesomeIcon icon={faTrash} className="me-1" />
                Delete
              </Button>
            </ButtonGroup>
          </>
        ) : (
          <span className="text-muted">
            Select emails to perform bulk actions
          </span>
        )}
      </BulkActionsBar>

      {folder === EmailFolder.Trash && emails.length > 0 && (
        <TrashWarning variant="warning">
          <FontAwesomeIcon icon={faTrash} className="me-2" />
          Emails in trash will be permanently deleted after 30 days.
        </TrashWarning>
      )}

      <EmailListContainer>
        {loading && emails.length === 0 ? (
          <LoadingSpinner
            message={
              searchQuery
                ? 'Searching...'
                : `Loading ${config.label.toLowerCase()}...`
            }
          />
        ) : emails.length === 0 ? (
          <EmptyState
            icon={searchQuery ? faSearch : faEnvelopeOpen}
            title={
              searchQuery
                ? 'No results found'
                : `No emails in ${config.label.toLowerCase()}`
            }
            description={
              searchQuery
                ? 'Try adjusting your search query'
                : folder === EmailFolder.Inbox
                  ? 'Your inbox is empty. New emails will appear here.'
                  : folder === EmailFolder.Trash
                    ? 'Your trash is empty.'
                    : undefined
            }
          />
        ) : groupByRecency ? (
          // Grouped by recency
          groupEmailsByRecency(emails).map((group) => (
            <div key={group.group}>
              <GroupHeader>
                {RECENCY_GROUP_LABELS[group.group]} ({group.emails.length})
              </GroupHeader>
              {group.emails.map((email) => {
                const account = accounts.find(
                  (a) => a.id === email.emailAccountId,
                );
                const ItemComponent =
                  viewMode === 'dense' ? EmailListItemDense : EmailListItem;
                return (
                  <ItemComponent
                    key={email.id}
                    email={email}
                    account={account}
                    showAccount={activeAccountTab === 'all'}
                    isSelected={selectedIds.has(email.id)}
                    onSelect={(selected) =>
                      handleSelectEmail(email.id, selected)
                    }
                    onEmailClick={handleEmailClick}
                    onStarToggle={handleStarToggle}
                    onMarkRead={handleMarkRead}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    onArchive={
                      folder !== EmailFolder.Archive ? handleArchive : undefined
                    }
                  />
                );
              })}
            </div>
          ))
        ) : (
          // Flat list
          emails.map((email) => {
            const account = accounts.find((a) => a.id === email.emailAccountId);
            const ItemComponent =
              viewMode === 'dense' ? EmailListItemDense : EmailListItem;
            return (
              <ItemComponent
                key={email.id}
                email={email}
                account={account}
                showAccount={activeAccountTab === 'all'}
                isSelected={selectedIds.has(email.id)}
                onSelect={(selected) => handleSelectEmail(email.id, selected)}
                onEmailClick={handleEmailClick}
                onStarToggle={handleStarToggle}
                onMarkRead={handleMarkRead}
                onReply={handleReply}
                onDelete={handleDelete}
                onArchive={
                  folder !== EmailFolder.Archive ? handleArchive : undefined
                }
              />
            );
          })
        )}
      </EmailListContainer>

      <InboxPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </PageWrapper>
  );
}
