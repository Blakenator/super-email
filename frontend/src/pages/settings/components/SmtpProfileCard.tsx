import { Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faLock, faLink } from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faMicrosoft, faYahoo } from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
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

const OAUTH_PROVIDER_LABELS: Record<string, { label: string; icon: IconDefinition }> = {
  OAUTH_GOOGLE: { label: 'Google', icon: faGoogle },
  OAUTH_YAHOO: { label: 'Yahoo', icon: faYahoo },
  OAUTH_OUTLOOK: { label: 'Outlook', icon: faMicrosoft },
};

export interface SmtpProfileData {
  id: string;
  name: string;
  email: string;
  alias?: string | null;
  type: string;
  isDefault: boolean;
  authMethod?: string;
  emailAccountId?: string | null;
  emailAccount?: {
    id: string;
    name: string;
    email: string;
  } | null;
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
  const oauthInfo = profile.authMethod ? OAUTH_PROVIDER_LABELS[profile.authMethod] : null;
  const isOAuth = !!oauthInfo;

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
        {isOAuth ? (
          <SmtpDetailRow>
            <SmtpDetailLabel>Type</SmtpDetailLabel>
            <Badge bg="primary">
              <FontAwesomeIcon icon={oauthInfo.icon} className="me-1" />
              Connected via {oauthInfo.label}
            </Badge>
          </SmtpDetailRow>
        ) : profile.smtpSettings ? (
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
        {profile.emailAccount && (
          <SmtpDetailRow>
            <SmtpDetailLabel>
              <FontAwesomeIcon icon={faLink} className="me-1" />
              Linked Account
            </SmtpDetailLabel>
            <span>{profile.emailAccount.name}</span>
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
