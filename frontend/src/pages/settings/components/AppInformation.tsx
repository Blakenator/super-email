import { useQuery } from '@apollo/client/react';
import { Card, Spinner } from 'react-bootstrap';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faServer,
  faDesktop,
  faCheckCircle,
  faTimesCircle,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { SectionCard } from '../Settings.wrappers';
import { HEALTH_CHECK_QUERY } from '../queries';

declare const __APP_VERSION__: string;

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

export function AppInformation() {
  const { data, loading, error } = useQuery(HEALTH_CHECK_QUERY, {
    fetchPolicy: 'network-only',
  });

  const health = data?.healthCheck;
  const isHealthy = health?.status === 'ok';

  return (
    <SectionCard className="card">
      <Card.Body>
        <h5 className="mb-4">App Information</h5>

        <InfoGrid>
          <InfoCard>
            <InfoIcon>
              <FontAwesomeIcon icon={faDesktop} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Frontend Version</InfoLabel>
              <InfoValue>{__APP_VERSION__}</InfoValue>
            </InfoContent>
          </InfoCard>

          <InfoCard>
            <InfoIcon>
              <FontAwesomeIcon icon={faServer} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Backend Version</InfoLabel>
              <InfoValue>
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : error ? (
                  <ErrorText>Unavailable</ErrorText>
                ) : (
                  health?.version
                )}
              </InfoValue>
            </InfoContent>
          </InfoCard>

          <InfoCard>
            <InfoIcon $healthy={error ? false : isHealthy}>
              <FontAwesomeIcon
                icon={
                  loading
                    ? faClock
                    : error || !isHealthy
                      ? faTimesCircle
                      : faCheckCircle
                }
              />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Server Status</InfoLabel>
              <InfoValue>
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : error ? (
                  <ErrorText>Unreachable</ErrorText>
                ) : (
                  <StatusBadge $healthy={isHealthy}>
                    {isHealthy ? 'Healthy' : 'Unhealthy'}
                  </StatusBadge>
                )}
              </InfoValue>
            </InfoContent>
          </InfoCard>

          <InfoCard>
            <InfoIcon>
              <FontAwesomeIcon icon={faClock} />
            </InfoIcon>
            <InfoContent>
              <InfoLabel>Server Uptime</InfoLabel>
              <InfoValue>
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : error ? (
                  <ErrorText>N/A</ErrorText>
                ) : (
                  formatUptime(health?.uptimeSeconds ?? 0)
                )}
              </InfoValue>
            </InfoContent>
          </InfoCard>
        </InfoGrid>
      </Card.Body>
    </SectionCard>
  );
}

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const InfoCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.backgroundWhite};
`;

const InfoIcon = styled.div<{ $healthy?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  background: ${({ theme, $healthy }) =>
    $healthy === false
      ? `${theme.colors.danger}15`
      : $healthy === true
        ? `${theme.colors.success}15`
        : `${theme.colors.primary}15`};
  color: ${({ theme, $healthy }) =>
    $healthy === false
      ? theme.colors.danger
      : $healthy === true
        ? theme.colors.success
        : theme.colors.primary};
`;

const InfoContent = styled.div`
  min-width: 0;
`;

const InfoLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
`;

const InfoValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const StatusBadge = styled.span<{ $healthy: boolean }>`
  color: ${({ theme, $healthy }) =>
    $healthy ? theme.colors.success : theme.colors.danger};
`;

const ErrorText = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 400;
`;
