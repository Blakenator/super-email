import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Button,
  Modal,
  Alert,
  Badge,
  Accordion,
  Dropdown,
} from 'react-bootstrap';
import { DateTime } from 'luxon';
import {
  GET_EMAIL_QUERY,
  GET_EMAILS_BY_THREAD_QUERY,
  UNSUBSCRIBE_MUTATION,
  GET_TAGS_FOR_INBOX_QUERY,
  ADD_TAGS_TO_EMAILS_MUTATION,
  REMOVE_TAGS_FROM_EMAILS_MUTATION,
} from './queries';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faReply,
  faTrash,
  faBellSlash,
  faUserPlus,
  faCheck,
  faShare,
  faInfoCircle,
  faChevronDown,
  faChevronUp,
  faArchive,
  faInbox,
  faTag,
  faTimes,
  faPlus,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import {
  LoadingSpinner,
  HtmlViewer,
  BackButton,
  ContactFormModal,
  EmailContactCard,
} from '../../core/components';
import toast from 'react-hot-toast';
import { useEmailStore } from '../../stores/emailStore';
import {
  Wrapper,
  Toolbar,
  ToolbarSpacer,
  EmailContent,
  Subject,
  MetaRow,
  SenderInfo,
  SenderRow,
  Recipients,
  EmailDate,
  Body,
  HtmlBodyContainer,
  UnsubscribeBanner,
  ThreadContainer,
  ThreadEmail,
  CurrentEmailBadge,
  NewEmailBadge,
  ThreadEmailHeader,
  ThreadEmailMeta,
  CollapsedPreview,
  HeadersTable,
  HeaderValue,
  TagsContainer,
  TagBadge,
  TagRemoveBtn,
} from './EmailView.wrappers';

interface EmailViewProps {
  emailId: string;
  onBack: () => void;
  onDelete: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
}

export function EmailView({
  emailId,
  onBack,
  onDelete,
  onArchive,
  onUnarchive,
}: EmailViewProps) {
  const navigate = useNavigate();
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showHeadersModal, setShowHeadersModal] = useState(false);
  const [expandedThreadEmails, setExpandedThreadEmails] = useState<Set<string>>(
    new Set([emailId]),
  );

  const { data, loading, refetch } = useQuery(GET_EMAIL_QUERY, {
    variables: { input: { id: emailId } },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Fetch thread emails if this email is part of a thread
  const email = data?.getEmail;
  const {
    data: threadData,
    loading: threadLoading,
    refetch: refetchThread,
  } = useQuery(GET_EMAILS_BY_THREAD_QUERY, {
    variables: { threadId: email?.threadId || '' },
    skip: !email?.threadId || (email?.threadCount ?? 1) <= 1,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const threadEmails = threadData?.getEmailsByThread ?? [];
  const hasThread = threadEmails.length > 1;

  // Track which email IDs were present when the component loaded
  // to identify new emails added via real-time updates
  const initialThreadIdsRef = useRef<Set<string>>(new Set());
  const [newEmailIds, setNewEmailIds] = useState<Set<string>>(new Set());

  // Initialize the initial thread IDs on first load
  useEffect(() => {
    if (threadEmails.length > 0 && initialThreadIdsRef.current.size === 0) {
      initialThreadIdsRef.current = new Set(threadEmails.map((e) => e.id));
    }
  }, [threadEmails]);

  // Subscribe to real-time email updates
  const lastUpdate = useEmailStore((state) => state.lastUpdate);
  const lastRefetchRef = useRef<string | null>(null);

  useEffect(() => {
    // When we receive new emails via subscription, refetch thread data
    if (lastUpdate && lastUpdate !== lastRefetchRef.current) {
      lastRefetchRef.current = lastUpdate;

      // Refetch thread to get any new emails
      if (email?.threadId && hasThread) {
        refetchThread().then((result) => {
          // Identify which emails are new
          const newIds = new Set<string>();
          const updatedEmails = result.data?.getEmailsByThread ?? [];
          for (const threadEmail of updatedEmails) {
            if (!initialThreadIdsRef.current.has(threadEmail.id)) {
              newIds.add(threadEmail.id);
              // Auto-expand new emails
              setExpandedThreadEmails(
                (prev) => new Set([...prev, threadEmail.id]),
              );
            }
          }
          if (newIds.size > 0) {
            setNewEmailIds((prev) => new Set([...prev, ...newIds]));
            toast.success(
              `${newIds.size} new message${newIds.size > 1 ? 's' : ''} in this thread!`,
              { icon: '💬' },
            );
          }
        });
      }

      // Also refetch the main email
      refetch();
    }
  }, [lastUpdate, email?.threadId, hasThread, refetchThread, refetch]);

  const [unsubscribe, { loading: unsubscribing }] = useMutation(
    UNSUBSCRIBE_MUTATION,
    {
      onCompleted: () => {
        toast.success('Successfully unsubscribed!');
        setShowUnsubscribeModal(false);
        refetch();
      },
      onError: (err) => {
        toast.error(`Failed to unsubscribe: ${err.message}`);
      },
    },
  );

  // Tags functionality
  const { data: tagsData } = useQuery(GET_TAGS_FOR_INBOX_QUERY);
  const availableTags = tagsData?.getTags ?? [];
  const emailTags = email?.tags ?? [];
  const unassignedTags = availableTags.filter(
    (tag) => !emailTags.some((et) => et.id === tag.id),
  );

  const [addTagsToEmails] = useMutation(ADD_TAGS_TO_EMAILS_MUTATION, {
    refetchQueries: [
      { query: GET_EMAIL_QUERY, variables: { input: { id: emailId } } },
    ],
    onCompleted: () => toast.success('Tag added'),
    onError: (err) => toast.error(`Failed to add tag: ${err.message}`),
  });

  const [removeTagsFromEmails] = useMutation(REMOVE_TAGS_FROM_EMAILS_MUTATION, {
    refetchQueries: [
      { query: GET_EMAIL_QUERY, variables: { input: { id: emailId } } },
    ],
    onCompleted: () => toast.success('Tag removed'),
    onError: (err) => toast.error(`Failed to remove tag: ${err.message}`),
  });

  const handleAddTag = (tagId: string) => {
    addTagsToEmails({
      variables: {
        input: {
          emailIds: [emailId],
          tagIds: [tagId],
        },
      },
    });
  };

  const handleRemoveTag = (tagId: string) => {
    removeTagsFromEmails({
      variables: {
        input: {
          emailIds: [emailId],
          tagIds: [tagId],
        },
      },
    });
  };

  // Handle escape key to go back
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    },
    [onBack],
  );

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      onBack();
    };

    window.history.pushState({ emailView: true }, '');
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBack, handleKeyDown]);

  const formatDate = (dateStr: string) => {
    const date = DateTime.fromISO(dateStr);
    if (!date.isValid) return dateStr;
    // Format: "Mon, Nov 20, 2024, 2:30 PM"
    return date.toFormat('ccc, LLL d, yyyy, h:mm a');
  };

  const handleReply = () => {
    if (email) {
      // Build thread emails array for full conversation context
      const threadEmailsForReply = hasThread
        ? threadEmails.map((te) => ({
            from: te.fromName || te.fromAddress,
            fromAddress: te.fromAddress,
            date: te.receivedAt,
            body: te.textBody || '',
            htmlBody: te.htmlBody,
          }))
        : undefined;

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
            threadEmails: threadEmailsForReply,
          },
        },
      });
    }
  };

  const handleForward = () => {
    if (email) {
      navigate('/compose', {
        state: {
          forward: {
            originalEmailId: email.id,
            subject: email.subject.startsWith('Fwd:')
              ? email.subject
              : `Fwd: ${email.subject}`,
            originalBody: email.textBody,
            originalHtmlBody: email.htmlBody,
            originalFrom: email.fromName || email.fromAddress,
            originalFromAddress: email.fromAddress,
            originalDate: email.receivedAt,
            originalTo: email.toAddresses,
            originalCc: email.ccAddresses,
            emailAccountId: email.emailAccountId,
          },
        },
      });
    }
  };

  const handleUnsubscribe = () => {
    if (email) {
      unsubscribe({ variables: { input: { emailId: email.id } } });
    }
  };

  const toggleThreadEmail = useCallback((id: string) => {
    setExpandedThreadEmails((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const hasUnsubscribeOption = email?.unsubscribeUrl || email?.unsubscribeEmail;

  if (loading) {
    return (
      <Wrapper>
        <LoadingSpinner message="Loading email..." />
      </Wrapper>
    );
  }

  if (!email) {
    return (
      <Wrapper>
        <Toolbar>
          <BackButton onClick={onBack} label="Back" />
        </Toolbar>
        <EmailContent>
          <div className="text-center text-muted">Email not found</div>
        </EmailContent>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Toolbar>
        <BackButton onClick={onBack} label="Back" />
        <Button variant="primary" onClick={handleReply}>
          <FontAwesomeIcon icon={faReply} className="me-1" />
          Reply
        </Button>
        <Button variant="outline-primary" onClick={handleForward}>
          <FontAwesomeIcon icon={faShare} className="me-1" />
          Forward
        </Button>
        <Button
          variant="outline-secondary"
          onClick={() => setShowAddContactModal(true)}
          title="Add sender to contacts"
        >
          <FontAwesomeIcon icon={faUserPlus} className="me-1" />
          Add Contact
        </Button>
        <Button
          variant="outline-secondary"
          onClick={() => setShowHeadersModal(true)}
          title="View email headers"
        >
          <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
          More Info
        </Button>
        <ToolbarSpacer />
        {hasUnsubscribeOption && !email.isUnsubscribed && (
          <Button
            variant="outline-warning"
            onClick={() => setShowUnsubscribeModal(true)}
            title="Unsubscribe from this mailing list"
          >
            <FontAwesomeIcon icon={faBellSlash} className="me-1" />
            Unsubscribe
          </Button>
        )}
        {onArchive && (
          <Button variant="outline-secondary" onClick={onArchive}>
            <FontAwesomeIcon icon={faArchive} className="me-1" />
            Archive
          </Button>
        )}
        {onUnarchive && (
          <Button variant="outline-info" onClick={onUnarchive}>
            <FontAwesomeIcon icon={faInbox} className="me-1" />
            Move to Inbox
          </Button>
        )}
        <Button variant="outline-danger" onClick={onDelete}>
          <FontAwesomeIcon icon={faTrash} className="me-1" />
          Delete
        </Button>
      </Toolbar>

      <EmailContent>
        {email.isUnsubscribed && (
          <UnsubscribeBanner variant="success">
            <span>
              <FontAwesomeIcon icon={faCheck} className="me-2" />
              You have unsubscribed from this mailing list.
            </span>
          </UnsubscribeBanner>
        )}

        <Subject>
          {email.subject}
          {hasThread && (
            <Badge bg="primary" className="ms-2">
              {threadEmails.length} messages in thread
            </Badge>
          )}
        </Subject>

        {/* Tags Section */}
        <TagsContainer>
          <FontAwesomeIcon
            icon={faTag}
            style={{ color: '#6c757d', marginRight: 4 }}
          />
          {emailTags.map((tag) => (
            <TagBadge key={tag.id} $bgColor={tag.color}>
              {tag.name}
              <TagRemoveBtn
                onClick={() => handleRemoveTag(tag.id)}
                title="Remove tag"
              >
                <FontAwesomeIcon icon={faTimes} />
              </TagRemoveBtn>
            </TagBadge>
          ))}
          {unassignedTags.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle
                variant="outline-secondary"
                size="sm"
                id="add-tag-dropdown"
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Add Tag
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {unassignedTags.map((tag) => (
                  <Dropdown.Item
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
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
          {emailTags.length === 0 && unassignedTags.length === 0 && (
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              No tags available
            </span>
          )}
        </TagsContainer>

        {hasThread ? (
          <ThreadContainer>
            {threadEmails.map((threadEmail) => {
              const isExpanded = expandedThreadEmails.has(threadEmail.id);
              const isCurrentEmail = threadEmail.id === emailId;
              const isNewEmail = newEmailIds.has(threadEmail.id);

              return (
                <ThreadEmail
                  key={threadEmail.id}
                  $isSelected={isCurrentEmail || isNewEmail}
                >
                  {isNewEmail && (
                    <NewEmailBadge bg="success">
                      <FontAwesomeIcon icon={faStar} className="me-1" />
                      New
                    </NewEmailBadge>
                  )}
                  {isCurrentEmail && (
                    <CurrentEmailBadge bg="primary">
                      Current Email
                    </CurrentEmailBadge>
                  )}
                  <ThreadEmailHeader
                    onClick={() => toggleThreadEmail(threadEmail.id)}
                  >
                    <ThreadEmailMeta>
                      <SenderRow>
                        <EmailContactCard
                          email={threadEmail.fromAddress}
                          name={threadEmail.fromName}
                          showIcon
                        />
                      </SenderRow>
                      {!isExpanded && (
                        <CollapsedPreview>
                          {threadEmail.textBody?.substring(0, 100) ||
                            '(No content)'}
                        </CollapsedPreview>
                      )}
                    </ThreadEmailMeta>
                    <div className="d-flex align-items-center gap-2">
                      <EmailDate>
                        {formatDate(threadEmail.receivedAt)}
                      </EmailDate>
                      <FontAwesomeIcon
                        icon={isExpanded ? faChevronUp : faChevronDown}
                      />
                    </div>
                  </ThreadEmailHeader>

                  {isExpanded && (
                    <>
                      <Recipients>
                        To:{' '}
                        {threadEmail.toAddresses.map((addr, idx) => (
                          <span key={addr}>
                            {idx > 0 && ', '}
                            <EmailContactCard email={addr} enablePopover />
                          </span>
                        ))}
                        {threadEmail.ccAddresses &&
                          threadEmail.ccAddresses.length > 0 && (
                            <span>
                              {' • CC: '}
                              {threadEmail.ccAddresses.map((addr, idx) => (
                                <span key={addr}>
                                  {idx > 0 && ', '}
                                  <EmailContactCard
                                    email={addr}
                                    enablePopover
                                  />
                                </span>
                              ))}
                            </span>
                          )}
                      </Recipients>
                      {threadEmail.htmlBody ? (
                        <HtmlBodyContainer>
                          <HtmlViewer html={threadEmail.htmlBody} />
                        </HtmlBodyContainer>
                      ) : (
                        <Body>{threadEmail.textBody || '(No content)'}</Body>
                      )}
                    </>
                  )}
                </ThreadEmail>
              );
            })}
          </ThreadContainer>
        ) : (
          <>
            <MetaRow>
              <SenderInfo>
                <SenderRow>
                  <EmailContactCard
                    email={email.fromAddress}
                    name={email.fromName}
                    showIcon
                  />
                </SenderRow>
                <Recipients>
                  To:{' '}
                  {email.toAddresses.map((addr, idx) => (
                    <span key={addr}>
                      {idx > 0 && ', '}
                      <EmailContactCard email={addr} enablePopover />
                    </span>
                  ))}
                  {email.ccAddresses && email.ccAddresses.length > 0 && (
                    <span>
                      {' • CC: '}
                      {email.ccAddresses.map((addr, idx) => (
                        <span key={addr}>
                          {idx > 0 && ', '}
                          <EmailContactCard email={addr} enablePopover />
                        </span>
                      ))}
                    </span>
                  )}
                </Recipients>
              </SenderInfo>
              <EmailDate>{formatDate(email.receivedAt)}</EmailDate>
            </MetaRow>

            {email.htmlBody ? (
              <HtmlBodyContainer>
                <HtmlViewer html={email.htmlBody} />
              </HtmlBodyContainer>
            ) : (
              <Body>{email.textBody || '(No content)'}</Body>
            )}
          </>
        )}
      </EmailContent>

      {/* Unsubscribe Confirmation Modal */}
      <Modal
        show={showUnsubscribeModal}
        onHide={() => setShowUnsubscribeModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Unsubscribe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to unsubscribe from this mailing list?</p>

          {email?.unsubscribeUrl && (
            <Alert variant="success" className="small mb-2">
              <strong>One-Click Unsubscribe (URL)</strong>
              <br />
              <span className="text-muted">
                We will automatically send an unsubscribe request to:
              </span>
              <br />
              <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {email.unsubscribeUrl}
              </code>
            </Alert>
          )}

          {email?.unsubscribeEmail && !email?.unsubscribeUrl && (
            <Alert variant="warning" className="small mb-2">
              <strong>Email-Based Unsubscribe</strong>
              <br />
              <span className="text-muted">
                This will send an unsubscribe email from your account to:
              </span>
              <br />
              <code>{email.unsubscribeEmail}</code>
              <br />
              <small className="text-muted mt-2 d-block">
                ⚠️ Note: An email will be sent from your configured SMTP
                profile.
              </small>
            </Alert>
          )}

          {email?.unsubscribeEmail && email?.unsubscribeUrl && (
            <Alert variant="secondary" className="small mb-2">
              <strong>Alternative: Email-Based Unsubscribe</strong>
              <br />
              <span className="text-muted">
                If the URL doesn't work, you can email:{' '}
              </span>
              <code>{email.unsubscribeEmail}</code>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowUnsubscribeModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={handleUnsubscribe}
            disabled={unsubscribing}
          >
            {unsubscribing ? 'Unsubscribing...' : 'Unsubscribe'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Contact Modal */}
      <ContactFormModal
        show={showAddContactModal}
        onHide={() => setShowAddContactModal(false)}
        initialData={{
          email: email?.fromAddress || '',
          name: email?.fromName || '',
          firstName: email?.fromName?.split(' ')[0] || '',
          lastName: email?.fromName?.split(' ').slice(1).join(' ') || '',
          company: '',
          phone: '',
          notes: '',
        }}
        onSuccess={() => {
          setShowAddContactModal(false);
        }}
      />

      {/* Email Headers Modal */}
      <Modal
        show={showHeadersModal}
        onHide={() => setShowHeadersModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Email Headers</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {email?.headers ? (
            <HeadersTable>
              <tbody>
                {Object.entries(email.headers).map(([key, value]) => {
                  let displayValue: string;

                  if (value === null || value === undefined) {
                    displayValue = '';
                  } else if (typeof value === 'object') {
                    // Pretty-print JSON objects
                    displayValue = JSON.stringify(value, null, 2);
                  } else if (Array.isArray(value)) {
                    displayValue = value.join('\n');
                  } else if (typeof value === 'string') {
                    // Check if it's a JSON string
                    try {
                      const parsed = JSON.parse(value);
                      if (typeof parsed === 'object') {
                        displayValue = JSON.stringify(parsed, null, 2);
                      } else {
                        displayValue = value;
                      }
                    } catch {
                      displayValue = value;
                    }
                  } else {
                    displayValue = String(value);
                  }

                  return (
                    <tr key={key}>
                      <th>{key}</th>
                      <td>
                        <HeaderValue>{displayValue}</HeaderValue>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </HeadersTable>
          ) : (
            <p className="text-muted">No headers available for this email.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowHeadersModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Wrapper>
  );
}
