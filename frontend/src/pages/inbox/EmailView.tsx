import { useQuery } from '@apollo/client/react';
import { Card, Button, Spinner, Badge } from 'react-bootstrap';
import styled from 'styled-components';
import { GET_EMAIL_QUERY } from './queries';
import { useNavigate } from 'react-router';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
`;

const EmailContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

const Subject = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
`;

const SenderInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const SenderName = styled.strong`
  font-size: 1rem;
`;

const SenderEmail = styled.span`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const Recipients = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

const EmailDate = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-align: right;
`;

const Body = styled.div`
  white-space: pre-wrap;
  line-height: 1.7;
  color: var(--text-primary);
`;

const HtmlBody = styled.div`
  line-height: 1.7;

  img {
    max-width: 100%;
    height: auto;
  }
`;

interface EmailViewProps {
  emailId: string;
  onBack: () => void;
  onDelete: () => void;
}

export function EmailView({ emailId, onBack, onDelete }: EmailViewProps) {
  const navigate = useNavigate();

  const { data, loading } = useQuery(GET_EMAIL_QUERY, {
    variables: { input: { id: emailId } },
  });

  const email = data?.getEmail;

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
      navigate('/compose', {
        state: {
          replyTo: {
            to: email.fromAddress,
            subject: email.subject.startsWith('Re:')
              ? email.subject
              : `Re: ${email.subject}`,
            inReplyTo: email.messageId,
            originalBody: email.textBody,
            originalFrom: email.fromName || email.fromAddress,
            originalDate: email.receivedAt,
          },
        },
      });
    }
  };

  if (loading) {
    return (
      <Wrapper>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: '300px' }}
        >
          <Spinner animation="border" variant="primary" />
        </div>
      </Wrapper>
    );
  }

  if (!email) {
    return (
      <Wrapper>
        <Toolbar>
          <Button variant="outline-secondary" onClick={onBack}>
            ← Back
          </Button>
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
        <Button variant="outline-secondary" onClick={onBack}>
          ← Back
        </Button>
        <Button variant="primary" onClick={handleReply}>
          ↩️ Reply
        </Button>
        <Button variant="outline-danger" onClick={onDelete}>
          🗑️ Delete
        </Button>
      </Toolbar>

      <EmailContent>
        <Subject>{email.subject}</Subject>

        <MetaRow>
          <SenderInfo>
            <SenderName>{email.fromName || email.fromAddress}</SenderName>
            {email.fromName && (
              <SenderEmail>&lt;{email.fromAddress}&gt;</SenderEmail>
            )}
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
          <HtmlBody dangerouslySetInnerHTML={{ __html: email.htmlBody }} />
        ) : (
          <Body>{email.textBody || '(No content)'}</Body>
        )}
      </EmailContent>
    </Wrapper>
  );
}
