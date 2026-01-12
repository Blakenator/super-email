import { useEffect, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { Button } from 'react-bootstrap';
import styled from 'styled-components';
import { GET_EMAIL_QUERY } from './queries';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faReply,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { LoadingSpinner, HtmlViewer } from '../../core/components';

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

    // Push a state so we can intercept back button
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
    }
  };

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
          <Button variant="outline-secondary" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
            Back
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
          <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
          Back
        </Button>
        <Button variant="primary" onClick={handleReply}>
          <FontAwesomeIcon icon={faReply} className="me-1" />
          Reply
        </Button>
        <Button variant="outline-danger" onClick={onDelete}>
          <FontAwesomeIcon icon={faTrash} className="me-1" />
          Delete
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
          <HtmlBodyContainer>
            <HtmlViewer html={email.htmlBody} />
          </HtmlBodyContainer>
        ) : (
          <Body>{email.textBody || '(No content)'}</Body>
        )}
      </EmailContent>
    </Wrapper>
  );
}
