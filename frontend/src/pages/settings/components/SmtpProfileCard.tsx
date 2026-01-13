import { Card, Button, Badge } from 'react-bootstrap';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faLock } from '@fortawesome/free-solid-svg-icons';

const SmtpCardStyled = styled(Card)`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  overflow: hidden;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const SmtpCardHeader = styled(Card.Header)<{ $isDefault?: boolean }>`
  background: ${({ $isDefault }) =>
    $isDefault
      ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  color: white;
  padding: ${({ theme }) => theme.spacing.md};
  border: none;
`;

const SmtpCardTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SmtpCardSubtitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: 0.9;
`;

const SmtpCardBody = styled(Card.Body)`
  padding: ${({ theme }) => theme.spacing.md};
`;

const SmtpDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
  }
`;

const SmtpDetailLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const SmtpCardFooter = styled(Card.Footer)`
  background: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
`;

const SmtpCardActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

export interface SmtpProfileData {
  id: string;
  name: string;
  email: string;
  alias?: string | null;
  host: string;
  port: number;
  useSsl: boolean;
  isDefault: boolean;
}

interface SmtpProfileCardProps {
  profile: SmtpProfileData;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SmtpProfileCard({
  profile,
  onEdit,
  onDelete,
}: SmtpProfileCardProps) {
  return (
    <SmtpCardStyled>
      <SmtpCardHeader $isDefault={profile.isDefault}>
        <SmtpCardTitle>
          {profile.name}
          {profile.isDefault && (
            <Badge bg="light" text="dark" pill>
              Default
            </Badge>
          )}
        </SmtpCardTitle>
        <SmtpCardSubtitle>
          {profile.alias ? `${profile.alias} <${profile.email}>` : profile.email}
        </SmtpCardSubtitle>
      </SmtpCardHeader>
      <SmtpCardBody>
        <SmtpDetailRow>
          <SmtpDetailLabel>Server</SmtpDetailLabel>
          <span>
            {profile.host}:{profile.port}
          </span>
        </SmtpDetailRow>
        <SmtpDetailRow>
          <SmtpDetailLabel>Security</SmtpDetailLabel>
          <span>
            {profile.useSsl ? (
              <Badge bg="success">
                <FontAwesomeIcon icon={faLock} className="me-1" />
                SSL/TLS
              </Badge>
            ) : (
              <Badge bg="warning" text="dark">
                No SSL
              </Badge>
            )}
          </span>
        </SmtpDetailRow>
        {profile.alias && (
          <SmtpDetailRow>
            <SmtpDetailLabel>Display Name</SmtpDetailLabel>
            <span>{profile.alias}</span>
          </SmtpDetailRow>
        )}
      </SmtpCardBody>
      <SmtpCardFooter>
        <SmtpCardActions>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => onEdit(profile.id)}
          >
            <FontAwesomeIcon icon={faEdit} className="me-1" />
            Edit
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onDelete(profile.id)}
          >
            <FontAwesomeIcon icon={faTrash} className="me-1" />
            Delete
          </Button>
        </SmtpCardActions>
      </SmtpCardFooter>
    </SmtpCardStyled>
  );
}
