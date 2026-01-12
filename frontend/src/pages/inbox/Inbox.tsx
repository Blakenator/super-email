import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Container,
  ListGroup,
  Badge,
  Spinner,
  Button,
  ButtonGroup,
} from 'react-bootstrap';
import styled from 'styled-components';
import {
  GET_EMAILS_QUERY,
  UPDATE_EMAIL_MUTATION,
  DELETE_EMAIL_MUTATION,
} from './queries';
import { EmailFolder } from '../../__generated__/graphql';
import { EmailView } from './EmailView';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid var(--border-color);
`;

const EmailListWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  background: white;
`;

const EmailItem = styled(ListGroup.Item)<{ $isUnread: boolean }>`
  cursor: pointer;
  padding: 1rem 1.25rem;
  border-left: none;
  border-right: none;
  background: ${(props) => (props.$isUnread ? 'var(--unread-bg)' : 'white')};
  font-weight: ${(props) => (props.$isUnread ? '600' : '400')};

  &:hover {
    background: var(--hover-bg);
  }
`;

const EmailMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
`;

const SenderName = styled.span`
  color: var(--text-primary);
`;

const EmailDate = styled.span`
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 400;
`;

const Subject = styled.div`
  color: var(--text-primary);
`;

const Preview = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
`;

const StarButton = styled.span<{ $isStarred: boolean }>`
  color: ${(props) => (props.$isStarred ? '#fbbc04' : '#dadce0')};
  cursor: pointer;
  margin-right: 0.75rem;
  font-size: 1.2rem;

  &:hover {
    color: #fbbc04;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-secondary);
`;

interface InboxProps {
  folder?: EmailFolder;
}

export function Inbox({ folder = EmailFolder.Inbox }: InboxProps) {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_EMAILS_QUERY, {
    variables: { input: { folder, limit: 50 } },
  });

  const [updateEmail] = useMutation(UPDATE_EMAIL_MUTATION);
  const [deleteEmail] = useMutation(DELETE_EMAIL_MUTATION);

  const handleStarToggle = async (
    e: React.MouseEvent,
    emailId: string,
    currentlyStarred: boolean,
  ) => {
    e.stopPropagation();
    await updateEmail({
      variables: { input: { id: emailId, isStarred: !currentlyStarred } },
    });
    refetch();
  };

  const handleEmailClick = async (emailId: string, isRead: boolean) => {
    if (!isRead) {
      await updateEmail({
        variables: { input: { id: emailId, isRead: true } },
      });
      refetch();
    }
    setSelectedEmailId(emailId);
  };

  const handleBack = () => {
    setSelectedEmailId(null);
  };

  const handleDelete = async (emailId: string) => {
    await deleteEmail({ variables: { id: emailId } });
    setSelectedEmailId(null);
    refetch();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (selectedEmailId) {
    return (
      <EmailView
        emailId={selectedEmailId}
        onBack={handleBack}
        onDelete={() => handleDelete(selectedEmailId)}
      />
    );
  }

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: '300px' }}
      >
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  const emails = data?.getEmails ?? [];

  return (
    <PageWrapper>
      <Toolbar>
        <div>
          <strong style={{ fontSize: '1.25rem' }}>
            {folder === EmailFolder.Inbox && '📥 Inbox'}
            {folder === EmailFolder.Sent && '📤 Sent'}
            {folder === EmailFolder.Drafts && '📝 Drafts'}
            {folder === EmailFolder.Trash && '🗑️ Trash'}
            {folder === EmailFolder.Spam && '⚠️ Spam'}
            {folder === EmailFolder.Archive && '📦 Archive'}
          </strong>
          <Badge bg="secondary" className="ms-2">
            {emails.length}
          </Badge>
        </div>
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" onClick={() => refetch()}>
            🔄 Refresh
          </Button>
        </ButtonGroup>
      </Toolbar>

      <EmailListWrapper>
        {emails.length === 0 ? (
          <EmptyState>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <div>No emails in this folder</div>
          </EmptyState>
        ) : (
          <ListGroup variant="flush">
            {emails.map((email) => (
              <EmailItem
                key={email.id}
                $isUnread={!email.isRead}
                onClick={() => handleEmailClick(email.id, email.isRead)}
              >
                <EmailMeta>
                  <div>
                    <StarButton
                      $isStarred={email.isStarred}
                      onClick={(e) =>
                        handleStarToggle(e, email.id, email.isStarred)
                      }
                    >
                      {email.isStarred ? '★' : '☆'}
                    </StarButton>
                    <SenderName>
                      {email.fromName || email.fromAddress}
                    </SenderName>
                  </div>
                  <EmailDate>{formatDate(email.receivedAt)}</EmailDate>
                </EmailMeta>
                <Subject>{email.subject}</Subject>
                <Preview>
                  {email.textBody?.substring(0, 100) || '(No content)'}
                </Preview>
              </EmailItem>
            ))}
          </ListGroup>
        )}
      </EmailListWrapper>
    </PageWrapper>
  );
}
