import { useState, useEffect, useMemo } from 'react';
import {
  Badge,
  ButtonGroup,
  Tabs,
  Tab,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Form,
  InputGroup,
  Dropdown,
  Card,
  Modal,
} from 'react-bootstrap';
import { Button } from '../../core/components';
import { useQuery, useMutation } from '@apollo/client/react';
import toast from 'react-hot-toast';
import { DateTime } from 'luxon';
import { getProviderById, getProviderByHost } from '../../core/emailProviders';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { EmailFolder } from '../../__generated__/graphql';
import { EmailView } from './EmailView';
import {
  EmailListItem,
  EmailListItemDense,
  InboxPagination,
  AdvancedFilters,
  type EmailFilters,
} from './components';
import { useInboxEmails, emptyFilters } from './hooks';
import {
  LoadingSpinner,
  EmptyState,
  CreateRuleBanner,
  CreateRuleModal,
} from '../../core/components';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInbox,
  faPaperPlane,
  faFileAlt,
  faTrash,
  faExclamationTriangle,
  faArchive,
  faSync,
  faBomb,
  faEnvelopeOpen,
  faList,
  faBars,
  faSearch,
  faCheckSquare,
  faStar,
  faEnvelope,
  faTimes,
  faLayerGroup,
  faTag,
} from '@fortawesome/free-solid-svg-icons';
import {
  faSquare,
  faCheckSquare as faCheckSquareRegular,
} from '@fortawesome/free-regular-svg-icons';
import {
  NUKE_OLD_EMAILS_MUTATION,
  GET_TAGS_FOR_INBOX_QUERY,
  ADD_TAGS_TO_EMAILS_MUTATION,
} from './queries';

import { RECENCY_GROUP_LABELS, groupEmailsByRecency } from './utils';

import { PageWrapper, PageToolbar, PageTitle } from '../../core/components';
import {
  SearchWrapper,
  ToolbarActions,
  TabsWrapper,
  BulkActionsBar,
  SelectAllCheckbox,
  TrashWarning,
  EmailListContainer,
  GroupCard,
  GroupCardHeader,
  GroupTitle,
  GroupCount,
  GroupCardBody,
} from './Inbox.wrappers';

type ViewMode = 'spacious' | 'dense';

// Helper to get the folder base path
function getFolderBasePath(folder: EmailFolder): string {
  switch (folder) {
    case EmailFolder.Inbox:
      return '/inbox';
    case EmailFolder.Sent:
      return '/sent';
    case EmailFolder.Drafts:
      return '/drafts';
    case EmailFolder.Trash:
      return '/trash';
    case EmailFolder.Archive:
      return '/archive';
    default:
      return '/inbox';
  }
}

// Helper to parse filter from URL search params
function parseFiltersFromUrl(
  searchParams: URLSearchParams,
): EmailFilters | undefined {
  const filterParam = searchParams.get('filter');
  if (!filterParam) return undefined;
  try {
    return JSON.parse(decodeURIComponent(filterParam)) as EmailFilters;
  } catch {
    return undefined;
  }
}

// Helper to serialize filters to URL search param
function serializeFiltersToUrl(filters: EmailFilters): string | null {
  // Filter out empty values to keep URL short
  const cleanedFilters: Partial<EmailFilters> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (key === 'tagIds') {
      const tagIds = (value as string[]) || [];
      if (tagIds.length > 0) {
        cleanedFilters[key as keyof EmailFilters] = tagIds as any;
      }
    } else if (typeof value === 'string' && value.trim() !== '') {
      cleanedFilters[key as keyof EmailFilters] = value.trim() as any;
    }
  }

  // Return null if no filters remain
  if (Object.keys(cleanedFilters).length === 0) return null;
  return encodeURIComponent(JSON.stringify(cleanedFilters));
}

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
  const { user, updatePreferences } = useAuth();
  const { accountId: urlAccountId, emailId: urlEmailId } = useParams<{
    accountId?: string;
    emailId?: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse search and filters from URL
  const urlSearchQuery = searchParams.get('q') || '';
  const urlFilters = useMemo(
    () => parseFiltersFromUrl(searchParams),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(urlSearchQuery);
  const [localFilters, setLocalFilters] = useState<EmailFilters>(
    urlFilters || emptyFilters,
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('inboxViewMode');
    // Use user preference if available, otherwise fall back to localStorage or default
    if (user?.inboxDensity !== undefined) {
      return user.inboxDensity ? 'dense' : 'spacious';
    }
    return (saved as ViewMode) || 'spacious';
  });

  // Sync search input with URL on change
  useEffect(() => {
    setSearchInput(urlSearchQuery);
  }, [urlSearchQuery]);

  // Sync local filters with URL on change
  useEffect(() => {
    if (urlFilters) {
      setLocalFilters(urlFilters);
    }
  }, [urlFilters]);

  const handleViewModeChange = async (val: ViewMode) => {
    if (val) {
      setViewMode(val);
      localStorage.setItem('inboxViewMode', val);
      // Update user preference
      const isDense = val === 'dense';
      if (user?.inboxDensity !== isDense) {
        try {
          await updatePreferences({ inboxDensity: isDense });
        } catch (error) {
          console.error('Failed to update inbox density preference:', error);
        }
      }
    }
  };

  const [groupByRecency, setGroupByRecency] = useState<boolean>(() => {
    // Use user preference if available, otherwise fall back to localStorage
    if (user?.inboxGroupByDate !== undefined) {
      return user.inboxGroupByDate;
    }
    const saved = localStorage.getItem('inboxGroupByRecency');
    return saved === 'true';
  });

  // Sync groupByRecency with user preference when user loads
  useEffect(() => {
    if (user?.inboxGroupByDate !== undefined) {
      if (groupByRecency !== user.inboxGroupByDate) {
        setGroupByRecency(user.inboxGroupByDate);
        localStorage.setItem(
          'inboxGroupByRecency',
          String(user.inboxGroupByDate),
        );
      }
    }
  }, [user?.inboxGroupByDate]);

  const handleGroupByRecencyChange = async (enabled: boolean) => {
    setGroupByRecency(enabled);
    localStorage.setItem('inboxGroupByRecency', String(enabled));
    // Update user preference
    if (user?.inboxGroupByDate !== enabled) {
      try {
        await updatePreferences({ inboxGroupByDate: enabled });
      } catch (error) {
        console.error('Failed to update group by date preference:', error);
      }
    }
  };

  // Show tags toggle
  const [showTagsOnList, setShowTagsOnList] = useState<boolean>(() => {
    const saved = localStorage.getItem('inboxShowTags');
    return saved === 'true';
  });

  const handleShowTagsChange = (enabled: boolean) => {
    setShowTagsOnList(enabled);
    localStorage.setItem('inboxShowTags', String(enabled));
  };

  // Create rule from filter modal
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);

  // Nuke functionality
  const [showNukeModal, setShowNukeModal] = useState(false);
  const [nukePreset, setNukePreset] = useState<string>('1month');
  const [customNukeDate, setCustomNukeDate] = useState('');

  // Tags functionality
  const { data: tagsData } = useQuery(GET_TAGS_FOR_INBOX_QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  const availableTags = tagsData?.getTags ?? [];

  const [addTagsToEmails] = useMutation(ADD_TAGS_TO_EMAILS_MUTATION, {
    onCompleted: () => {
      toast.success('Tags added');
    },
    onError: (err) => toast.error(`Failed to add tags: ${err.message}`),
  });

  const handleBulkAddTag = async (tagId: string) => {
    if (selectedIds.size === 0) return;
    await addTagsToEmails({
      variables: {
        input: {
          emailIds: Array.from(selectedIds),
          tagIds: [tagId],
        },
      },
    });
  };

  // Build URL for navigation
  const basePath = getFolderBasePath(folder);

  const buildUrl = (options: {
    accountId?: string;
    emailId?: string;
    search?: string;
    filters?: EmailFilters;
  }) => {
    let path = basePath;
    const accId = options.accountId ?? urlAccountId;
    const emlId = options.emailId;

    if (accId && accId !== 'all') {
      path += `/account/${accId}`;
    }
    if (emlId) {
      path += `/email/${emlId}`;
    }

    const params = new URLSearchParams();
    const q = options.search ?? urlSearchQuery;
    if (q) params.set('q', q);
    const f = options.filters ?? urlFilters;
    if (f) {
      const serialized = serializeFiltersToUrl(f);
      if (serialized) params.set('filter', serialized);
    }

    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

  // Navigate to account tab
  const handleAccountTabSelect = (accountId: string) => {
    const path =
      accountId === 'all' ? basePath : `${basePath}/account/${accountId}`;
    navigate(path);
  };

  // Navigate to email view
  const navigateToEmail = (emailId: string) => {
    navigate(buildUrl({ emailId }));
  };

  // Navigate back from email view
  const navigateBack = () => {
    navigate(buildUrl({}));
  };

  // Update search in URL
  const updateSearchInUrl = (query: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('q', query);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Update filters in URL
  const updateFiltersInUrl = (filters: EmailFilters) => {
    setLocalFilters(filters);
    const newParams = new URLSearchParams(searchParams);
    const serialized = serializeFiltersToUrl(filters);
    if (serialized) {
      newParams.set('filter', serialized);
    } else {
      newParams.delete('filter');
    }
    setSearchParams(newParams, { replace: true });
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
    advancedFilters,
    selectedIds,
    allSelected,
    someSelected,
    hasActiveFilters,
    setCurrentPage,
    setActiveAccountTab,
    setPageSize,
    setSearchQuery,
    setAdvancedFilters,
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
    handleUnarchive,
    handleBulkUnarchive,
  } = useInboxEmails({
    folder,
    accountId: urlAccountId,
    searchQuery: urlSearchQuery,
    filters: urlFilters,
  });

  // Nuke mutation
  const [nukeOldEmails, { loading: nuking }] = useMutation(
    NUKE_OLD_EMAILS_MUTATION,
    {
      onCompleted: (data: any) => {
        toast.success(`Archived ${data.nukeOldEmails} email(s)`);
        setShowNukeModal(false);
        handleRefresh();
      },
      onError: (err: any) => toast.error(`Failed to archive: ${err.message}`),
    },
  );

  const getNukeDate = () => {
    if (nukePreset === 'all') {
      return undefined; // Archive all emails
    }
    if (nukePreset === 'custom') {
      return DateTime.fromISO(customNukeDate).toJSDate();
    }
    const now = DateTime.now();
    switch (nukePreset) {
      case '1week':
        return now.minus({ weeks: 1 }).toJSDate();
      case '1month':
        return now.minus({ months: 1 }).toJSDate();
      case '6months':
        return now.minus({ months: 6 }).toJSDate();
      case '1year':
        return now.minus({ years: 1 }).toJSDate();
      default:
        return now.minus({ months: 1 }).toJSDate();
    }
  };

  const handleNuke = () => {
    const olderThan = getNukeDate();
    nukeOldEmails({ variables: { input: { olderThan } } });
  };

  // Debounced search - update URL after typing stops
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== urlSearchQuery) {
        updateSearchInUrl(searchInput);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput, urlSearchQuery]);

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
    navigateToEmail(email.id);
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
    navigateBack();
  };

  const handleDeleteFromView = async (emailId: string) => {
    await handleDelete(emailId);
    navigateBack();
  };

  const clearSearch = () => {
    setSearchInput('');
    updateSearchInUrl('');
  };

  // Show email view when an email is selected via URL
  if (urlEmailId) {
    return (
      <EmailView
        emailId={urlEmailId}
        onBack={handleBack}
        onDelete={() => handleDeleteFromView(urlEmailId)}
        onArchive={
          folder !== EmailFolder.Archive
            ? () => {
                handleArchive(urlEmailId);
                navigateBack();
              }
            : undefined
        }
        onUnarchive={
          folder === EmailFolder.Archive
            ? () => {
                handleUnarchive(urlEmailId);
                navigateBack();
              }
            : undefined
        }
      />
    );
  }

  const config = FOLDER_CONFIG[folder];
  const hasSelection = selectedIds.size > 0;

  return (
    <PageWrapper $overflow="hidden">
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
              <Button
                variant="outline-secondary"
                icon={<FontAwesomeIcon icon={faTimes} />}
                onClick={clearSearch}
              />
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
            variant={showTagsOnList ? 'primary' : 'outline-secondary'}
            size="sm"
            onClick={() => handleShowTagsChange(!showTagsOnList)}
            title={showTagsOnList ? 'Hide tags' : 'Show tags'}
          >
            <FontAwesomeIcon icon={faTag} />
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
          {folder === EmailFolder.Inbox && (
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => setShowNukeModal(true)}
              title="Archive old emails to reach inbox zero"
            >
              <FontAwesomeIcon icon={faBomb} className="me-1" />
              Nuke
            </Button>
          )}
        </ToolbarActions>
      </PageToolbar>

      {showTabs && (
        <TabsWrapper>
          <Tabs
            activeKey={urlAccountId || 'all'}
            onSelect={(k) => handleAccountTabSelect(k || 'all')}
            className="mb-0"
          >
            <Tab eventKey="all" title="All Inboxes" />
            {accounts.map((account) => {
              // Get provider icon from providerId or by matching host
              const provider =
                (account.providerId && getProviderById(account.providerId)) ||
                getProviderByHost(account.host);
              return (
                <Tab
                  key={account.id}
                  eventKey={account.id}
                  title={
                    <span className="d-flex align-items-center gap-1">
                      {provider && (
                        <FontAwesomeIcon
                          icon={provider.icon}
                          style={{ color: provider.iconColor }}
                        />
                      )}
                      {account.name || account.email.split('@')[0]}
                    </span>
                  }
                />
              );
            })}
          </Tabs>
        </TabsWrapper>
      )}

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={localFilters}
        onFiltersChange={updateFiltersInUrl}
        availableTags={availableTags}
      />

      {/* Create Rule from Filter Button */}
      {hasActiveFilters && (
        <CreateRuleBanner onCreateRule={() => setShowCreateRuleModal(true)} />
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
                size="sm"
                icon={<FontAwesomeIcon icon={faEnvelopeOpen} />}
                onClick={() => handleBulkMarkRead(true)}
                title="Mark as read"
              >
                Read
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                icon={<FontAwesomeIcon icon={faEnvelope} />}
                onClick={() => handleBulkMarkRead(false)}
                title="Mark as unread"
              >
                Unread
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                icon={<FontAwesomeIcon icon={faStar} />}
                onClick={() => handleBulkStar(true)}
                title="Star"
              >
                Star
              </Button>
              {folder !== EmailFolder.Archive && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  icon={<FontAwesomeIcon icon={faArchive} />}
                  onClick={handleBulkArchive}
                  title="Archive"
                >
                  Archive
                </Button>
              )}
              {folder === EmailFolder.Archive && (
                <Button
                  variant="outline-info"
                  size="sm"
                  icon={<FontAwesomeIcon icon={faInbox} />}
                  onClick={handleBulkUnarchive}
                  title="Move to Inbox"
                >
                  Move to Inbox
                </Button>
              )}
              <Button
                variant="outline-danger"
                size="sm"
                icon={<FontAwesomeIcon icon={faTrash} />}
                onClick={handleBulkDelete}
                title="Delete"
              >
                Delete
              </Button>
            </ButtonGroup>
            {availableTags.length > 0 && (
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-secondary"
                  size="sm"
                  id="bulk-tag-dropdown"
                >
                  <FontAwesomeIcon icon={faTag} className="me-1" />
                  Add Tag
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {availableTags.map((tag) => (
                    <Dropdown.Item
                      key={tag.id}
                      onClick={() => handleBulkAddTag(tag.id)}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: tag.color,
                          marginRight: 8,
                        }}
                      />
                      {tag.name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}
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
                    : folder === EmailFolder.Archive
                      ? 'Your archive is empty. Archive emails to keep them out of your inbox.'
                      : undefined
            }
          />
        ) : groupByRecency ? (
          // Grouped by recency with cards
          <div style={{ padding: '1rem' }}>
            {groupEmailsByRecency(emails).map((group) => (
              <GroupCard key={group.group}>
                <GroupCardHeader>
                  <GroupTitle>
                    {RECENCY_GROUP_LABELS[group.group]}
                    <GroupCount bg="primary">{group.emails.length}</GroupCount>
                  </GroupTitle>
                </GroupCardHeader>
                <GroupCardBody>
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
                        showFolderBadge={hasActiveFilters}
                        showTags={showTagsOnList}
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
                          folder !== EmailFolder.Archive
                            ? handleArchive
                            : undefined
                        }
                        onUnarchive={
                          email.folder === 'ARCHIVE'
                            ? handleUnarchive
                            : undefined
                        }
                      />
                    );
                  })}
                </GroupCardBody>
              </GroupCard>
            ))}
          </div>
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
                showFolderBadge={hasActiveFilters}
                showTags={showTagsOnList}
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
                onUnarchive={
                  email.folder === 'ARCHIVE' ? handleUnarchive : undefined
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

      {/* Nuke Modal */}
      <Modal
        show={showNukeModal}
        onHide={() => setShowNukeModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faBomb} className="me-2 text-warning" />
            Reach Inbox Zero
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Archive all emails older than a specific date. This helps you reach
            inbox zero by moving old emails out of your inbox while keeping them
            accessible in your archive.
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Archive emails older than:</Form.Label>
            <div className="d-flex flex-column gap-2">
              <Form.Check
                type="radio"
                id="nuke-all"
                label="All emails"
                checked={nukePreset === 'all'}
                onChange={() => setNukePreset('all')}
              />
              <Form.Check
                type="radio"
                id="nuke-1week"
                label="1 week ago"
                checked={nukePreset === '1week'}
                onChange={() => setNukePreset('1week')}
              />
              <Form.Check
                type="radio"
                id="nuke-1month"
                label="1 month ago"
                checked={nukePreset === '1month'}
                onChange={() => setNukePreset('1month')}
              />
              <Form.Check
                type="radio"
                id="nuke-6months"
                label="6 months ago"
                checked={nukePreset === '6months'}
                onChange={() => setNukePreset('6months')}
              />
              <Form.Check
                type="radio"
                id="nuke-1year"
                label="1 year ago"
                checked={nukePreset === '1year'}
                onChange={() => setNukePreset('1year')}
              />
              <Form.Check
                type="radio"
                id="nuke-custom"
                label="Custom date"
                checked={nukePreset === 'custom'}
                onChange={() => setNukePreset('custom')}
              />
              {nukePreset === 'custom' && (
                <Form.Control
                  type="date"
                  value={customNukeDate}
                  onChange={(e) => setCustomNukeDate(e.target.value)}
                  className="mt-2"
                  max={new Date().toISOString().split('T')[0]}
                />
              )}
            </div>
          </Form.Group>
          <Alert variant="info">
            <small>
              Emails will be moved to your Archive folder, not deleted. You can
              always find them later.
            </small>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNukeModal(false)}>
            Cancel
          </Button>
          <Button
            variant="warning"
            icon={<FontAwesomeIcon icon={faBomb} />}
            onClick={handleNuke}
            loading={nuking}
            disabled={nuking || (nukePreset === 'custom' && !customNukeDate)}
          >
            Archive Old Emails
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Rule from Filter Modal */}
      <CreateRuleModal
        show={showCreateRuleModal}
        onHide={() => setShowCreateRuleModal(false)}
        initialData={{
          conditions: {
            fromContains: advancedFilters.fromContains || '',
            toContains: advancedFilters.toContains || '',
            ccContains: advancedFilters.ccContains || '',
            bccContains: advancedFilters.bccContains || '',
            subjectContains: advancedFilters.subjectContains || '',
            bodyContains: advancedFilters.bodyContains || '',
          },
          actions: {
            addTagIds: advancedFilters.tagIds || [],
          },
        }}
      />
    </PageWrapper>
  );
}
