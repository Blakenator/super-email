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
  type: string;
  isDefault: boolean;
  smtpSettings?: {
    host: string;
    port: number;
    useSsl: boolean;
  } | null;
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
    <SmtpCardStyled className="card">
      <SmtpCardHeader $isDefault={profile.isDefault} className="card-header">
        <SmtpCardTitle>
          {profile.name}
          {profile.isDefault && (
            <Badge bg="light" text="dark" pill>
              Default
            </Badge>
          )}
        </SmtpCardTitle>
        <SmtpCardSubtitle>
          {profile.alias
            ? `${profile.alias} <${profile.email}>`
            : profile.email}
        </SmtpCardSubtitle>
      </SmtpCardHeader>
      <SmtpCardBody className="card-body">
        {profile.smtpSettings ? (
          <>
            <SmtpDetailRow>
              <SmtpDetailLabel>Server</SmtpDetailLabel>
              <span>
                {profile.smtpSettings.host}:{profile.smtpSettings.port}
              </span>
            </SmtpDetailRow>
            <SmtpDetailRow>
              <SmtpDetailLabel>Security</SmtpDetailLabel>
              <span>
                {profile.smtpSettings.useSsl ? (
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
          </>
        ) : (
          <SmtpDetailRow>
            <SmtpDetailLabel>Type</SmtpDetailLabel>
            <Badge bg="success">Custom Domain (SES)</Badge>
          </SmtpDetailRow>
        )}
        {profile.alias && (
          <SmtpDetailRow>
            <SmtpDetailLabel>Display Name</SmtpDetailLabel>
            <span>{profile.alias}</span>
          </SmtpDetailRow>
        )}
      </SmtpCardBody>
      <SmtpCardFooter className="card-footer">
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
