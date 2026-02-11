import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { ButtonGroup, Form, Dropdown } from 'react-bootstrap';
import { Button } from '../../core/components';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faEnvelope,
  faEnvelopeOpen,
  faArchive,
  faTrash,
  faInbox,
  faCheckDouble,
  faBolt,
  faRocket,
  faFire,
  faEllipsisV,
  faFilter,
  faCalendarAlt,
  faList,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import {
  BackButton,
  LoadingSpinner,
  CreateRuleBanner,
  CreateRuleModal,
} from '../../core/components';
import {
  EmailListItem,
  EmailListItemDense,
  AdvancedFilters,
  type EmailFilters,
} from '../inbox/components';
import { InboxPagination } from '../inbox/components/InboxPagination';
import { groupEmailsByRecency, RecencyGroup } from '../inbox/utils/recencyGrouping';
import {
  EmailFolder,
  type GetEmailsForTriageQuery,
} from '../../__generated__/graphql';
import {
  GET_TOP_EMAIL_SOURCES_QUERY,
  GET_EMAILS_FOR_TRIAGE_QUERY,
  GET_EMAIL_COUNT_FOR_TRIAGE_QUERY,
  BULK_UPDATE_EMAILS_TRIAGE_MUTATION,
  BULK_DELETE_EMAILS_TRIAGE_MUTATION,
} from './queries';
import { PageWrapper, StickyHeader } from '../../core/components';
import {
  BackButtonWrapper,
  ProgressSection,
  ProgressLabel,
  ProgressBarContainer,
  ProgressBarFill,
  NavigationButtons,
  PageContent,
  SelectionContainer,
  SelectionTitle,
  SelectionSubtitle,
  OptionsGrid,
  OptionCard,
  OptionIcon,
  OptionTitle,
  OptionSubtitle,
  SummaryContainer,
  SummaryHeader,
  SummaryTitle,
  SummarySubtitle,
  SummaryStats,
  StatCard,
  StatValue,
  StatLabel,
  SourcesList,
  SourceCard,
  SourceRank,
  SourceInfo,
  SourceName,
  SourceEmail,
  SourceCount,
  SourceViewHeader,
  SourceViewTitle,
  BulkActionsBar,
  SelectionInfo,
  ViewControls,
  EmailListContainer,
  SuccessContainer,
  SuccessIcon,
  SuccessTitle,
  SuccessSubtitle,
  SuccessStats,
  SuccessActions,
  EmptyState,
  SourceViewSubtitle,
  BulkActionsRight,
} from './Triage.wrappers';

type TriageStep = 'selection' | 'summary' | 'source' | 'success';

type TriageEmail = GetEmailsForTriageQuery['getEmails'][number];

interface EmailSource {
  fromAddress: string;
  fromName: string | null;
  count: number;
}

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_KEY = 'triage-page-size';

const emptyFilters: EmailFilters = {
  fromContains: '',
  toContains: '',
  ccContains: '',
  bccContains: '',
  subjectContains: '',
  bodyContains: '',
  tagIds: [],
};

export function Triage() {
  const navigate = useNavigate();
  const { user, updatePreferences } = useAuth();
  const [step, setStep] = useState<TriageStep>('selection');
  const [sourceLimit, setSourceLimit] = useState<number>(10);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [completedSources, setCompletedSources] = useState<Set<number>>(
    new Set(),
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem(PAGE_SIZE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_PAGE_SIZE;
  });
  const [processedCount, setProcessedCount] = useState(0);
  const [groupByDate, setGroupByDate] = useState(() => {
    // Use user preference if available, otherwise default to false
    return user?.inboxGroupByDate ?? false;
  });
  const [useDenseList, setUseDenseList] = useState(() => {
    // Use user preference if available, otherwise default to false
    return user?.inboxDensity ?? false;
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<EmailFilters>(emptyFilters);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);

  // Fetch top email sources - skip until sourceLimit is selected
  const {
    data: sourcesData,
    loading: sourcesLoading,
    refetch: refetchSources,
  } = useQuery(GET_TOP_EMAIL_SOURCES_QUERY, {
    variables: { limit: sourceLimit },
    skip: step === 'selection', // Don't fetch until source limit is selected
    fetchPolicy: 'network-only', // Always fetch fresh data, don't use cache
    notifyOnNetworkStatusChange: true, // Update loading state on refetch
  });

  // Create a mutable copy before sorting (GraphQL returns frozen arrays)
  const sources: EmailSource[] = [
    ...(sourcesData?.getTopEmailSources ?? []),
  ]
    .map((s) => ({ ...s, fromName: s.fromName ?? null }))
    .sort((a, b) => b.count - a.count); // Sort descending by count
  const currentSource = sources[currentSourceIndex];
  const totalSourceEmails = sources.reduce((sum, s) => sum + s.count, 0);

  // Check if any filters are active (including source address)
  const hasActiveFilters =
    Object.entries(filters).some(([key, v]) => {
      if (key === 'tagIds') return (v as string[]).length > 0;
      return typeof v === 'string' && v.trim() !== '';
    }) || !!currentSource?.fromAddress;

  // Combined filters including source address
  const combinedFilters: EmailFilters = useMemo(
    () => ({
      ...emptyFilters, // Ensure all properties exist
      ...filters,
      fromContains: currentSource?.fromAddress || filters.fromContains || '',
      tagIds: filters.tagIds || [],
    }),
    [filters, currentSource],
  );

  // Build query input with filters
  const queryInput = useMemo(
    () => ({
      folder: EmailFolder.Inbox,
      fromContains: currentSource?.fromAddress,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      ...(filters.toContains && { toContains: filters.toContains }),
      ...(filters.ccContains && { ccContains: filters.ccContains }),
      ...(filters.bccContains && { bccContains: filters.bccContains }),
      ...(filters.subjectContains && {
        subjectContains: filters.subjectContains,
      }),
      ...(filters.bodyContains && { bodyContains: filters.bodyContains }),
      ...(filters.tagIds.length > 0 && { tagIds: filters.tagIds }),
    }),
    [currentSource, currentPage, filters, pageSize],
  );

  // Fetch emails for current source
  const {
    data: emailsData,
    loading: emailsLoading,
    refetch: refetchEmails,
  } = useQuery(GET_EMAILS_FOR_TRIAGE_QUERY, {
    variables: { input: queryInput },
    skip: step !== 'source' || !currentSource,
    fetchPolicy: 'network-only', // Always fetch fresh data
    notifyOnNetworkStatusChange: true,
  });

  const { data: countData, refetch: refetchCount } = useQuery(
    GET_EMAIL_COUNT_FOR_TRIAGE_QUERY,
    {
      variables: {
        input: {
          folder: EmailFolder.Inbox,
          fromContains: currentSource?.fromAddress,
          ...(filters.toContains && { toContains: filters.toContains }),
          ...(filters.ccContains && { ccContains: filters.ccContains }),
          ...(filters.bccContains && { bccContains: filters.bccContains }),
          ...(filters.subjectContains && {
            subjectContains: filters.subjectContains,
          }),
          ...(filters.bodyContains && { bodyContains: filters.bodyContains }),
          ...(filters.tagIds.length > 0 && { tagIds: filters.tagIds }),
        },
      },
      skip: step !== 'source' || !currentSource,
      fetchPolicy: 'network-only', // Always fetch fresh data
      notifyOnNetworkStatusChange: true,
    },
  );

  const emails = useMemo(
    () => emailsData?.getEmails ?? [],
    [emailsData?.getEmails],
  );
  const emailCount = countData?.getEmailCount ?? 0;
  const totalPages = Math.ceil(emailCount / pageSize);

  // Group emails by recency if enabled
  const groupedEmails = useMemo(() => {
    if (!groupByDate || emails.length === 0) return null;
    return groupEmailsByRecency(emails);
  }, [emails, groupByDate]);

  // Mutations
  const [bulkUpdateEmails] = useMutation(BULK_UPDATE_EMAILS_TRIAGE_MUTATION);
  const [bulkDeleteEmails] = useMutation(BULK_DELETE_EMAILS_TRIAGE_MUTATION);

  // Handle page size change
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    localStorage.setItem(PAGE_SIZE_KEY, String(newSize));
  }, []);

  // Sync groupByDate and useDenseList with user preference when user loads
  useEffect(() => {
    if (
      user?.inboxGroupByDate !== undefined &&
      groupByDate !== user.inboxGroupByDate
    ) {
      setGroupByDate(user.inboxGroupByDate);
    }
  }, [user?.inboxGroupByDate, groupByDate]);

  useEffect(() => {
    if (
      user?.inboxDensity !== undefined &&
      useDenseList !== user.inboxDensity
    ) {
      setUseDenseList(user.inboxDensity);
    }
  }, [user?.inboxDensity, useDenseList]);

  // Reset selection when source/page/filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentSourceIndex, currentPage, filters]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === emails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(emails.map((e) => e.id)));
    }
  }, [emails, selectedIds]);

  const handleSelectEmail = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleBulkMarkRead = useCallback(
    async (isRead: boolean) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      try {
        await bulkUpdateEmails({
          variables: { input: { ids, isRead } },
        });
        toast.success(
          `Marked ${ids.length} emails as ${isRead ? 'read' : 'unread'}`,
        );
        setProcessedCount((prev) => prev + ids.length);
        setSelectedIds(new Set());
        void refetchEmails();
        void refetchCount();
        void refetchSources();
      } catch {
        toast.error('Failed to update emails');
      }
    },
    [
      selectedIds,
      bulkUpdateEmails,
      refetchEmails,
      refetchCount,
      refetchSources,
    ],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    if (emailCount === 0) return;

    try {
      const allEmails = await refetchEmails();
      const allIds =
        allEmails.data?.getEmails?.map((e: TriageEmail) => e.id) ?? [];

      if (allIds.length > 0) {
        await bulkUpdateEmails({
          variables: { input: { ids: allIds, isRead: true } },
        });
        toast.success(`Marked all ${allIds.length} emails as read`);
        setProcessedCount((prev) => prev + allIds.length);
      }

      void refetchEmails();
      void refetchCount();
      void refetchSources();
    } catch {
      toast.error('Failed to mark all as read');
    }
  }, [
    emailCount,
    bulkUpdateEmails,
    refetchEmails,
    refetchCount,
    refetchSources,
  ]);

  const handleNextSource = useCallback(() => {
    setCompletedSources((prev) => new Set(prev).add(currentSourceIndex));

    if (currentSourceIndex < sources.length - 1) {
      setCurrentSourceIndex(currentSourceIndex + 1);
      setSelectedIds(new Set());
      setCurrentPage(1);
      setFilters(emptyFilters);
    } else {
      setStep('success');
      void confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        void confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
      }, 200);
      setTimeout(() => {
        void confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 400);
    }
  }, [currentSourceIndex, sources.length]);

  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      await bulkUpdateEmails({
        variables: { input: { ids, folder: EmailFolder.Archive } },
      });
      toast.success(`Archived ${ids.length} emails`);
      setProcessedCount((prev) => prev + ids.length);
      setSelectedIds(new Set());
      void refetchEmails();
      void refetchCount();
      void refetchSources();
    } catch {
      toast.error('Failed to archive emails');
    }
  }, [
    selectedIds,
    bulkUpdateEmails,
    refetchEmails,
    refetchCount,
    refetchSources,
  ]);

  const handleArchiveAll = useCallback(async () => {
    if (emailCount === 0) return;

    try {
      const allEmails = await refetchEmails();
      const allIds =
        allEmails.data?.getEmails?.map((e: TriageEmail) => e.id) ?? [];

      if (allIds.length > 0) {
        await bulkUpdateEmails({
          variables: { input: { ids: allIds, folder: EmailFolder.Archive } },
        });
        toast.success(
          `Archived all ${allIds.length} emails from ${currentSource?.fromName || currentSource?.fromAddress}`,
        );
        setProcessedCount((prev) => prev + allIds.length);
      }

      handleNextSource();
    } catch {
      toast.error('Failed to archive all emails');
    }
  }, [emailCount, bulkUpdateEmails, refetchEmails, currentSource, handleNextSource]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      await bulkDeleteEmails({ variables: { ids } });
      toast.success(`Deleted ${ids.length} emails`);
      setProcessedCount((prev) => prev + ids.length);
      setSelectedIds(new Set());
      void refetchEmails();
      void refetchCount();
      void refetchSources();
    } catch {
      toast.error('Failed to delete emails');
    }
  }, [
    selectedIds,
    bulkDeleteEmails,
    refetchEmails,
    refetchCount,
    refetchSources,
  ]);

  const handleDeleteAll = useCallback(async () => {
    if (emailCount === 0) return;

    try {
      const allEmails = await refetchEmails();
      const allIds =
        allEmails.data?.getEmails?.map((e: TriageEmail) => e.id) ?? [];

      if (allIds.length > 0) {
        await bulkDeleteEmails({ variables: { ids: allIds } });
        toast.success(
          `Deleted all ${allIds.length} emails from ${currentSource?.fromName || currentSource?.fromAddress}`,
        );
        setProcessedCount((prev) => prev + allIds.length);
      }

      handleNextSource();
    } catch {
      toast.error('Failed to delete all emails');
    }
  }, [emailCount, bulkDeleteEmails, refetchEmails, currentSource, handleNextSource]);

  const handleSourceLimitSelect = useCallback((limit: number) => {
    setSourceLimit(limit);
    setStep('summary');
  }, []);

  const handleStartTriage = useCallback(() => {
    if (sources.length > 0) {
      setStep('source');
      setCurrentSourceIndex(0);
    }
  }, [sources]);

  const handlePrevSource = useCallback(() => {
    if (currentSourceIndex > 0) {
      setCurrentSourceIndex(currentSourceIndex - 1);
      setSelectedIds(new Set());
      setCurrentPage(1);
      setFilters(emptyFilters);
    }
  }, [currentSourceIndex]);

  const handleGoToSource = useCallback((index: number) => {
    setCurrentSourceIndex(index);
    setStep('source');
    setSelectedIds(new Set());
    setCurrentPage(1);
    setFilters(emptyFilters);
  }, []);

  const handleStartOver = useCallback(() => {
    setStep('selection');
    setSourceLimit(10);
    setCurrentSourceIndex(0);
    setCompletedSources(new Set());
    setSelectedIds(new Set());
    setCurrentPage(1);
    setProcessedCount(0);
    setFilters(emptyFilters);
    // Reset to user preferences instead of hardcoded false
    setGroupByDate(user?.inboxGroupByDate ?? false);
    setUseDenseList(user?.inboxDensity ?? false);
    // Don't refetch here - query is skipped when step is 'selection'
    // It will refetch automatically when step changes from 'selection'
  }, [user?.inboxGroupByDate, user?.inboxDensity]);

  const handleCreateRule = useCallback(() => {
    if (!hasActiveFilters && !currentSource) return;
    setShowCreateRuleModal(true);
  }, [hasActiveFilters, currentSource]);

  const progressPercent = useMemo(() => {
    if (sources.length === 0) return 0;
    if (step === 'source') {
      return Math.round(((currentSourceIndex + 1) / sources.length) * 100);
    }
    return Math.round((completedSources.size / sources.length) * 100);
  }, [sources.length, completedSources.size, step, currentSourceIndex]);

  const EmailComponent = useDenseList ? EmailListItemDense : EmailListItem;

  // Render loading state
  // Only show loading spinner when query is actually fetching (not skipped)
  // Query is skipped when step === 'selection', so only check for 'summary' step
  if (sourcesLoading && step === 'summary') {
    return (
      <PageWrapper $overflow="hidden" $background="default">
        <LoadingSpinner message="Analyzing your inbox..." />
      </PageWrapper>
    );
  }

  // Render source limit selection
  if (step === 'selection') {
    return (
      <PageWrapper $overflow="hidden" $background="default">
        <StickyHeader>
          <BackButtonWrapper>
            <BackButton
              onClick={() => navigate('/inbox')}
              label="Back to Inbox"
            />
          </BackButtonWrapper>
        </StickyHeader>
        <PageContent>
          <SelectionContainer>
            <SelectionTitle>⚡ Inbox Triage</SelectionTitle>
            <SelectionSubtitle>
              How many email sources would you like to review?
            </SelectionSubtitle>

            <OptionsGrid>
              <OptionCard onClick={() => handleSourceLimitSelect(5)}>
                <OptionIcon>
                  <FontAwesomeIcon icon={faBolt} />
                </OptionIcon>
                <OptionTitle>5 Sources</OptionTitle>
                <OptionSubtitle>Gotta be quick</OptionSubtitle>
              </OptionCard>

              <OptionCard onClick={() => handleSourceLimitSelect(10)}>
                <OptionIcon>
                  <FontAwesomeIcon icon={faRocket} />
                </OptionIcon>
                <OptionTitle>10 Sources</OptionTitle>
                <OptionSubtitle>Let's make progress</OptionSubtitle>
              </OptionCard>

              <OptionCard onClick={() => handleSourceLimitSelect(25)}>
                <OptionIcon>
                  <FontAwesomeIcon icon={faFire} />
                </OptionIcon>
                <OptionTitle>25 Sources</OptionTitle>
                <OptionSubtitle>Let's get this done</OptionSubtitle>
              </OptionCard>
            </OptionsGrid>
          </SelectionContainer>
        </PageContent>
      </PageWrapper>
    );
  }

  // Render empty state
  if (!sourcesLoading && sources.length === 0 && step === 'summary') {
    return (
      <PageWrapper $overflow="hidden" $background="default">
        <StickyHeader>
          <BackButtonWrapper>
            <BackButton onClick={() => setStep('selection')} label="Back" />
          </BackButtonWrapper>
        </StickyHeader>
        <PageContent>
          <EmptyState>
            <FontAwesomeIcon icon={faInbox} />
            <h3>Inbox Zero Achieved! 🎉</h3>
            <p>
              Congratulations! You don't have any emails in your inbox that need
              triaging. Keep up the great work!
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/inbox')}
              className="mt-4"
            >
              Back to Inbox
            </Button>
          </EmptyState>
        </PageContent>
      </PageWrapper>
    );
  }

  // Render success page
  if (step === 'success') {
    return (
      <PageWrapper $overflow="hidden" $background="default">
        <StickyHeader>
          <BackButtonWrapper>
            <BackButton
              onClick={() => navigate('/inbox')}
              label="Back to Inbox"
            />
          </BackButtonWrapper>
          <ProgressSection>
            <ProgressLabel>Complete!</ProgressLabel>
            <ProgressBarContainer>
              <ProgressBarFill $progress={100} />
            </ProgressBarContainer>
          </ProgressSection>
        </StickyHeader>
        <PageContent>
          <SuccessContainer>
            <SuccessIcon>
              <FontAwesomeIcon icon={faCheck} />
            </SuccessIcon>
            <SuccessTitle>You did it!</SuccessTitle>
            <SuccessSubtitle>
              You reviewed all {sources.length} top email sources
            </SuccessSubtitle>
            <SuccessStats>{processedCount} emails processed</SuccessStats>
            <SuccessActions>
              <Button
                variant="outline-primary"
                size="lg"
                icon={<FontAwesomeIcon icon={faRotateRight} />}
                onClick={handleStartOver}
              >
                Start Over
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon={<FontAwesomeIcon icon={faInbox} />}
                onClick={() => navigate('/inbox')}
              >
                Back to Inbox
              </Button>
            </SuccessActions>
          </SuccessContainer>
        </PageContent>
      </PageWrapper>
    );
  }

  // Render summary page
  if (step === 'summary') {
    return (
      <PageWrapper $overflow="hidden" $background="default">
        <StickyHeader>
          <BackButtonWrapper>
            <BackButton onClick={() => setStep('selection')} label="Back" />
          </BackButtonWrapper>
          <ProgressSection>
            <ProgressLabel>
              {completedSources.size} of {sources.length} sources reviewed
            </ProgressLabel>
            <ProgressBarContainer>
              <ProgressBarFill $progress={progressPercent} />
            </ProgressBarContainer>
          </ProgressSection>
        </StickyHeader>
        <PageContent>
          <SummaryContainer>
            <SummaryHeader>
              <SummaryTitle>📬 Inbox Triage</SummaryTitle>
              <SummarySubtitle>
                Review your top {sources.length} email sources to get back to
                inbox zero
              </SummarySubtitle>

              <SummaryStats>
                <StatCard>
                  <StatValue>{sources.length}</StatValue>
                  <StatLabel>Sources</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>{totalSourceEmails}</StatValue>
                  <StatLabel>Total Emails</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>{completedSources.size}</StatValue>
                  <StatLabel>Completed</StatLabel>
                </StatCard>
              </SummaryStats>

              <Button
                variant="primary"
                size="lg"
                icon={<FontAwesomeIcon icon={faArrowRight} />}
                iconPosition="right"
                onClick={handleStartTriage}
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '400px',
                  margin: '0 auto',
                }}
              >
                Start Triage
              </Button>
            </SummaryHeader>

            <SourcesList>
              {sources.map((source, index) => (
                <SourceCard
                  key={source.fromAddress}
                  $isActive={index === currentSourceIndex}
                  $isCompleted={completedSources.has(index)}
                  onClick={() => handleGoToSource(index)}
                >
                  <SourceRank $isCompleted={completedSources.has(index)}>
                    {completedSources.has(index) ? (
                      <FontAwesomeIcon icon={faCheck} />
                    ) : (
                      index + 1
                    )}
                  </SourceRank>
                  <SourceInfo>
                    <SourceName>
                      {source.fromName || source.fromAddress}
                    </SourceName>
                    {source.fromName && (
                      <SourceEmail>{source.fromAddress}</SourceEmail>
                    )}
                  </SourceInfo>
                  <SourceCount>{source.count}</SourceCount>
                </SourceCard>
              ))}
            </SourcesList>
          </SummaryContainer>
        </PageContent>
      </PageWrapper>
    );
  }

  // Render source view
  return (
    <PageWrapper $overflow="hidden" $background="default">
      <StickyHeader>
        <BackButtonWrapper>
          <BackButton onClick={() => setStep('summary')} label="Summary" />
        </BackButtonWrapper>
        <ProgressSection>
          <ProgressLabel>
            Source {currentSourceIndex + 1} of {sources.length}:{' '}
            {currentSource?.fromName || currentSource?.fromAddress}
          </ProgressLabel>
          <ProgressBarContainer>
            <ProgressBarFill $progress={progressPercent} />
          </ProgressBarContainer>
        </ProgressSection>
        <NavigationButtons>
          <Button
            variant="outline-secondary"
            icon={<FontAwesomeIcon icon={faArrowLeft} />}
            onClick={handlePrevSource}
            disabled={currentSourceIndex === 0}
          />
          <Button
            variant="primary"
            icon={<FontAwesomeIcon icon={faArrowRight} />}
            iconPosition="right"
            onClick={handleNextSource}
          >
            {currentSourceIndex === sources.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </NavigationButtons>
      </StickyHeader>

      <PageContent>
        <SourceViewHeader>
          <SourceViewTitle>
            <FontAwesomeIcon icon={faEnvelope} />
            {currentSource?.fromName || currentSource?.fromAddress}
            <SourceViewSubtitle>({emailCount} emails)</SourceViewSubtitle>
          </SourceViewTitle>

          <ViewControls>
            <Button
              variant={showFilters ? 'primary' : 'outline-secondary'}
              size="sm"
              icon={<FontAwesomeIcon icon={faFilter} />}
              onClick={() => setShowFilters(!showFilters)}
              title="Advanced Filters"
            />
            <Button
              variant={groupByDate ? 'primary' : 'outline-secondary'}
              size="sm"
              icon={<FontAwesomeIcon icon={faCalendarAlt} />}
              onClick={async () => {
                const newValue = !groupByDate;
                setGroupByDate(newValue);
                if (user?.inboxGroupByDate !== newValue) {
                  try {
                    await updatePreferences({ inboxGroupByDate: newValue });
                  } catch (error) {
                    console.error(
                      'Failed to update group by date preference:',
                      error,
                    );
                  }
                }
              }}
              title="Group by date"
            />
            <Button
              variant={useDenseList ? 'primary' : 'outline-secondary'}
              size="sm"
              icon={<FontAwesomeIcon icon={faList} />}
              onClick={async () => {
                const newValue = !useDenseList;
                setUseDenseList(newValue);
                if (user?.inboxDensity !== newValue) {
                  try {
                    await updatePreferences({ inboxDensity: newValue });
                  } catch (error) {
                    console.error(
                      'Failed to update inbox density preference:',
                      error,
                    );
                  }
                }
              }}
              title="Toggle dense list"
            />
          </ViewControls>
        </SourceViewHeader>

        {showFilters && (
          <div className="mb-3">
            <AdvancedFilters
              filters={combinedFilters}
              onFiltersChange={(newFilters) => {
                // Remove source address from filters if user clears it
                setFilters({
                  ...newFilters,
                  fromContains:
                    newFilters.fromContains === currentSource?.fromAddress
                      ? ''
                      : newFilters.fromContains,
                });
              }}
              onClearFilters={() => setFilters(emptyFilters)}
              onCreateRule={handleCreateRule}
            />
          </div>
        )}

        {/* Create Rule from Filter Button */}
        {hasActiveFilters && step === 'source' && (
          <CreateRuleBanner onCreateRule={handleCreateRule} />
        )}

        <BulkActionsBar>
          <Form.Check
            type="checkbox"
            id="select-all-triage"
            checked={emails.length > 0 && selectedIds.size === emails.length}
            onChange={handleSelectAll}
            label=""
          />
          <SelectionInfo>
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : 'Select emails'}
          </SelectionInfo>

          <ButtonGroup size="sm">
            <Button
              variant="outline-success"
              size="sm"
              icon={<FontAwesomeIcon icon={faEnvelopeOpen} />}
              onClick={() => handleBulkMarkRead(true)}
              disabled={selectedIds.size === 0}
              title="Mark selected as read"
            >
              Read
            </Button>
            <Button
              variant="outline-success"
              size="sm"
              icon={<FontAwesomeIcon icon={faArchive} />}
              onClick={handleBulkArchive}
              disabled={selectedIds.size === 0}
              title="Archive selected"
            >
              Archive
            </Button>
          </ButtonGroup>

          <Dropdown>
            <Dropdown.Toggle
              variant="outline-secondary"
              size="sm"
              disabled={selectedIds.size === 0}
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleBulkMarkRead(false)}>
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                Mark as Unread
              </Dropdown.Item>
              <Dropdown.Item onClick={handleBulkDelete} className="text-danger">
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Delete Selected
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <BulkActionsRight>
            <Button
              variant="success"
              size="sm"
              icon={<FontAwesomeIcon icon={faCheckDouble} />}
              onClick={handleMarkAllAsRead}
              disabled={emailCount === 0}
            >
              Read All
            </Button>
            <Button
              variant="success"
              size="sm"
              icon={<FontAwesomeIcon icon={faCheckDouble} />}
              onClick={handleArchiveAll}
              disabled={emailCount === 0}
            >
              Archive All
            </Button>
            <Dropdown>
              <Dropdown.Toggle
                variant="outline-danger"
                size="sm"
                disabled={emailCount === 0}
              >
                <FontAwesomeIcon icon={faEllipsisV} />
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item
                  onClick={handleDeleteAll}
                  className="text-danger"
                >
                  <FontAwesomeIcon icon={faTrash} className="me-2" />
                  Delete All ({emailCount})
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </BulkActionsRight>
        </BulkActionsBar>

        {emailsLoading ? (
          <LoadingSpinner message="Loading emails..." />
        ) : emails.length === 0 ? (
          <EmptyState>
            <FontAwesomeIcon icon={faInbox} />
            <h3>No more emails!</h3>
            <p>
              {hasActiveFilters
                ? 'No emails match your current filters. Try adjusting them or move on to the next source.'
                : 'All emails from this source have been processed. Move on to the next source!'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setFilters(emptyFilters)}
                className="mt-2"
              >
                Clear Filters
              </Button>
            )}
          </EmptyState>
        ) : groupByDate && groupedEmails && groupedEmails.length > 0 ? (
          <>
            {groupedEmails.map((group) => (
              <div key={group.group} className="mb-4">
                <h6 className="text-muted mb-2 ps-2">
                  {group.group === RecencyGroup.TODAY
                    ? 'Today'
                    : group.group === RecencyGroup.YESTERDAY
                      ? 'Yesterday'
                      : group.group === RecencyGroup.LAST_7_DAYS
                        ? 'Last 7 Days'
                        : group.group === RecencyGroup.LAST_MONTH
                          ? 'Last Month'
                          : group.group === RecencyGroup.LAST_3_MONTHS
                            ? 'Last 3 Months'
                            : group.group === RecencyGroup.LAST_6_MONTHS
                              ? 'Last 6 Months'
                              : group.group === RecencyGroup.LAST_YEAR
                                ? 'Last Year'
                                : 'Older'}
                </h6>
                <EmailListContainer>
                  {group.emails.map((email) => (
                    <EmailComponent
                      key={email.id}
                      email={email}
                      isSelected={selectedIds.has(email.id)}
                      onSelect={(selected) =>
                        handleSelectEmail(email.id, selected)
                      }
                      onEmailClick={() => {}}
                      onStarToggle={() => {}}
                      onMarkRead={() => {}}
                      onReply={() => {}}
                      onDelete={() => {}}
                      onArchive={() => {}}
                      showAccount={false}
                      showTags
                    />
                  ))}
                </EmailListContainer>
              </div>
            ))}
          </>
        ) : (
          <>
            <EmailListContainer>
              {emails.map((email) => (
                <EmailComponent
                  key={email.id}
                  email={email}
                  isSelected={selectedIds.has(email.id)}
                  onSelect={(selected) => handleSelectEmail(email.id, selected)}
                  onEmailClick={() => {}}
                  onStarToggle={() => {}}
                  onMarkRead={() => {}}
                  onReply={() => {}}
                  onDelete={() => {}}
                  onArchive={() => {}}
                  showAccount={false}
                  showTags
                />
              ))}
            </EmailListContainer>

            {totalPages > 1 && (
              <div className="mt-3">
                <InboxPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                  totalCount={emailCount}
                />
              </div>
            )}
          </>
        )}
      </PageContent>

      {/* Create Rule from Filter Modal */}
      <CreateRuleModal
        show={showCreateRuleModal}
        onHide={() => setShowCreateRuleModal(false)}
        initialData={{
          conditions: {
            fromContains: combinedFilters.fromContains || '',
            toContains: combinedFilters.toContains || '',
            ccContains: combinedFilters.ccContains || '',
            bccContains: combinedFilters.bccContains || '',
            subjectContains: combinedFilters.subjectContains || '',
            bodyContains: combinedFilters.bodyContains || '',
          },
          actions: {
            addTagIds: combinedFilters.tagIds || [],
          },
        }}
      />
    </PageWrapper>
  );
}
