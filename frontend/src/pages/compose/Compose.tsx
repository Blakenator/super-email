import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
} from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router';
import toast from 'react-hot-toast';
import {
  GET_SMTP_PROFILES_QUERY,
  GET_EMAIL_ACCOUNTS_QUERY,
  SEND_EMAIL_MUTATION,
  SAVE_DRAFT_MUTATION,
} from './queries';
import {
  LoadingSpinner,
  RichTextEditor,
  BackButton,
  EmailChipInput,
} from '../../core/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faReply,
  faPen,
  faPaperPlane,
  faSave,
  faTimes,
  faShare,
} from '@fortawesome/free-solid-svg-icons';
import {
  PageWrapper,
  StickyHeader,
  Title,
  HeaderActions,
  ContentArea,
  ComposeCard,
  CcBccToggle,
} from './Compose.wrappers';

interface ThreadEmailInfo {
  from: string;
  fromAddress: string;
  date: string;
  body: string;
  htmlBody?: string;
}

interface ReplyToState {
  to: string;
  subject: string;
  inReplyTo: string;
  originalBody: string;
  originalHtmlBody?: string;
  originalFrom: string;
  originalDate: string;
  emailAccountId?: string;
  threadEmails?: ThreadEmailInfo[]; // All emails in thread for full context
}

interface DraftState {
  draftId: string;
  emailAccountId: string;
  smtpProfileId?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  htmlBody?: string;
  originalBody?: string;
  originalHtmlBody?: string;
  originalFrom?: string;
  originalDate?: string;
  inReplyTo?: string;
}

interface ForwardState {
  originalEmailId: string;
  subject: string;
  originalBody?: string;
  originalHtmlBody?: string;
  originalFrom: string;
  originalFromAddress: string;
  originalDate: string;
  originalTo?: string[];
  originalCc?: string[] | null;
  emailAccountId?: string;
}

export function Compose() {
  const navigate = useNavigate();
  const location = useLocation();
  const replyTo = location.state?.replyTo as ReplyToState | undefined;
  const existingDraft = location.state?.draft as DraftState | undefined;
  const forward = location.state?.forward as ForwardState | undefined;

  const [emailAccountId, setEmailAccountId] = useState(
    existingDraft?.emailAccountId ||
      replyTo?.emailAccountId ||
      forward?.emailAccountId ||
      '',
  );
  const [smtpProfileId, setSmtpProfileId] = useState(
    existingDraft?.smtpProfileId || '',
  );
  const [toAddresses, setToAddresses] = useState(
    existingDraft?.to || replyTo?.to || '',
  );
  const [ccAddresses, setCcAddresses] = useState(existingDraft?.cc || '');
  const [bccAddresses, setBccAddresses] = useState(existingDraft?.bcc || '');
  const [subject, setSubject] = useState(
    existingDraft?.subject || replyTo?.subject || forward?.subject || '',
  );
  const [htmlBody, setHtmlBody] = useState(existingDraft?.htmlBody || '');
  const [textBody, setTextBody] = useState(existingDraft?.body || '');
  const [error, setError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(
    existingDraft?.draftId || null,
  );
  const [showCcBcc, setShowCcBcc] = useState(
    !!(existingDraft?.cc || existingDraft?.bcc),
  );

  // Track if content has changed for auto-save
  const initialContentRef = useRef({
    to: toAddresses,
    cc: ccAddresses,
    bcc: bccAddresses,
    subject,
    textBody,
  });
  const hasChanges = useCallback(() => {
    const initial = initialContentRef.current;
    return (
      toAddresses !== initial.to ||
      ccAddresses !== initial.cc ||
      bccAddresses !== initial.bcc ||
      subject !== initial.subject ||
      textBody !== initial.textBody
    );
  }, [toAddresses, ccAddresses, bccAddresses, subject, textBody]);

  // Get original message info for drafts/replies/forwards
  const originalInfo = replyTo || existingDraft || forward;

  // Build initial HTML content with quoted reply/forward at the bottom
  const buildInitialHtml = useCallback(() => {
    // For existing drafts, use the saved HTML
    if (existingDraft?.htmlBody) {
      return existingDraft.htmlBody;
    }

    // For forwards, include forwarded message in an editable blockquote
    if (forward && !existingDraft) {
      const quotedHtml =
        forward.originalHtmlBody ||
        `<p>${(forward.originalBody || '').replace(/\n/g, '<br>')}</p>`;

      const dateStr = forward.originalDate
        ? new Date(forward.originalDate).toLocaleString()
        : '';

      const originalTo = forward.originalTo?.join(', ') || '';
      const originalCc = forward.originalCc?.join(', ') || '';

      return `<p><br></p><p><br></p><blockquote style="margin: 0.5rem 0; padding: 0.5rem 1rem; border-left: 3px solid #667eea; background: #f8f9fa; color: #6c757d;">
<p><strong>---------- Forwarded message ---------</strong></p>
<p><strong>From:</strong> ${forward.originalFrom} &lt;${forward.originalFromAddress}&gt;</p>
<p><strong>Date:</strong> ${dateStr}</p>
<p><strong>Subject:</strong> ${forward.subject.replace('Fwd: ', '')}</p>
<p><strong>To:</strong> ${originalTo}</p>
${originalCc ? `<p><strong>Cc:</strong> ${originalCc}</p>` : ''}
<br>
${quotedHtml}
</blockquote>`;
    }

    // For new replies, include quoted content at the bottom
    if (replyTo && !existingDraft) {
      // If we have thread emails, show all of them
      if (replyTo.threadEmails && replyTo.threadEmails.length > 0) {
        const threadQuotes = replyTo.threadEmails
          .map((email) => {
            const quotedHtml =
              email.htmlBody ||
              `<p>${(email.body || '').replace(/\n/g, '<br>')}</p>`;
            const dateStr = email.date
              ? new Date(email.date).toLocaleString()
              : '';

            return `<blockquote style="margin: 0.5rem 0; padding: 0.5rem 1rem; border-left: 3px solid #667eea; background: #f8f9fa; color: #6c757d;">
<p><strong>On ${dateStr}, ${email.from} wrote:</strong></p>
${quotedHtml}
</blockquote>`;
          })
          .join('\n');

        return `<p><br></p><p><br></p>${threadQuotes}`;
      }

      // Fallback to single email reply
      if (replyTo.originalBody) {
        const quotedHtml =
          replyTo.originalHtmlBody ||
          `<p>${replyTo.originalBody.replace(/\n/g, '<br>')}</p>`;

        const dateStr = replyTo.originalDate
          ? new Date(replyTo.originalDate).toLocaleString()
          : '';

        return `<p><br></p><p><br></p><blockquote style="margin: 0.5rem 0; padding: 0.5rem 1rem; border-left: 3px solid #667eea; background: #f8f9fa; color: #6c757d;">
<p><strong>On ${dateStr}, ${replyTo.originalFrom} wrote:</strong></p>
${quotedHtml}
</blockquote>`;
      }
    }

    return '';
  }, [existingDraft, replyTo, forward]);

  const initialEditorHtml = useMemo(
    () => buildInitialHtml(),
    [buildInitialHtml],
  );

  const { data: accountsData, loading: accountsLoading } = useQuery(
    GET_EMAIL_ACCOUNTS_QUERY,
  );
  const { data: profilesData, loading: profilesLoading } = useQuery(
    GET_SMTP_PROFILES_QUERY,
  );

  const [sendEmail, { loading: sending }] = useMutation(SEND_EMAIL_MUTATION, {
    onCompleted: () => {
      toast.success('Email sent successfully!');
      navigate('/inbox');
    },
    onError: (err) => {
      toast.error(`Failed to send: ${err.message}`);
      setError(err.message);
    },
  });

  const [saveDraft, { loading: savingDraft }] = useMutation(
    SAVE_DRAFT_MUTATION,
    {
      onCompleted: (data) => {
        setDraftId(data.saveDraft.id);
        toast.success('Draft saved');
      },
      onError: (err) => {
        console.error('Failed to save draft:', err);
        toast.error('Failed to save draft');
      },
    },
  );

  const accounts = accountsData?.getEmailAccounts ?? [];
  const profiles = profilesData?.getSmtpProfiles ?? [];

  // Set default email account
  useEffect(() => {
    if (accounts.length && !emailAccountId) {
      setEmailAccountId(accounts[0].id);
    }
  }, [accounts, emailAccountId]);

  // Set default SMTP profile based on email account
  useEffect(() => {
    if (!smtpProfileId && emailAccountId) {
      const account = accounts.find((a) => a.id === emailAccountId);
      if (account?.defaultSmtpProfileId) {
        setSmtpProfileId(account.defaultSmtpProfileId);
      } else if (profiles.length) {
        const defaultProfile = profiles.find((p) => p.isDefault);
        setSmtpProfileId(defaultProfile?.id || profiles[0].id);
      }
    }
  }, [emailAccountId, smtpProfileId, accounts, profiles]);

  const handleEditorChange = useCallback((html: string, text: string) => {
    setHtmlBody(html);
    setTextBody(text);
  }, []);

  const doSaveDraft = useCallback(async () => {
    if (!emailAccountId) return false;

    const toList = toAddresses
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const ccList = ccAddresses
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const bccList = bccAddresses
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await saveDraft({
        variables: {
          input: {
            id: draftId,
            emailAccountId,
            smtpProfileId: smtpProfileId || undefined,
            toAddresses: toList.length > 0 ? toList : undefined,
            ccAddresses: ccList.length > 0 ? ccList : undefined,
            bccAddresses: bccList.length > 0 ? bccList : undefined,
            subject: subject || undefined,
            textBody: textBody || undefined,
            htmlBody: htmlBody || undefined,
            inReplyTo: originalInfo?.inReplyTo,
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  }, [
    emailAccountId,
    smtpProfileId,
    toAddresses,
    ccAddresses,
    bccAddresses,
    subject,
    textBody,
    htmlBody,
    draftId,
    originalInfo?.inReplyTo,
    saveDraft,
  ]);

  // Handle escape key and browser back
  const handleExit = useCallback(async () => {
    if (hasChanges() && emailAccountId) {
      await doSaveDraft();
    }
    navigate(-1);
  }, [hasChanges, emailAccountId, doSaveDraft, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleExit();
      }
    };

    const handlePopState = () => {
      if (hasChanges() && emailAccountId) {
        doSaveDraft();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleExit, hasChanges, emailAccountId, doSaveDraft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailAccountId) {
      setError('Please select an email account');
      return;
    }

    if (!smtpProfileId) {
      setError('Please select a sending profile');
      return;
    }

    const toList = toAddresses
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (toList.length === 0) {
      setError('Please enter at least one recipient');
      return;
    }

    const ccList = ccAddresses
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const bccList = bccAddresses
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    sendEmail({
      variables: {
        input: {
          emailAccountId,
          smtpProfileId,
          toAddresses: toList,
          ccAddresses: ccList.length > 0 ? ccList : undefined,
          bccAddresses: bccList.length > 0 ? bccList : undefined,
          subject: subject || '(No Subject)',
          textBody,
          htmlBody,
          inReplyTo: originalInfo?.inReplyTo,
          draftId: draftId || undefined,
        },
      },
    });
  };

  if (accountsLoading || profilesLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  const noAccounts = accounts.length === 0;
  const noProfiles = profiles.length === 0;
  const isReply = !!(replyTo || existingDraft?.inReplyTo);
  const isForward = !!forward;
  const isDraft = !!existingDraft;

  return (
    <PageWrapper>
      <StickyHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <BackButton onClick={handleExit} />
          <Title>
            <FontAwesomeIcon
              icon={isReply ? faReply : isForward ? faShare : faPen}
              className="me-2"
            />
            {isReply
              ? 'Reply'
              : isForward
                ? 'Forward'
                : isDraft
                  ? 'Edit Draft'
                  : 'Compose Email'}
          </Title>
        </div>
        <HeaderActions>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={doSaveDraft}
            disabled={savingDraft || !emailAccountId}
          >
            {savingDraft ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="me-1" />
                Save Draft
              </>
            )}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={sending || noAccounts || noProfiles}
          >
            {sending ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} className="me-1" />
                Send
              </>
            )}
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={handleExit}>
            <FontAwesomeIcon icon={faTimes} className="me-1" />
            Cancel
          </Button>
        </HeaderActions>
      </StickyHeader>

      <ContentArea>
        <Container>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {noAccounts && (
            <Alert variant="warning">
              You need to configure an email account before sending emails.{' '}
              <Alert.Link onClick={() => navigate('/settings')}>
                Go to Settings
              </Alert.Link>
            </Alert>
          )}

          {!noAccounts && noProfiles && (
            <Alert variant="warning">
              You need to configure an SMTP profile before sending emails.{' '}
              <Alert.Link onClick={() => navigate('/settings')}>
                Go to Settings
              </Alert.Link>
            </Alert>
          )}

          <ComposeCard>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Send from Account</Form.Label>
                      <Form.Select
                        value={emailAccountId}
                        onChange={(e) => {
                          setEmailAccountId(e.target.value);
                          setSmtpProfileId('');
                        }}
                        disabled={noAccounts}
                      >
                        <option value="">Select an account...</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name} ({account.email})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>SMTP Profile</Form.Label>
                      <Form.Select
                        value={smtpProfileId}
                        onChange={(e) => setSmtpProfileId(e.target.value)}
                        disabled={noProfiles}
                      >
                        <option value="">Select a profile...</option>
                        {profiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.name}
                            {profile.alias && ` (${profile.alias})`} &lt;
                            {profile.email}&gt;
                            {profile.isDefault && ' (Default)'}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>
                    To
                    {!showCcBcc && (
                      <CcBccToggle onClick={() => setShowCcBcc(true)}>
                        CC/BCC
                      </CcBccToggle>
                    )}
                  </Form.Label>
                  <EmailChipInput
                    value={toAddresses}
                    onChange={setToAddresses}
                    placeholder="Type email or search contacts..."
                  />
                </Form.Group>

                {showCcBcc && (
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>CC</Form.Label>
                        <EmailChipInput
                          value={ccAddresses}
                          onChange={setCcAddresses}
                          placeholder="CC recipients..."
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>BCC</Form.Label>
                        <EmailChipInput
                          value={bccAddresses}
                          onChange={setBccAddresses}
                          placeholder="BCC recipients..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <RichTextEditor
                    onChange={handleEditorChange}
                    placeholder="Write your message..."
                    initialHtml={initialEditorHtml}
                    autoFocus
                  />
                  <Form.Text className="text-muted">
                    Format with toolbar or markdown: **bold**, *italic*, #
                    heading
                  </Form.Text>
                </Form.Group>
              </Form>
            </Card.Body>
          </ComposeCard>
        </Container>
      </ContentArea>
    </PageWrapper>
  );
}
