import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Modal, Alert, Dropdown } from 'react-bootstrap';
import { Button } from '../../core/components/Button';
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
  faEllipsisV,
} from '@fortawesome/free-solid-svg-icons';
import {
  LoadingSpinner,
  HtmlViewer,
  BackButton,
  ContactFormModal,
  EmailContactCard,
  StickyHeader,
} from '../../core/components';
import toast from 'react-hot-toast';
import { useEmailStore } from '../../stores/emailStore';
import { AttachmentList, AttachmentPreview } from '../../components';
import type { Attachment } from '../../__generated__/graphql';
import { supabase } from '../../contexts/AuthContext';
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
  EmailActions,
  ActionButton,
  ActionButtonDanger,
  MoreActionsDropdown,
  GlobalHeaderSubject,
  ThreadCount,
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
  // Track which email's modals are being shown
  const [activeEmailForModal, setActiveEmailForModal] = useState<string | null>(
    null,
  );
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null,
  );

  // Track the current emailId to detect changes
  const currentEmailIdRef = useRef(emailId);

  // Helper function to download an attachment with authentication
  const downloadAttachment = async (attachment: Attachment) => {
    try {
      // Get token from Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      console.log('[EmailView] downloadAttachment:', {
        attachmentId: attachment.id,
        hasToken: !!token,
      });

      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Fetch download URL from GraphQL
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `query GetAttachmentDownloadUrl($id: String!) { getAttachmentDownloadUrl(id: $id) }`,
          variables: { id: attachment.id },
        }),
      });

      const result = await response.json();
      const downloadUrl = result.data?.getAttachmentDownloadUrl;

      console.log('[EmailView] Got download URL:', downloadUrl);

      if (!downloadUrl) {
        throw new Error('Failed to get download URL');
      }

      // Fetch the actual file with auth header
      console.log('[EmailView] Fetching file from:', downloadUrl);
      const fileResponse = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[EmailView] File response:', {
        status: fileResponse.status,
        ok: fileResponse.ok,
      });

      if (!fileResponse.ok) {
        const errorText = await fileResponse.text();
        console.error('[EmailView] File fetch error:', errorText);
        throw new Error(`Failed to download file: ${fileResponse.status}`);
      }

      // Create a blob and trigger download
      const blob = await fileResponse.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download attachment');
    }
  };

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
    notifyOnNetworkStatusChange: true,
  });

  const threadEmails = threadData?.getEmailsByThread ?? [];
  const hasThread = threadEmails.length > 1;

  // Track which email IDs were present when the component loaded
  // to identify new emails added via real-time updates
  const initialThreadIdsRef = useRef<Set<string>>(new Set());
  const [newEmailIds, setNewEmailIds] = useState<Set<string>>(new Set());

  // Reset state when emailId changes (user navigates to different email)
  useEffect(() => {
    if (emailId !== currentEmailIdRef.current) {
      currentEmailIdRef.current = emailId;
      // Reset expanded state to show the new email
      setExpandedThreadEmails(new Set([emailId]));
      // Reset tracking refs for the new email context
      initialThreadIdsRef.current = new Set();
      setNewEmailIds(new Set());
    }
  }, [emailId]);

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

  const handleReply = useCallback(
    (targetEmail: typeof email) => {
      if (targetEmail) {
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
              to: targetEmail.fromAddress,
              subject: targetEmail.subject.startsWith('Re:')
                ? targetEmail.subject
                : `Re: ${targetEmail.subject}`,
              inReplyTo: targetEmail.messageId,
              originalBody: targetEmail.textBody,
              originalHtmlBody: targetEmail.htmlBody,
              originalFrom: targetEmail.fromName || targetEmail.fromAddress,
              originalDate: targetEmail.receivedAt,
              emailAccountId: targetEmail.emailAccountId,
              threadEmails: threadEmailsForReply,
            },
          },
        });
      }
    },
    [hasThread, threadEmails, navigate],
  );

  const handleForward = useCallback(
    (targetEmail: typeof email) => {
      if (targetEmail) {
        navigate('/compose', {
          state: {
            forward: {
              originalEmailId: targetEmail.id,
              subject: targetEmail.subject.startsWith('Fwd:')
                ? targetEmail.subject
                : `Fwd: ${targetEmail.subject}`,
              originalBody: targetEmail.textBody,
              originalHtmlBody: targetEmail.htmlBody,
              originalFrom: targetEmail.fromName || targetEmail.fromAddress,
              originalFromAddress: targetEmail.fromAddress,
              originalDate: targetEmail.receivedAt,
              originalTo: targetEmail.toAddresses,
              originalCc: targetEmail.ccAddresses,
              emailAccountId: targetEmail.emailAccountId,
            },
          },
        });
      }
    },
    [navigate],
  );

  const handleUnsubscribe = useCallback(
    (targetEmailId: string) => {
      unsubscribe({ variables: { input: { emailId: targetEmailId } } });
    },
    [unsubscribe],
  );

  // Get email for modal display (either active or main email)
  const getEmailForModal = useCallback(() => {
    if (activeEmailForModal) {
      return threadEmails.find((e) => e.id === activeEmailForModal) || email;
    }
    return email;
  }, [activeEmailForModal, threadEmails, email]);

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

  // Show loading spinner only when no email data exists
  // or when navigating to a different email (stale data from previous email)
  const isStaleData = email && email.id !== emailId;
  if (!email || isStaleData) {
    return (
      <Wrapper>
        <LoadingSpinner message="Loading email..." />
      </Wrapper>
    );
  }

  // Helper to render action buttons for an email
  const renderEmailActions = (
    targetEmail: typeof email,
    showFullActions = false,
  ) => {
    if (!targetEmail) return null;

    const hasUnsubscribe =
      targetEmail.unsubscribeUrl || targetEmail.unsubscribeEmail;

    return (
      <EmailActions onClick={(e) => e.stopPropagation()}>
        <ActionButton onClick={() => handleReply(targetEmail)} title="Reply">
          <FontAwesomeIcon icon={faReply} />
        </ActionButton>
        <ActionButton
          onClick={() => handleForward(targetEmail)}
          title="Forward"
        >
          <FontAwesomeIcon icon={faShare} />
        </ActionButton>
        {onArchive && (
          <ActionButton onClick={onArchive} title="Archive">
            <FontAwesomeIcon icon={faArchive} />
          </ActionButton>
        )}
        {onUnarchive && (
          <ActionButton onClick={onUnarchive} title="Move to Inbox">
            <FontAwesomeIcon icon={faInbox} />
          </ActionButton>
        )}
        {unassignedTags.length > 0 && (
          <Dropdown>
            <Dropdown.Toggle
              as={ActionButton}
              id={`add-tag-quick-${targetEmail.id}`}
              title="Add Tag"
            >
              <FontAwesomeIcon icon={faTag} />
            </Dropdown.Toggle>
            <Dropdown.Menu align="end">
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
        <MoreActionsDropdown>
          <Dropdown>
            <Dropdown.Toggle
              as={ActionButton}
              id={`more-actions-${targetEmail.id}`}
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </Dropdown.Toggle>
            <Dropdown.Menu align="end">
              <Dropdown.Item
                onClick={() => {
                  setActiveEmailForModal(targetEmail.id);
                  setShowAddContactModal(true);
                }}
              >
                <FontAwesomeIcon icon={faUserPlus} />
                Add to Contacts
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => {
                  setActiveEmailForModal(targetEmail.id);
                  setShowHeadersModal(true);
                }}
              >
                <FontAwesomeIcon icon={faInfoCircle} />
                View Headers
              </Dropdown.Item>
              {hasUnsubscribe && !targetEmail.isUnsubscribed && (
                <Dropdown.Item
                  onClick={() => {
                    setActiveEmailForModal(targetEmail.id);
                    setShowUnsubscribeModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faBellSlash} />
                  Unsubscribe
                </Dropdown.Item>
              )}
              <Dropdown.Divider />
              <Dropdown.Item className="text-danger" onClick={onDelete}>
                <FontAwesomeIcon icon={faTrash} />
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </MoreActionsDropdown>
      </EmailActions>
    );
  };

  return (
    <Wrapper>
      <StickyHeader>
        <BackButton onClick={onBack} label="Back" />
        <GlobalHeaderSubject>{email.subject}</GlobalHeaderSubject>
        {hasThread && (
          <ThreadCount bg="primary">{threadEmails.length} messages</ThreadCount>
        )}
      </StickyHeader>

      <EmailContent>
        {email.isUnsubscribed && (
          <UnsubscribeBanner variant="success">
            <span>
              <FontAwesomeIcon icon={faCheck} className="me-2" />
              You have unsubscribed from this mailing list.
            </span>
          </UnsubscribeBanner>
        )}

        {/* Tags Section */}
        {emailTags.length > 0 && (
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
          </TagsContainer>
        )}

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
                      {isExpanded && renderEmailActions(threadEmail)}
                      <FontAwesomeIcon
                        icon={isExpanded ? faChevronUp : faChevronDown}
                        style={{ marginLeft: '8px' }}
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
                      {threadEmail.attachments &&
                        threadEmail.attachments.length > 0 && (
                          <AttachmentList
                            attachments={threadEmail.attachments}
                            onPreview={(att) => setPreviewAttachment(att)}
                            onDownload={downloadAttachment}
                          />
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
              <div className="d-flex align-items-center gap-2">
                <EmailDate>{formatDate(email.receivedAt)}</EmailDate>
                {renderEmailActions(email)}
              </div>
            </MetaRow>

            {/* Subject for single email view */}
            <Subject>{email.subject}</Subject>

            {email.htmlBody ? (
              <HtmlBodyContainer>
                <HtmlViewer html={email.htmlBody} />
              </HtmlBodyContainer>
            ) : (
              <Body>{email.textBody || '(No content)'}</Body>
            )}
            {email.attachments && email.attachments.length > 0 && (
              <AttachmentList
                attachments={email.attachments}
                onPreview={(att) => setPreviewAttachment(att)}
                onDownload={downloadAttachment}
              />
            )}
          </>
        )}
      </EmailContent>
      {loading && <LoadingSpinner message="Loading email..." />}

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <AttachmentPreview
          attachment={previewAttachment}
          onClose={() => {
            console.log('[EmailView] Closing preview');
            setPreviewAttachment(null);
          }}
          onDownload={() => downloadAttachment(previewAttachment)}
        />
      )}

      {/* Unsubscribe Confirmation Modal */}
      <Modal
        show={showUnsubscribeModal}
        onHide={() => {
          setShowUnsubscribeModal(false);
          setActiveEmailForModal(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Unsubscribe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(() => {
            const modalEmail = getEmailForModal();
            return (
              <>
                <p>
                  Are you sure you want to unsubscribe from this mailing list?
                </p>

                {modalEmail?.unsubscribeUrl && (
                  <Alert variant="success" className="small mb-2">
                    <strong>One-Click Unsubscribe (URL)</strong>
                    <br />
                    <span className="text-muted">
                      We will automatically send an unsubscribe request to:
                    </span>
                    <br />
                    <code
                      style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}
                    >
                      {modalEmail.unsubscribeUrl}
                    </code>
                  </Alert>
                )}

                {modalEmail?.unsubscribeEmail &&
                  !modalEmail?.unsubscribeUrl && (
                    <Alert variant="warning" className="small mb-2">
                      <strong>Email-Based Unsubscribe</strong>
                      <br />
                      <span className="text-muted">
                        This will send an unsubscribe email from your account
                        to:
                      </span>
                      <br />
                      <code>{modalEmail.unsubscribeEmail}</code>
                      <br />
                      <small className="text-muted mt-2 d-block">
                        ⚠️ Note: An email will be sent from your configured SMTP
                        profile.
                      </small>
                    </Alert>
                  )}

                {modalEmail?.unsubscribeEmail && modalEmail?.unsubscribeUrl && (
                  <Alert variant="secondary" className="small mb-2">
                    <strong>Alternative: Email-Based Unsubscribe</strong>
                    <br />
                    <span className="text-muted">
                      If the URL doesn't work, you can email:{' '}
                    </span>
                    <code>{modalEmail.unsubscribeEmail}</code>
                  </Alert>
                )}
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowUnsubscribeModal(false);
              setActiveEmailForModal(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={() => {
              const modalEmail = getEmailForModal();
              if (modalEmail) {
                handleUnsubscribe(modalEmail.id);
              }
            }}
            disabled={unsubscribing}
            loading={unsubscribing}
          >
            Unsubscribe
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Contact Modal */}
      <ContactFormModal
        show={showAddContactModal}
        onHide={() => {
          setShowAddContactModal(false);
          setActiveEmailForModal(null);
        }}
        initialData={(() => {
          const modalEmail = getEmailForModal();
          return {
            email: modalEmail?.fromAddress || '',
            name: modalEmail?.fromName || '',
            firstName: modalEmail?.fromName?.split(' ')[0] || '',
            lastName: modalEmail?.fromName?.split(' ').slice(1).join(' ') || '',
            company: '',
            phone: '',
            notes: '',
          };
        })()}
        onSuccess={() => {
          setShowAddContactModal(false);
          setActiveEmailForModal(null);
        }}
      />

      {/* Email Headers Modal */}
      <Modal
        show={showHeadersModal}
        onHide={() => {
          setShowHeadersModal(false);
          setActiveEmailForModal(null);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Email Headers</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {(() => {
            const modalEmail = getEmailForModal();
            return modalEmail?.headers ? (
              <HeadersTable>
                <tbody>
                  {Object.entries(modalEmail.headers).map(([key, value]) => {
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
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowHeadersModal(false);
              setActiveEmailForModal(null);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Wrapper>
  );
}
