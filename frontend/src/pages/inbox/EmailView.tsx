import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Button, Modal, Alert, Badge, Accordion } from 'react-bootstrap';
import styled from 'styled-components';
import {
  GET_EMAIL_QUERY,
  GET_EMAILS_BY_THREAD_QUERY,
  UNSUBSCRIBE_MUTATION,
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
} from '@fortawesome/free-solid-svg-icons';
import {
  LoadingSpinner,
  HtmlViewer,
  BackButton,
  ContactFormModal,
} from '../../core/components';
import toast from 'react-hot-toast';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${({ theme }) => theme.colors.backgroundWhite};
`;

const Toolbar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
  flex-wrap: wrap;
`;

const ToolbarSpacer = styled.div`
  flex: 1;
`;

const EmailContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Subject = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const SenderInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const SenderRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SenderName = styled.strong`
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const SenderEmail = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Recipients = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const EmailDate = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: right;
`;

const Body = styled.div`
  white-space: pre-wrap;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const HtmlBodyContainer = styled.div`
  max-height: calc(100vh - 300px);
  overflow: auto;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.backgroundWhite};
`;

const UnsubscribeBanner = styled(Alert)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ThreadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ThreadEmail = styled.div<{ $isSelected?: boolean }>`
  border: 1px solid
    ${(props) =>
      props.$isSelected
        ? props.theme.colors.primary
        : props.theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${(props) =>
    props.$isSelected
      ? `${props.theme.colors.primary}08`
      : props.theme.colors.backgroundWhite};
`;

const ThreadEmailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ThreadEmailMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CollapsedPreview = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
`;

const HeadersTable = styled.table`
  width: 100%;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border-collapse: collapse;

  th,
  td {
    padding: ${({ theme }) => theme.spacing.sm};
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
    text-align: left;
    vertical-align: top;
  }

  th {
    width: 140px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textSecondary};
    white-space: nowrap;
    background: ${({ theme }) => theme.colors.background};
  }

  td {
    word-break: break-word;
  }
`;

const HeaderValue = styled.pre`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
`;

interface EmailViewProps {
  emailId: string;
  onBack: () => void;
  onDelete: () => void;
}

export function EmailView({ emailId, onBack, onDelete }: EmailViewProps) {
  const navigate = useNavigate();
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showHeadersModal, setShowHeadersModal] = useState(false);
  const [expandedThreadEmails, setExpandedThreadEmails] = useState<Set<string>>(
    new Set([emailId]),
  );

  const { data, loading, refetch } = useQuery(GET_EMAIL_QUERY, {
    variables: { input: { id: emailId } },
  });

  // Fetch thread emails if this email is part of a thread
  const email = data?.getEmail;
  const { data: threadData, loading: threadLoading } = useQuery(
    GET_EMAILS_BY_THREAD_QUERY,
    {
      variables: { threadId: email?.threadId || '' },
      skip: !email?.threadId || (email?.threadCount ?? 1) <= 1,
    },
  );

  const threadEmails = threadData?.getEmailsByThread ?? [];
  const hasThread = threadEmails.length > 1;

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
    const date = new Date(dateStr);
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

        {hasThread ? (
          <ThreadContainer>
            {threadEmails.map((threadEmail) => {
              const isExpanded = expandedThreadEmails.has(threadEmail.id);
              const isCurrentEmail = threadEmail.id === emailId;

              return (
                <ThreadEmail key={threadEmail.id} $isSelected={isCurrentEmail}>
                  <ThreadEmailHeader
                    onClick={() => toggleThreadEmail(threadEmail.id)}
                  >
                    <ThreadEmailMeta>
                      <SenderRow>
                        <SenderName>
                          {threadEmail.fromName || threadEmail.fromAddress}
                        </SenderName>
                        {threadEmail.fromName && (
                          <SenderEmail>
                            &lt;{threadEmail.fromAddress}&gt;
                          </SenderEmail>
                        )}
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
                        To: {threadEmail.toAddresses.join(', ')}
                        {threadEmail.ccAddresses &&
                          threadEmail.ccAddresses.length > 0 && (
                            <span>
                              {' '}
                              • CC: {threadEmail.ccAddresses.join(', ')}
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
                  <SenderName>{email.fromName || email.fromAddress}</SenderName>
                  {email.fromName && (
                    <SenderEmail>&lt;{email.fromAddress}&gt;</SenderEmail>
                  )}
                </SenderRow>
                <Recipients>
                  To: {email.toAddresses.join(', ')}
                  {email.ccAddresses && email.ccAddresses.length > 0 && (
                    <span> • CC: {email.ccAddresses.join(', ')}</span>
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
