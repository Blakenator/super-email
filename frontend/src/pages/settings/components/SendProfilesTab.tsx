import { Button, Card, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faPlus } from '@fortawesome/free-solid-svg-icons';
import { SmtpProfileCard } from './SmtpProfileCard';
import { SectionCard, SmtpCardGrid } from '../Settings.wrappers';

interface SendProfilesTabProps {
  profiles: any[];
  loading: boolean;
  onAddProfile: () => void;
  onEditProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
}

export function SendProfilesTab({
  profiles,
  loading,
  onAddProfile,
  onEditProfile,
  onDeleteProfile,
}: SendProfilesTabProps) {
  return (
    <SectionCard className="card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Outgoing Email Profiles</h5>
          <Button variant="primary" size="sm" onClick={onAddProfile}>
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            Add Profile
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-5">
            <FontAwesomeIcon
              icon={faPaperPlane}
              size="3x"
              className="text-muted mb-3"
            />
            <h5>No Send Profiles Yet</h5>
            <p className="text-muted mb-3">
              Add a send profile to send emails. For SMTP-based accounts, you'll
              need your email server's SMTP settings (host, port) and your
              credentials.
            </p>
            <p className="text-muted small mb-4">
              <strong>Tip:</strong> Most email providers use the same credentials
              for IMAP and SMTP, but different servers. For example, Gmail uses{' '}
              <code>imap.gmail.com</code> for receiving and{' '}
              <code>smtp.gmail.com</code> for sending.
            </p>
            <Button variant="primary" onClick={onAddProfile}>
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Add Your First Profile
            </Button>
          </div>
        ) : (
          <SmtpCardGrid>
            {profiles.map((profile) => (
              <SmtpProfileCard
                key={profile.id}
                profile={profile}
                onEdit={onEditProfile}
                onDelete={onDeleteProfile}
              />
            ))}
          </SmtpCardGrid>
        )}
      </Card.Body>
    </SectionCard>
  );
}
