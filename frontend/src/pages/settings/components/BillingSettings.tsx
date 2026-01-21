import { useQuery, useMutation } from '@apollo/client/react';
import { Card, Button, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreditCard,
  faChartPie,
  faExternalLinkAlt,
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
  faDatabase,
  faEnvelope,
  faSync,
  faCrown,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import {
  GET_BILLING_INFO_QUERY,
  CREATE_BILLING_PORTAL_SESSION_MUTATION,
  REFRESH_STORAGE_USAGE_MUTATION,
} from '../queries';
import {
  BillingContainer,
  BillingCard,
  UsageSection,
  UsageItem,
  UsageHeader,
  UsageLabel,
  UsageValue,
  StyledProgressBar,
  TierBadge,
  StatusBadge,
  SubscriptionGrid,
  SubscriptionItem,
  SubscriptionLabel,
  SubscriptionValue,
  WarningBox,
  ErrorBox,
  LastRefreshed,
} from './BillingSettings.wrappers';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatTier(tier: string): string {
  switch (tier) {
    case 'FREE':
      return 'Free';
    case 'BASIC':
      return 'Basic';
    case 'PRO':
      return 'Pro';
    case 'ENTERPRISE':
      return 'Enterprise';
    default:
      return tier;
  }
}

function getStorageLimit(tier: string): string {
  switch (tier) {
    case 'FREE':
      return '5 GB';
    case 'BASIC':
      return '10 GB';
    case 'PRO':
      return '20 GB';
    case 'ENTERPRISE':
      return '100 GB';
    default:
      return 'Unknown';
  }
}

function getAccountLimit(tier: string): string {
  switch (tier) {
    case 'FREE':
      return '1 account';
    case 'BASIC':
      return '2 accounts';
    case 'PRO':
      return '5 accounts';
    case 'ENTERPRISE':
      return 'Unlimited';
    default:
      return 'Unknown';
  }
}

function getProgressVariant(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 90) return 'danger';
  if (percent >= 75) return 'warning';
  return 'success';
}

export function BillingSettings() {
  const { data, loading, error, refetch } = useQuery(GET_BILLING_INFO_QUERY);
  const [createPortalSession, { loading: creatingPortal }] = useMutation(
    CREATE_BILLING_PORTAL_SESSION_MUTATION,
  );
  const [refreshUsage, { loading: refreshingUsage }] = useMutation(
    REFRESH_STORAGE_USAGE_MUTATION,
  );

  const handleManageSubscription = async () => {
    try {
      const result = await createPortalSession();
      const url = result.data?.createBillingPortalSession;
      if (url) {
        window.open(url, '_blank');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to open billing portal');
    }
  };

  const handleRefreshUsage = async () => {
    try {
      await refreshUsage();
      await refetch();
      toast.success('Usage data refreshed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh usage');
    }
  };

  if (loading) {
    return (
      <BillingContainer>
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2 text-muted">Loading billing information...</p>
        </div>
      </BillingContainer>
    );
  }

  if (error) {
    return (
      <BillingContainer>
        <Alert variant="danger">
          <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
          Failed to load billing information: {error.message}
        </Alert>
      </BillingContainer>
    );
  }

  const billing = data?.getBillingInfo;
  const subscription = billing?.subscription;
  const usage = billing?.usage;

  return (
    <BillingContainer>
      {/* Subscription Status */}
      <BillingCard>
        <Card.Header>
          <FontAwesomeIcon icon={faCreditCard} className="me-2" />
          Subscription
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <TierBadge $tier={subscription?.storageTier ?? 'FREE'}>
                  <FontAwesomeIcon icon={faCrown} />
                  {formatTier(subscription?.storageTier ?? 'FREE')} Plan
                </TierBadge>
                <StatusBadge $valid={subscription?.isValid ?? false}>
                  <FontAwesomeIcon
                    icon={subscription?.isValid ? faCheckCircle : faTimesCircle}
                  />
                  {subscription?.isValid ? 'Active' : subscription?.status}
                </StatusBadge>
              </div>
              
              <SubscriptionGrid>
                <SubscriptionItem>
                  <SubscriptionLabel>Storage Tier</SubscriptionLabel>
                  <SubscriptionValue>
                    {getStorageLimit(subscription?.storageTier ?? 'FREE')}
                  </SubscriptionValue>
                </SubscriptionItem>
                <SubscriptionItem>
                  <SubscriptionLabel>Account Tier</SubscriptionLabel>
                  <SubscriptionValue>
                    {getAccountLimit(subscription?.accountTier ?? 'FREE')}
                  </SubscriptionValue>
                </SubscriptionItem>
                {subscription?.currentPeriodEnd && (
                  <SubscriptionItem>
                    <SubscriptionLabel>
                      {subscription?.cancelAtPeriodEnd
                        ? 'Cancels On'
                        : 'Renews On'}
                    </SubscriptionLabel>
                    <SubscriptionValue>
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </SubscriptionValue>
                  </SubscriptionItem>
                )}
              </SubscriptionGrid>

              {subscription?.cancelAtPeriodEnd && (
                <WarningBox>
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <div>
                    Your subscription will be canceled at the end of the current
                    billing period. You'll be downgraded to the Free plan.
                  </div>
                </WarningBox>
              )}
            </div>

            {billing?.isStripeConfigured && (
              <Button
                variant="outline-primary"
                onClick={handleManageSubscription}
                disabled={creatingPortal}
              >
                {creatingPortal ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : (
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="me-2" />
                )}
                Manage Subscription
              </Button>
            )}
          </div>

          {!billing?.isStripeConfigured && (
            <Alert variant="info" className="mt-3 mb-0">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Billing is not configured on this server. Contact your administrator
              to enable paid plans.
            </Alert>
          )}
        </Card.Body>
      </BillingCard>

      {/* Usage */}
      <BillingCard>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>
            <FontAwesomeIcon icon={faChartPie} className="me-2" />
            Current Usage
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={handleRefreshUsage}
            disabled={refreshingUsage}
            className="p-0"
          >
            <FontAwesomeIcon
              icon={faSync}
              spin={refreshingUsage}
              className="me-1"
            />
            Refresh
          </Button>
        </Card.Header>
        <Card.Body>
          <UsageSection>
            {/* Storage Usage */}
            <UsageItem>
              <UsageHeader>
                <UsageLabel>
                  <FontAwesomeIcon icon={faDatabase} className="me-2" />
                  Storage
                </UsageLabel>
                <UsageValue>
                  {usage?.totalStorageGB?.toFixed(1) ?? 0} GB /{' '}
                  {getStorageLimit(subscription?.storageTier ?? 'FREE')}
                </UsageValue>
              </UsageHeader>
              <StyledProgressBar
                now={billing?.storageUsagePercent ?? 0}
                $variant={getProgressVariant(billing?.storageUsagePercent ?? 0)}
              />
              <div className="d-flex justify-content-between">
                <small className="text-muted">
                  {formatBytes(usage?.totalStorageBytes ?? 0)} used
                </small>
                <small className="text-muted">
                  {billing?.storageUsagePercent?.toFixed(1) ?? 0}% used
                </small>
              </div>
            </UsageItem>

            {/* Account Usage */}
            <UsageItem>
              <UsageHeader>
                <UsageLabel>
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                  Email Accounts
                </UsageLabel>
                <UsageValue>
                  {usage?.accountCount ?? 0} /{' '}
                  {subscription?.accountLimit === -1
                    ? '∞'
                    : subscription?.accountLimit}
                </UsageValue>
              </UsageHeader>
              {subscription?.accountLimit !== -1 && (
                <StyledProgressBar
                  now={billing?.accountUsagePercent ?? 0}
                  $variant={getProgressVariant(billing?.accountUsagePercent ?? 0)}
                />
              )}
            </UsageItem>

            {/* Stats */}
            <SubscriptionGrid>
              <SubscriptionItem>
                <SubscriptionLabel>Total Emails</SubscriptionLabel>
                <SubscriptionValue>
                  {usage?.emailCount?.toLocaleString() ?? 0}
                </SubscriptionValue>
              </SubscriptionItem>
              <SubscriptionItem>
                <SubscriptionLabel>Total Attachments</SubscriptionLabel>
                <SubscriptionValue>
                  {usage?.attachmentCount?.toLocaleString() ?? 0}
                </SubscriptionValue>
              </SubscriptionItem>
            </SubscriptionGrid>
          </UsageSection>

          {billing?.isStorageLimitExceeded && (
            <ErrorBox>
              <FontAwesomeIcon icon={faTimesCircle} />
              <div>
                <strong>Storage limit exceeded!</strong> Email syncing is paused.
                Please upgrade your plan or delete some emails to resume syncing.
              </div>
            </ErrorBox>
          )}

          {billing?.isAccountLimitExceeded && (
            <ErrorBox>
              <FontAwesomeIcon icon={faTimesCircle} />
              <div>
                <strong>Account limit exceeded!</strong> Please upgrade your plan
                or remove some email accounts.
              </div>
            </ErrorBox>
          )}

          {!billing?.isStorageLimitExceeded &&
            (billing?.storageUsagePercent ?? 0) >= 80 && (
              <WarningBox>
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <div>
                  You're using {billing?.storageUsagePercent?.toFixed(1)}% of
                  your storage. Consider upgrading to avoid sync interruptions.
                </div>
              </WarningBox>
            )}

          {usage?.lastRefreshedAt && (
            <LastRefreshed>
              Usage last calculated:{' '}
              {new Date(usage.lastRefreshedAt).toLocaleString()}
            </LastRefreshed>
          )}
        </Card.Body>
      </BillingCard>
    </BillingContainer>
  );
}
