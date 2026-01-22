import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Card, Button, Spinner, Alert, Modal } from 'react-bootstrap';
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
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import {
  GET_BILLING_INFO_QUERY,
  CREATE_BILLING_PORTAL_SESSION_MUTATION,
  REFRESH_STORAGE_USAGE_MUTATION,
  CREATE_CHECKOUT_SESSION_MUTATION,
} from '../queries';
import { StorageTier, AccountTier } from '../../../__generated__/graphql';
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
  TierSelectionGrid,
  TierCard,
  TierCardHeader,
  TierCardPrice,
  TierCardFeatures,
  TierCardFeature,
  CurrentBadge,
  PendingChangesBar,
  SegmentedProgressContainer,
  ProgressSegment,
  ProgressLegend,
  LegendItem,
  LegendDot,
  DowngradeWarning,
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

// Storage limits in bytes for each tier
const STORAGE_LIMIT_BYTES: Record<string, number> = {
  FREE: 5 * 1024 * 1024 * 1024, // 5 GB
  BASIC: 10 * 1024 * 1024 * 1024, // 10 GB
  PRO: 20 * 1024 * 1024 * 1024, // 20 GB
  ENTERPRISE: 100 * 1024 * 1024 * 1024, // 100 GB
};

// Account limits for each tier
const ACCOUNT_LIMIT_COUNT: Record<string, number> = {
  FREE: 1,
  BASIC: 2,
  PRO: 5,
  ENTERPRISE: -1, // unlimited
};

// Default tier info (used when Stripe prices not available)
const DEFAULT_STORAGE_TIERS = [
  { id: StorageTier.Free, name: 'Free', limit: '5 GB', price: '$0' },
  { id: StorageTier.Basic, name: 'Basic', limit: '10 GB', price: '$5/mo' },
  { id: StorageTier.Pro, name: 'Pro', limit: '20 GB', price: '$10/mo' },
  {
    id: StorageTier.Enterprise,
    name: 'Enterprise',
    limit: '100 GB',
    price: '$20/mo',
  },
];

const DEFAULT_ACCOUNT_TIERS = [
  { id: AccountTier.Free, name: 'Free', limit: '1 account', price: '$0' },
  { id: AccountTier.Basic, name: 'Basic', limit: '2 accounts', price: '$5/mo' },
  { id: AccountTier.Pro, name: 'Pro', limit: '5 accounts', price: '$10/mo' },
  {
    id: AccountTier.Enterprise,
    name: 'Enterprise',
    limit: 'Unlimited',
    price: '$20/mo',
  },
];

/**
 * Format price from cents to display string
 */
function formatPrice(
  unitAmount: number,
  currency: string,
  interval: string,
): string {
  const amount = unitAmount / 100;
  const currencySymbol = currency.toUpperCase() === 'USD' ? '$' : currency;
  const intervalLabel = interval === 'month' ? '/mo' : `/${interval}`;
  return `${currencySymbol}${amount}${intervalLabel}`;
}

interface TierInfo {
  id: StorageTier | AccountTier;
  name: string;
  limit: string;
  price: string;
}

/**
 * Build tier list from Stripe prices, falling back to defaults
 */
function buildStorageTiers(
  prices: Array<{
    tier: string;
    type: string;
    name: string;
    unitAmount: number;
    currency: string;
    interval: string;
  }>,
): TierInfo[] {
  const storagePrices = prices.filter((p) => p.type === 'storage');
  const priceMap = new Map(storagePrices.map((p) => [p.tier, p]));

  return DEFAULT_STORAGE_TIERS.map((tier) => {
    const stripePrice = priceMap.get(tier.id.toUpperCase());
    if (stripePrice) {
      return {
        ...tier,
        name: stripePrice.name.replace(' Storage', '').replace(' storage', ''),
        price: formatPrice(
          stripePrice.unitAmount,
          stripePrice.currency,
          stripePrice.interval,
        ),
      };
    }
    return tier;
  });
}

function buildAccountTiers(
  prices: Array<{
    tier: string;
    type: string;
    name: string;
    unitAmount: number;
    currency: string;
    interval: string;
  }>,
): TierInfo[] {
  const accountPrices = prices.filter((p) => p.type === 'account');
  const priceMap = new Map(accountPrices.map((p) => [p.tier, p]));

  return DEFAULT_ACCOUNT_TIERS.map((tier) => {
    const stripePrice = priceMap.get(tier.id.toUpperCase());
    if (stripePrice) {
      return {
        ...tier,
        name: stripePrice.name
          .replace(' Accounts', '')
          .replace(' accounts', ''),
        price: formatPrice(
          stripePrice.unitAmount,
          stripePrice.currency,
          stripePrice.interval,
        ),
      };
    }
    return tier;
  });
}

export function BillingSettings() {
  const { data, loading, error, refetch } = useQuery(GET_BILLING_INFO_QUERY);
  const [createPortalSession, { loading: creatingPortal }] = useMutation(
    CREATE_BILLING_PORTAL_SESSION_MUTATION,
  );
  const [refreshUsage, { loading: refreshingUsage }] = useMutation(
    REFRESH_STORAGE_USAGE_MUTATION,
  );
  const [createCheckoutSession, { loading: creatingCheckout }] = useMutation(
    CREATE_CHECKOUT_SESSION_MUTATION,
  );

  // Pending tier selections
  const [pendingStorageTier, setPendingStorageTier] =
    useState<StorageTier | null>(null);
  const [pendingAccountTier, setPendingAccountTier] =
    useState<AccountTier | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Auto-refresh on page focus
  useEffect(() => {
    const handleFocus = () => {
      refetch();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  // Check URL for checkout success/cancel
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkout = urlParams.get('checkout');
    if (checkout === 'success') {
      toast.success('Subscription updated successfully!');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      refetch();
    } else if (checkout === 'canceled') {
      toast('Checkout was canceled', { icon: '⚠️' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refetch]);

  const handleManageBilling = async () => {
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

  const handleStorageTierSelect = useCallback(
    (tier: StorageTier) => {
      const currentTier = data?.getBillingInfo?.subscription?.storageTier;
      if (tier === currentTier) {
        setPendingStorageTier(null);
      } else {
        setPendingStorageTier(tier);
      }
    },
    [data?.getBillingInfo?.subscription?.storageTier],
  );

  const handleAccountTierSelect = useCallback(
    (tier: AccountTier) => {
      const currentTier = data?.getBillingInfo?.subscription?.accountTier;
      if (tier === currentTier) {
        setPendingAccountTier(null);
      } else {
        setPendingAccountTier(tier);
      }
    },
    [data?.getBillingInfo?.subscription?.accountTier],
  );

  const handleConfirmChanges = async () => {
    const storageTier =
      pendingStorageTier ||
      (data?.getBillingInfo?.subscription?.storageTier as StorageTier);
    const accountTier =
      pendingAccountTier ||
      (data?.getBillingInfo?.subscription?.accountTier as AccountTier);

    // If downgrading to free on both, we can't do that via checkout - they need to cancel in portal
    if (storageTier === StorageTier.Free && accountTier === AccountTier.Free) {
      toast.error(
        'To cancel your subscription, please use the Manage Billing button',
      );
      setShowConfirmModal(false);
      return;
    }

    try {
      const result = await createCheckoutSession({
        variables: {
          storageTier,
          accountTier,
        },
      });
      const url = result.data?.createCheckoutSession;
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create checkout session');
    }
    setShowConfirmModal(false);
  };

  const hasPendingChanges =
    pendingStorageTier !== null || pendingAccountTier !== null;

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
  const hasStripeCustomer = billing?.hasStripeCustomer;

  const currentStorageTier = subscription?.storageTier ?? 'FREE';
  const currentAccountTier = subscription?.accountTier ?? 'FREE';
  const effectiveStorageTier = pendingStorageTier || currentStorageTier;
  const effectiveAccountTier = pendingAccountTier || currentAccountTier;

  // Build tier lists from Stripe prices (if available)
  const storageTiers = buildStorageTiers(billing?.prices ?? []);
  const accountTiers = buildAccountTiers(billing?.prices ?? []);

  return (
    <BillingContainer>
      {/* Pending changes bar */}
      {hasPendingChanges && (
        <PendingChangesBar>
          <div>
            <strong>Pending changes:</strong>{' '}
            {pendingStorageTier && `Storage: ${formatTier(pendingStorageTier)}`}
            {pendingStorageTier && pendingAccountTier && ', '}
            {pendingAccountTier &&
              `Accounts: ${formatTier(pendingAccountTier)}`}
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => {
                setPendingStorageTier(null);
                setPendingAccountTier(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              disabled={creatingCheckout}
            >
              {creatingCheckout ? (
                <Spinner animation="border" size="sm" className="me-1" />
              ) : (
                <FontAwesomeIcon icon={faArrowRight} className="me-1" />
              )}
              Confirm Changes
            </Button>
          </div>
        </PendingChangesBar>
      )}

      {/* Current Subscription Status */}
      <BillingCard>
        <Card.Header>
          <FontAwesomeIcon icon={faCreditCard} className="me-2" />
          Current Subscription
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <TierBadge $tier={currentStorageTier}>
                  <FontAwesomeIcon icon={faCrown} />
                  {formatTier(currentStorageTier)} Plan
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
                    {getStorageLimit(currentStorageTier)}
                  </SubscriptionValue>
                </SubscriptionItem>
                <SubscriptionItem>
                  <SubscriptionLabel>Account Tier</SubscriptionLabel>
                  <SubscriptionValue>
                    {getAccountLimit(currentAccountTier)}
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
                      {new Date(
                        subscription.currentPeriodEnd,
                      ).toLocaleDateString()}
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

            {billing?.isStripeConfigured && hasStripeCustomer && (
              <Button
                variant="outline-primary"
                onClick={handleManageBilling}
                disabled={creatingPortal}
              >
                {creatingPortal ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : (
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="me-2" />
                )}
                Manage Billing
              </Button>
            )}
          </div>

          {!billing?.isStripeConfigured && (
            <Alert variant="info" className="mt-3 mb-0">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Billing is not configured on this server. Contact your
              administrator to enable paid plans.
            </Alert>
          )}
        </Card.Body>
      </BillingCard>

      {/* Tier Selection */}
      {billing?.isStripeConfigured && (
        <>
          <BillingCard>
            <Card.Header>
              <FontAwesomeIcon icon={faDatabase} className="me-2" />
              Storage Plan
            </Card.Header>
            <Card.Body>
              {!hasStripeCustomer && (
                <Alert variant="warning" className="mb-3">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="me-2"
                  />
                  To upgrade from the free tier, you'll need to enter your
                  billing information first.
                </Alert>
              )}
              <TierSelectionGrid>
                {storageTiers.map((tier) => {
                  const isCurrent = currentStorageTier === tier.id;
                  const isSelected = effectiveStorageTier === tier.id;
                  const isPending = pendingStorageTier === tier.id;
                  return (
                    <TierCard
                      key={tier.id}
                      $selected={isSelected}
                      $current={isCurrent}
                      onClick={() =>
                        handleStorageTierSelect(tier.id as StorageTier)
                      }
                    >
                      {isCurrent && <CurrentBadge>Current</CurrentBadge>}
                      <TierCardHeader>{tier.name}</TierCardHeader>
                      <TierCardPrice>{tier.price}</TierCardPrice>
                      <TierCardFeatures>
                        <TierCardFeature>
                          <FontAwesomeIcon icon={faCheckCircle} />
                          {tier.limit} storage
                        </TierCardFeature>
                      </TierCardFeatures>
                      {isPending && (
                        <small className="text-warning mt-2 d-block">
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            className="me-1"
                          />
                          Selected
                        </small>
                      )}
                    </TierCard>
                  );
                })}
              </TierSelectionGrid>
              {/* Downgrade warning for storage */}
              {pendingStorageTier && (() => {
                const pendingLimitBytes = STORAGE_LIMIT_BYTES[pendingStorageTier] ?? 0;
                const currentUsageBytes = usage?.totalStorageBytes ?? 0;
                const wouldExceedLimit = currentUsageBytes > pendingLimitBytes;
                
                if (wouldExceedLimit) {
                  return (
                    <DowngradeWarning>
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      <div>
                        <strong>Storage limit will be exceeded</strong>
                        Your current usage ({formatBytes(currentUsageBytes)}) exceeds the{' '}
                        {formatTier(pendingStorageTier)} plan limit ({formatBytes(pendingLimitBytes)}).
                        Email syncing will be paused until you free up storage or upgrade to a higher tier.
                        Existing emails will not be deleted, but new emails won't sync until you're under the limit.
                      </div>
                    </DowngradeWarning>
                  );
                }
                return null;
              })()}
            </Card.Body>
          </BillingCard>

          <BillingCard>
            <Card.Header>
              <FontAwesomeIcon icon={faEnvelope} className="me-2" />
              Email Accounts Plan
            </Card.Header>
            <Card.Body>
              <TierSelectionGrid>
                {accountTiers.map((tier) => {
                  const isCurrent = currentAccountTier === tier.id;
                  const isSelected = effectiveAccountTier === tier.id;
                  const isPending = pendingAccountTier === tier.id;
                  return (
                    <TierCard
                      key={tier.id}
                      $selected={isSelected}
                      $current={isCurrent}
                      onClick={() =>
                        handleAccountTierSelect(tier.id as AccountTier)
                      }
                    >
                      {isCurrent && <CurrentBadge>Current</CurrentBadge>}
                      <TierCardHeader>{tier.name}</TierCardHeader>
                      <TierCardPrice>{tier.price}</TierCardPrice>
                      <TierCardFeatures>
                        <TierCardFeature>
                          <FontAwesomeIcon icon={faCheckCircle} />
                          {tier.limit}
                        </TierCardFeature>
                      </TierCardFeatures>
                      {isPending && (
                        <small className="text-warning mt-2 d-block">
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            className="me-1"
                          />
                          Selected
                        </small>
                      )}
                    </TierCard>
                  );
                })}
              </TierSelectionGrid>
              {/* Downgrade warning for accounts */}
              {pendingAccountTier && (() => {
                const pendingLimit = ACCOUNT_LIMIT_COUNT[pendingAccountTier] ?? 0;
                const currentAccountCount = usage?.accountCount ?? 0;
                // -1 means unlimited, so never warn for that
                const wouldExceedLimit = pendingLimit !== -1 && currentAccountCount > pendingLimit;
                
                if (wouldExceedLimit) {
                  return (
                    <DowngradeWarning>
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      <div>
                        <strong>Account limit will be exceeded</strong>
                        You currently have {currentAccountCount} email account{currentAccountCount !== 1 ? 's' : ''}, 
                        but the {formatTier(pendingAccountTier)} plan only allows {pendingLimit}.
                        You won't be able to add new email accounts until you remove some or upgrade to a higher tier.
                        Existing accounts will continue to work, but some may be disabled if you don't remove them.
                      </div>
                    </DowngradeWarning>
                  );
                }
                return null;
              })()}
            </Card.Body>
          </BillingCard>
        </>
      )}

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
            {/* Storage Usage - Segmented by type */}
            <UsageItem>
              <UsageHeader>
                <UsageLabel>
                  <FontAwesomeIcon icon={faDatabase} className="me-2" />
                  Storage
                </UsageLabel>
                <UsageValue>
                  {usage?.totalStorageGB?.toFixed(1) ?? 0} GB /{' '}
                  {getStorageLimit(currentStorageTier)}
                </UsageValue>
              </UsageHeader>
              <SegmentedProgressContainer>
                {(() => {
                  const totalBytes = usage?.totalStorageBytes ?? 0;
                  const limitBytes = subscription?.storageLimitBytes ?? 1;
                  const emailBytes = usage?.totalBodySizeBytes ?? 0;
                  const attachmentBytes = usage?.totalAttachmentSizeBytes ?? 0;
                  const emailPercent = limitBytes > 0 ? Math.min(100, (emailBytes / limitBytes) * 100) : 0;
                  const attachmentPercent = limitBytes > 0 ? Math.min(100 - emailPercent, (attachmentBytes / limitBytes) * 100) : 0;
                  
                  return (
                    <>
                      {emailPercent > 0 && (
                        <ProgressSegment $width={emailPercent} $color="email" />
                      )}
                      {attachmentPercent > 0 && (
                        <ProgressSegment $width={attachmentPercent} $color="attachment" />
                      )}
                    </>
                  );
                })()}
              </SegmentedProgressContainer>
              <ProgressLegend>
                <LegendItem>
                  <LegendDot $color="email" />
                  Email Content: {formatBytes(usage?.totalBodySizeBytes ?? 0)}
                </LegendItem>
                <LegendItem>
                  <LegendDot $color="attachment" />
                  Attachments: {formatBytes(usage?.totalAttachmentSizeBytes ?? 0)}
                </LegendItem>
              </ProgressLegend>
              <div className="d-flex justify-content-between mt-1">
                <small className="text-muted">
                  {formatBytes(usage?.totalStorageBytes ?? 0)} total used
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
                  $variant={getProgressVariant(
                    billing?.accountUsagePercent ?? 0,
                  )}
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
                <strong>Storage limit exceeded!</strong> Email syncing is
                paused. Please upgrade your plan or delete some emails to resume
                syncing.
              </div>
            </ErrorBox>
          )}

          {billing?.isAccountLimitExceeded && (
            <ErrorBox>
              <FontAwesomeIcon icon={faTimesCircle} />
              <div>
                <strong>Account limit exceeded!</strong> Please upgrade your
                plan or remove some email accounts.
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

      {/* Confirm Changes Modal */}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Subscription Changes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You are about to change your subscription:</p>
          <ul>
            {pendingStorageTier && (
              <li>
                Storage: {formatTier(currentStorageTier)} →{' '}
                {formatTier(pendingStorageTier)}
              </li>
            )}
            {pendingAccountTier && (
              <li>
                Accounts: {formatTier(currentAccountTier)} →{' '}
                {formatTier(pendingAccountTier)}
              </li>
            )}
          </ul>
          <p className="text-muted mb-0">
            You'll be redirected to Stripe to complete the payment.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmChanges}
            disabled={creatingCheckout}
          >
            {creatingCheckout ? (
              <Spinner animation="border" size="sm" className="me-1" />
            ) : null}
            Continue to Payment
          </Button>
        </Modal.Footer>
      </Modal>
    </BillingContainer>
  );
}
