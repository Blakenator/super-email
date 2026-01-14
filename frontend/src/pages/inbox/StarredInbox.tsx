import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { ListGroup, Badge, Button, ButtonGroup } from 'react-bootstrap';
import {
  GET_STARRED_EMAILS_QUERY,
  BULK_UPDATE_EMAILS_MUTATION,
  BULK_DELETE_EMAILS_MUTATION,
} from './queries';
import { EmailView } from './EmailView';
import {
  LoadingSpinner,
  EmptyState,
  PageWrapper,
  PageToolbar,
  PageContent,
  PageTitle,
} from '../../core/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import toast from 'react-hot-toast';
import {
  EmailItem,
  EmailMeta,
  SenderName,
  EmailDate,
  Subject,
  Preview,
  StarButton,
} from './StarredInbox.wrappers';

export function StarredInbox() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_STARRED_EMAILS_QUERY, {
    variables: { input: { isStarred: true, limit: 100 } },
  });

  const [bulkUpdateEmails] = useMutation(BULK_UPDATE_EMAILS_MUTATION, {
    refetchQueries: [
      {
        query: GET_STARRED_EMAILS_QUERY,
        variables: { input: { isStarred: true, limit: 100 } },
      },
    ],
  });

  const [bulkDeleteEmails] = useMutation(BULK_DELETE_EMAILS_MUTATION, {
    onCompleted: () => {
      toast.success('Email moved to trash');
    },
    refetchQueries: [
      {
        query: GET_STARRED_EMAILS_QUERY,
        variables: { input: { isStarred: true, limit: 100 } },
      },
    ],
  });

  const handleStarToggle = async (
    e: React.MouseEvent,
    emailId: string,
    currentlyStarred: boolean,
  ) => {
    e.stopPropagation();
    await bulkUpdateEmails({
      variables: { input: { ids: [emailId], isStarred: !currentlyStarred } },
    });
  };

  const handleEmailClick = async (emailId: string, isRead: boolean) => {
    if (!isRead) {
      await bulkUpdateEmails({
        variables: { input: { ids: [emailId], isRead: true } },
      });
    }
    setSelectedEmailId(emailId);
  };

  const handleBack = () => {
    setSelectedEmailId(null);
  };

  const handleDelete = async (emailId: string) => {
    await bulkDeleteEmails({ variables: { ids: [emailId] } });
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
                      onClick={(e) =>
                        handleStarToggle(e, email.id, email.isStarred)
                      }
                    >
                      <FontAwesomeIcon
                        icon={email.isStarred ? faStarSolid : faStarRegular}
                      />
                    </StarButton>
                    <SenderName>{email.fromName || email.fromAddress}</SenderName>
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
