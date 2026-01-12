import { useState, useEffect } from 'react';
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
import { GET_SMTP_PROFILES_QUERY, SEND_EMAIL_MUTATION } from './queries';

const PageWrapper = styled.div`
  padding: 1.5rem;
  height: 100%;
  overflow-y: auto;
`;

const ComposeCard = styled(Card)`
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const QuotedText = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f6f8fc;
  border-left: 3px solid var(--primary-color);
  border-radius: 0 8px 8px 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: pre-wrap;
`;

interface ReplyToState {
  to: string;
  subject: string;
  inReplyTo: string;
  originalBody: string;
  originalFrom: string;
  originalDate: string;
}

export function Compose() {
  const navigate = useNavigate();
  const location = useLocation();
  const replyTo = location.state?.replyTo as ReplyToState | undefined;

  const [smtpProfileId, setSmtpProfileId] = useState('');
  const [toAddresses, setToAddresses] = useState(replyTo?.to || '');
  const [ccAddresses, setCcAddresses] = useState('');
  const [bccAddresses, setBccAddresses] = useState('');
  const [subject, setSubject] = useState(replyTo?.subject || '');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: profilesData, loading: profilesLoading } = useQuery(
    GET_SMTP_PROFILES_QUERY,
  );

  const [sendEmail, { loading: sending }] = useMutation(SEND_EMAIL_MUTATION, {
    onCompleted: () => {
      setSuccess(true);
      setTimeout(() => navigate('/inbox'), 1500);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    if (profilesData?.getSmtpProfiles.length && !smtpProfileId) {
      const defaultProfile = profilesData.getSmtpProfiles.find(
        (p) => p.isDefault,
      );
      setSmtpProfileId(
        defaultProfile?.id || profilesData.getSmtpProfiles[0].id,
      );
    }
  }, [profilesData, smtpProfileId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
          smtpProfileId,
          toAddresses: toList,
          ccAddresses: ccList.length > 0 ? ccList : undefined,
          bccAddresses: bccList.length > 0 ? bccList : undefined,
          subject: subject || '(No Subject)',
          textBody: body,
          inReplyTo: replyTo?.inReplyTo,
        },
      },
    });
  };

  const profiles = profilesData?.getSmtpProfiles ?? [];

  return (
    <PageWrapper>
      <Container>
        <Header>
          <Title>{replyTo ? '↩️ Reply' : '✏️ Compose Email'}</Title>
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Header>

        {success && (
          <Alert variant="success">
            ✅ Email sent successfully! Redirecting...
          </Alert>
        )}

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {profiles.length === 0 && !profilesLoading && (
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
              <Form.Group className="mb-3">
                <Form.Label>From</Form.Label>
                <Form.Select
                  value={smtpProfileId}
                  onChange={(e) => setSmtpProfileId(e.target.value)}
                  disabled={profilesLoading}
                >
                  {profilesLoading && <option>Loading...</option>}
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} &lt;{profile.email}&gt;
                      {profile.isDefault && ' (Default)'}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>To</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="recipient@example.com, another@example.com"
                  value={toAddresses}
                  onChange={(e) => setToAddresses(e.target.value)}
                  required
                />
                <Form.Text className="text-muted">
                  Separate multiple addresses with commas
                </Form.Text>
              </Form.Group>

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

              <Form.Group className="mb-3">
                <Form.Label>Subject</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={12}
                  placeholder="Write your message here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  style={{ resize: 'vertical', minHeight: '200px' }}
                />
              </Form.Group>

              {replyTo && (
                <QuotedText>
                  <strong>
                    On {new Date(replyTo.originalDate).toLocaleString()},{' '}
                    {replyTo.originalFrom} wrote:
                  </strong>
                  <br />
                  <br />
                  {replyTo.originalBody}
                </QuotedText>
              )}

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button
                  variant="primary"
                  type="submit"
                  size="lg"
                  disabled={sending || profiles.length === 0}
                  style={{
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                  }}
                >
                  {sending ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Sending...
                    </>
                  ) : (
                    '📨 Send Email'
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </ComposeCard>
      </Container>
    </PageWrapper>
  );
}
