import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { ListGroup, Badge, Button, ButtonGroup } from 'react-bootstrap';
import styled from 'styled-components';
import {
  GET_STARRED_EMAILS_QUERY,
  UPDATE_EMAIL_MUTATION,
  DELETE_EMAIL_MUTATION,
} from './queries';
import { EmailView } from './EmailView';
import { LoadingSpinner, EmptyState, PageWrapper, PageToolbar, PageContent, PageTitle } from '../../core/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

const EmailItem = styled(ListGroup.Item)<{ $isUnread: boolean }>`
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-left: none;
  border-right: none;
  background: ${(props) =>
    props.$isUnread ? props.theme.colors.unreadBackground : props.theme.colors.backgroundWhite};
  font-weight: ${(props) => (props.$isUnread ? '600' : '400')};

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

const EmailMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const SenderName = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const EmailDate = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 400;
`;

const Subject = styled.div`
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Preview = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
`;

const StarButton = styled.span<{ $isStarred: boolean }>`
  color: ${(props) =>
    props.$isStarred ? props.theme.colors.star : props.theme.colors.starInactive};
  cursor: pointer;
  margin-right: ${({ theme }) => theme.spacing.sm};
  font-size: 1.2rem;

  &:hover {
    color: ${({ theme }) => theme.colors.star};
  }
`;

export function StarredInbox() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_STARRED_EMAILS_QUERY, {
    variables: { input: { isStarred: true, limit: 100 } },
  });

  const [updateEmail] = useMutation(UPDATE_EMAIL_MUTATION, {
    refetchQueries: [{ query: GET_STARRED_EMAILS_QUERY, variables: { input: { isStarred: true, limit: 100 } } }],
  });
  const [deleteEmail] = useMutation(DELETE_EMAIL_MUTATION, {
    refetchQueries: [{ query: GET_STARRED_EMAILS_QUERY, variables: { input: { isStarred: true, limit: 100 } } }],
  });

  const handleStarToggle = async (
    e: React.MouseEvent,
    emailId: string,
    currentlyStarred: boolean,
  ) => {
    e.stopPropagation();
    await updateEmail({
      variables: { input: { id: emailId, isStarred: !currentlyStarred } },
    });
  };

  const handleEmailClick = async (emailId: string, isRead: boolean) => {
    if (!isRead) {
      await updateEmail({
        variables: { input: { id: emailId, isRead: true } },
      });
    }
    setSelectedEmailId(emailId);
  };

  const handleBack = () => {
    setSelectedEmailId(null);
  };

  const handleDelete = async (emailId: string) => {
    await deleteEmail({ variables: { id: emailId } });
    setSelectedEmailId(null);
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
    return <LoadingSpinner message="Loading starred emails..." />;
  }

  const emails = data?.getEmails ?? [];

  return (
    <PageWrapper>
      <PageToolbar>
        <PageTitle>
          <FontAwesomeIcon icon={faStarSolid} style={{ color: '#fbbc04' }} />
          Starred
          <Badge bg="secondary">{emails.length}</Badge>
        </PageTitle>
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" onClick={() => refetch()}>
            <FontAwesomeIcon icon={faSync} className="me-1" />
            Refresh
          </Button>
        </ButtonGroup>
      </PageToolbar>

      <PageContent>
        {emails.length === 0 ? (
          <EmptyState
            icon={faStarSolid}
            title="No starred emails"
            description="Star important emails to find them quickly here"
          />
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
                      onClick={(e) => handleStarToggle(e, email.id, email.isStarred)}
                    >
                      <FontAwesomeIcon
                        icon={email.isStarred ? faStarSolid : faStarRegular}
                      />
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
      </PageContent>
    </PageWrapper>
  );
}
