import { useState, useEffect, useCallback, useRef } from 'react';
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
import styled from 'styled-components';
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
  HtmlViewer,
} from '../../core/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faReply,
  faPen,
  faPaperPlane,
  faSave,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

const PageWrapper = styled.div`
  height: 100vh;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.background};
`;

const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ContentArea = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const ComposeCard = styled(Card)`
  border: none;
  box-shadow: ${({ theme }) => theme.shadows.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

const QuotedContent = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 0 ${({ theme }) => theme.borderRadius.md}
    ${({ theme }) => theme.borderRadius.md} 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const CcBccToggle = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-left: ${({ theme }) => theme.spacing.sm};

  &:hover {
    text-decoration: underline;
  }
`;

interface ReplyToState {
  to: string;
  subject: string;
  inReplyTo: string;
  originalBody: string;
  originalHtmlBody?: string;
  originalFrom: string;
  originalDate: string;
  emailAccountId?: string;
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

export function Compose() {
  const navigate = useNavigate();
  const location = useLocation();
  const replyTo = location.state?.replyTo as ReplyToState | undefined;
  const existingDraft = location.state?.draft as DraftState | undefined;

  const [emailAccountId, setEmailAccountId] = useState(
    existingDraft?.emailAccountId || replyTo?.emailAccountId || '',
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
    existingDraft?.subject || replyTo?.subject || '',
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

  // Get original message info for drafts/replies
  const originalInfo = replyTo || existingDraft;

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
  const isDraft = !!existingDraft;

  return (
    <PageWrapper>
      <StickyHeader>
        <Title>
          <FontAwesomeIcon icon={isReply ? faReply : faPen} className="me-2" />
          {isReply ? 'Reply' : isDraft ? 'Edit Draft' : 'Compose Email'}
        </Title>
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
                            {profile.name} &lt;{profile.email}&gt;
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
                  <Form.Control
                    type="text"
                    placeholder="recipient@example.com, another@example.com"
                    value={toAddresses}
                    onChange={(e) => setToAddresses(e.target.value)}
                    required
                  />
                </Form.Group>

                {showCcBcc && (
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>CC</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="cc@example.com"
                          value={ccAddresses}
                          onChange={(e) => setCcAddresses(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>BCC</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="bcc@example.com"
                          value={bccAddresses}
                          onChange={(e) => setBccAddresses(e.target.value)}
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
                    placeholder="Write your message... (supports markdown: **bold**, *italic*, # headings)"
                    initialHtml={existingDraft?.htmlBody}
                    autoFocus
                  />
                  <Form.Text className="text-muted">
                    Use markdown shortcuts: **bold**, *italic*, # heading, -
                    list
                  </Form.Text>
                </Form.Group>

                {originalInfo?.originalBody && (
                  <QuotedContent>
                    <strong>
                      On{' '}
                      {new Date(
                        originalInfo.originalDate || '',
                      ).toLocaleString()}
                      , {originalInfo.originalFrom} wrote:
                    </strong>
                    <div style={{ marginTop: '0.5rem' }}>
                      {originalInfo.originalHtmlBody ? (
                        <HtmlViewer html={originalInfo.originalHtmlBody} />
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                          {originalInfo.originalBody}
                        </div>
                      )}
                    </div>
                  </QuotedContent>
                )}
              </Form>
            </Card.Body>
          </ComposeCard>
        </Container>
      </ContentArea>
    </PageWrapper>
  );
}
