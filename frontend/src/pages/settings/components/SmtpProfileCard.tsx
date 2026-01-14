import { Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faLock } from '@fortawesome/free-solid-svg-icons';
import {
  SmtpCardStyled,
  SmtpCardHeader,
  SmtpCardTitle,
  SmtpCardSubtitle,
  SmtpCardBody,
  SmtpDetailRow,
  SmtpDetailLabel,
  SmtpCardFooter,
  SmtpCardActions,
} from './SmtpProfileCard.wrappers';

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
