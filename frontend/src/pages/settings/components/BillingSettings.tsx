import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
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
  faGlobe,
  faSync,
  faCrown,
  faArrowRight,
  faInfoCircle,
  faPen,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import {
  GET_BILLING_INFO_QUERY,
  CREATE_BILLING_PORTAL_SESSION_MUTATION,
  REFRESH_STORAGE_USAGE_MUTATION,
  CREATE_CHECKOUT_SESSION_MUTATION,
  PREVIEW_SUBSCRIPTION_CHANGE_QUERY,
} from '../queries';
import {
  StorageTier,
  AccountTier,
  DomainTier,
  BillingSubscriptionStatus,
} from '../../../__generated__/graphql';
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
  UnavailableBadge,
} from './BillingSettings.wrappers';
import {
  formatTier,
  getStorageLimit,
  getAccountLimit,
  getDomainLimit,
  buildStorageTiers,
  buildAccountTiers,
  buildDomainTiers,
  type TierInfo,
} from './billingTierBuilders';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatCents(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function getProgressVariant(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 90) return 'danger';
  if (percent >= 75) return 'warning';
  return 'success';
}

function findTierInfo(tiers: TierInfo[], id: string): TierInfo | undefined {
  return tiers.find((t) => t.id === id);
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

const DOMAIN_LIMIT_COUNT: Record<string, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  ENTERPRISE: 5,
};

export function BillingSettings() {
  // Extract checkout session ID from URL (set by Stripe redirect)
  const [checkoutSessionId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkout = urlParams.get('checkout');
    if (checkout === 'success') {
      return urlParams.get('session_id') ?? undefined;
    }
    return undefined;
  });

  const { data, loading, error, refetch } = useQuery(GET_BILLING_INFO_QUERY, {
    variables: { sessionId: checkoutSessionId },
  });
  const [createPortalSession, { loading: creatingPortal }] = useMutation(
    CREATE_BILLING_PORTAL_SESSION_MUTATION,
  );
  const [refreshUsage, { loading: refreshingUsage }] = useMutation(
    REFRESH_STORAGE_USAGE_MUTATION,
  );
  const [createCheckoutSession, { loading: creatingCheckout }] = useMutation(
    CREATE_CHECKOUT_SESSION_MUTATION,
  );
  const [fetchPreview, { data: previewData, loading: loadingPreview }] =
    useLazyQuery(PREVIEW_SUBSCRIPTION_CHANGE_QUERY, {
      fetchPolicy: 'network-only',
    });

  // Pending tier selections
  const [pendingStorageTier, setPendingStorageTier] =
    useState<StorageTier | null>(null);
  const [pendingAccountTier, setPendingAccountTier] =
    useState<AccountTier | null>(null);
  const [pendingDomainTier, setPendingDomainTier] =
    useState<DomainTier | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalStep, setConfirmModalStep] = useState<1 | 2>(1);
  const [editingStoragePlan, setEditingStoragePlan] = useState(false);
  const [editingAccountPlan, setEditingAccountPlan] = useState(false);
  const [editingDomainPlan, setEditingDomainPlan] = useState(false);

  // Auto-refresh on page focus
  useEffect(() => {
    const handleFocus = () => {
      void refetch();
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
    } else if (checkout === 'canceled') {
      toast('Checkout was canceled', { icon: '⚠️' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleManageBilling = async () => {
    try {
      const result = await createPortalSession();
      const url = result.data?.createBillingPortalSession;
      if (url) {
        window.open(url, '_blank');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to open billing portal');
    }
  };

  /** Same mutation as plan changes: in-place resume/update or Checkout for a new subscription. */
  const runCheckoutSessionWithTiers = async (
    storageTier: StorageTier,
    accountTier: AccountTier,
    domainTier: DomainTier,
    inPlaceSuccessMessage: string,
  ) => {
    try {
      const result = await createCheckoutSession({
        variables: { storageTier, accountTier, domainTier },
      });
      const url = result.data?.createCheckoutSession;
      if (url) {
        window.location.href = url;
      } else {
        await refetch();
        toast.success(inPlaceSuccessMessage);
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update subscription',
      );
    }
  };

  const handleRefreshUsage = async () => {
    try {
      await refreshUsage();
      await refetch();
      toast.success('Usage data refreshed');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to refresh usage');
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

  const handleDomainTierSelect = useCallback(
    (tier: DomainTier) => {
      const currentTier = data?.getBillingInfo?.subscription?.domainTier;
      if (tier === currentTier) {
        setPendingDomainTier(null);
      } else {
        setPendingDomainTier(tier);
      }
    },
    [data?.getBillingInfo?.subscription?.domainTier],
  );

  const handleConfirmChanges = async () => {
    const storageTier =
      pendingStorageTier ||
      (data?.getBillingInfo?.subscription?.storageTier as StorageTier);
    const accountTier =
      pendingAccountTier ||
      (data?.getBillingInfo?.subscription?.accountTier as AccountTier);
    const domainTier =
      pendingDomainTier ||
      (data?.getBillingInfo?.subscription?.domainTier as DomainTier);

    try {
      const result = await createCheckoutSession({
        variables: {
          storageTier,
          accountTier,
          domainTier,
        },
      });
      const url = result.data?.createCheckoutSession;
      if (url) {
        // First-time subscription: redirect to Stripe Checkout
        window.location.href = url;
      } else {
        // Existing subscription updated in-place
        setPendingStorageTier(null);
        setPendingAccountTier(null);
        setPendingDomainTier(null);
        await refetch();
        toast.success('Subscription updated successfully');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update subscription');
    }
    setShowConfirmModal(false);
  };

  const handleOpenConfirmModal = () => {
    setShowConfirmModal(true);
    if (hasStripeCustomer) {
      const storageTier =
        pendingStorageTier ||
        (data?.getBillingInfo?.subscription?.storageTier as StorageTier);
      const accountTier =
        pendingAccountTier ||
        (data?.getBillingInfo?.subscription?.accountTier as AccountTier);
      const domainTier =
        pendingDomainTier ||
        (data?.getBillingInfo?.subscription?.domainTier as DomainTier);
      void fetchPreview({ variables: { storageTier, accountTier, domainTier } });
    }
  };

  const preview = previewData?.previewSubscriptionChange;

  const hasPendingChanges =
    pendingStorageTier !== null ||
    pendingAccountTier !== null ||
    pendingDomainTier !== null;

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

  const currentStorageTier = subscription?.storageTier ?? StorageTier.Free;
  const currentAccountTier = subscription?.accountTier ?? AccountTier.Free;
  const currentDomainTier = subscription?.domainTier ?? DomainTier.Free;

  const hasAnyPaidTier =
    !!subscription &&
    (subscription.storageTier !== StorageTier.Free ||
      subscription.accountTier !== AccountTier.Free ||
      subscription.domainTier !== DomainTier.Free);

  const showResubscribe =
    subscription?.status === BillingSubscriptionStatus.Canceled && hasAnyPaidTier;
  const effectiveStorageTier = pendingStorageTier || currentStorageTier;
  const effectiveAccountTier = pendingAccountTier || currentAccountTier;
  const effectiveDomainTier = pendingDomainTier || currentDomainTier;

  const storageTiers = buildStorageTiers(billing?.prices ?? []);
  const accountTiers = buildAccountTiers(billing?.prices ?? []);
  const domainTiers = buildDomainTiers(billing?.prices ?? []);

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
            {(pendingStorageTier || pendingAccountTier) && pendingDomainTier && ', '}
            {pendingDomainTier &&
              `Domains: ${formatTier(pendingDomainTier, 'domain')}`}
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => {
                setPendingStorageTier(null);
                setPendingAccountTier(null);
                setPendingDomainTier(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={handleOpenConfirmModal}
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
      <BillingCard className="card">
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
                <SubscriptionItem>
                  <SubscriptionLabel>Domain Tier</SubscriptionLabel>
                  <SubscriptionValue>
                    {getDomainLimit(currentDomainTier)}
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

              {(() => {
                const platformPrice = billing?.prices?.find(
                  (p) => p.type === 'platform',
                );
                if (!platformPrice) return null;
                return (
                  <p className="text-muted small mb-0 mt-2">
                    {platformPrice.name}:{' '}
                    {formatCents(
                      platformPrice.unitAmount,
                      platformPrice.currency,
                    )}
                    /{platformPrice.interval}
                  </p>
                );
              })()}

              {subscription?.cancelAtPeriodEnd && subscription?.isValid && (
                <>
                  <WarningBox>
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <div>
                      Your subscription will be canceled at the end of the
                      current billing period. You'll be downgraded to the Free
                      plan.
                    </div>
                  </WarningBox>
                  <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={creatingCheckout}
                      onClick={() =>
                        runCheckoutSessionWithTiers(
                          currentStorageTier,
                          currentAccountTier,
                          currentDomainTier,
                          'Your subscription will continue — billing resumes as normal.',
                        )
                      }
                    >
                      {creatingCheckout ? (
                        <Spinner animation="border" size="sm" className="me-1" />
                      ) : (
                        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                      )}
                      Resume subscription
                    </Button>
                    <small className="text-muted">
                      Payment methods and invoices are still available in Manage
                      Billing.
                    </small>
                  </div>
                </>
              )}
            </div>

            {billing?.isStripeConfigured &&
              (hasStripeCustomer || showResubscribe) && (
                <div className="d-flex flex-column align-items-stretch align-items-md-end gap-2">
                  {showResubscribe && (
                    <>
                      <Button
                        variant="primary"
                        onClick={() =>
                          runCheckoutSessionWithTiers(
                            currentStorageTier,
                            currentAccountTier,
                            currentDomainTier,
                            'Welcome back — your subscription is active again.',
                          )
                        }
                        disabled={creatingCheckout}
                      >
                        {creatingCheckout ? (
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                        ) : (
                          <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                        )}
                        Resubscribe
                      </Button>
                      <small className="text-muted text-md-end">
                        Completes checkout on Stripe to start a new subscription.
                      </small>
                    </>
                  )}
                  {hasStripeCustomer && (
                    <Button
                      variant="outline-primary"
                      onClick={handleManageBilling}
                      disabled={creatingPortal}
                    >
                      {creatingPortal ? (
                        <Spinner animation="border" size="sm" className="me-2" />
                      ) : (
                        <FontAwesomeIcon
                          icon={faExternalLinkAlt}
                          className="me-2"
                        />
                      )}
                      Manage Billing
                    </Button>
                  )}
                </div>
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
          <BillingCard className="card">
            <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span>
                <FontAwesomeIcon icon={faDatabase} className="me-2" />
                Storage Plan
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setEditingStoragePlan((v) => !v)}
              >
                <FontAwesomeIcon
                  icon={editingStoragePlan ? faCheck : faPen}
                  className="me-1"
                />
                {editingStoragePlan ? 'Done' : 'Edit'}
              </Button>
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
              {!editingStoragePlan ? (
                (() => {
                  const info = findTierInfo(
                    storageTiers,
                    currentStorageTier,
                  );
                  return (
                    <div className="d-flex flex-column gap-1">
                      <span className="fw-semibold">
                        {info?.name ?? formatTier(currentStorageTier)}
                      </span>
                      <span className="text-muted">{info?.price ?? '—'}</span>
                      <span className="text-muted small">
                        {info?.limit ?? getStorageLimit(currentStorageTier)}{' '}
                        storage
                      </span>
                    </div>
                  );
                })()
              ) : (
                <>
                  <TierSelectionGrid>
                    {storageTiers.map((tier) => {
                      const isCurrent = currentStorageTier === tier.id;
                      const isSelected = effectiveStorageTier === tier.id;
                      const isPending = pendingStorageTier === tier.id;
                      const isDisabled = !tier.isConfigured;
                      return (
                        <TierCard
                          key={tier.id}
                          $selected={isSelected}
                          $current={isCurrent}
                          $disabled={isDisabled}
                          onClick={() =>
                            !isDisabled &&
                            handleStorageTierSelect(tier.id as StorageTier)
                          }
                        >
                          {isCurrent && <CurrentBadge>Current</CurrentBadge>}
                          {isDisabled && !isCurrent && (
                            <UnavailableBadge>Coming Soon</UnavailableBadge>
                          )}
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
                  {pendingStorageTier && (() => {
                    const pendingLimitBytes =
                      STORAGE_LIMIT_BYTES[pendingStorageTier] ?? 0;
                    const currentUsageBytes = usage?.totalStorageBytes ?? 0;
                    const wouldExceedLimit =
                      currentUsageBytes > pendingLimitBytes;

                    if (wouldExceedLimit) {
                      return (
                        <DowngradeWarning>
                          <FontAwesomeIcon icon={faExclamationTriangle} />
                          <div>
                            <strong>Storage limit will be exceeded</strong>
                            Your current usage ({formatBytes(currentUsageBytes)})
                            exceeds the {formatTier(pendingStorageTier)} plan
                            limit ({formatBytes(pendingLimitBytes)}). Email
                            syncing will be paused until you free up storage or
                            upgrade to a higher tier. Existing emails will not
                            be deleted, but new emails won't sync until you're
                            under the limit.
                          </div>
                        </DowngradeWarning>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </Card.Body>
          </BillingCard>

          <BillingCard className="card">
            <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span>
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                Email Accounts Plan
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setEditingAccountPlan((v) => !v)}
              >
                <FontAwesomeIcon
                  icon={editingAccountPlan ? faCheck : faPen}
                  className="me-1"
                />
                {editingAccountPlan ? 'Done' : 'Edit'}
              </Button>
            </Card.Header>
            <Card.Body>
              {!editingAccountPlan ? (
                (() => {
                  const info = findTierInfo(
                    accountTiers,
                    currentAccountTier,
                  );
                  return (
                    <div className="d-flex flex-column gap-1">
                      <span className="fw-semibold">
                        {info?.name ?? formatTier(currentAccountTier)}
                      </span>
                      <span className="text-muted">{info?.price ?? '—'}</span>
                      <span className="text-muted small">
                        {info?.limit ?? getAccountLimit(currentAccountTier)}
                      </span>
                    </div>
                  );
                })()
              ) : (
                <>
                  <TierSelectionGrid>
                    {accountTiers.map((tier) => {
                      const isCurrent = currentAccountTier === tier.id;
                      const isSelected = effectiveAccountTier === tier.id;
                      const isPending = pendingAccountTier === tier.id;
                      const isDisabled = !tier.isConfigured;
                      return (
                        <TierCard
                          key={tier.id}
                          $selected={isSelected}
                          $current={isCurrent}
                          $disabled={isDisabled}
                          onClick={() =>
                            !isDisabled &&
                            handleAccountTierSelect(tier.id as AccountTier)
                          }
                        >
                          {isCurrent && <CurrentBadge>Current</CurrentBadge>}
                          {isDisabled && !isCurrent && (
                            <UnavailableBadge>Coming Soon</UnavailableBadge>
                          )}
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
                  {pendingAccountTier && (() => {
                    const pendingLimit =
                      ACCOUNT_LIMIT_COUNT[pendingAccountTier] ?? 0;
                    const currentAccountCount = usage?.accountCount ?? 0;
                    const wouldExceedLimit =
                      pendingLimit !== -1 &&
                      currentAccountCount > pendingLimit;

                    if (wouldExceedLimit) {
                      return (
                        <DowngradeWarning>
                          <FontAwesomeIcon icon={faExclamationTriangle} />
                          <div>
                            <strong>Account limit will be exceeded</strong>
                            You currently have {currentAccountCount} email
                            account{currentAccountCount !== 1 ? 's' : ''}, but
                            the {formatTier(pendingAccountTier)} plan only
                            allows {pendingLimit}. You won't be able to add new
                            email accounts until you remove some or upgrade to a
                            higher tier. Existing accounts will continue to
                            work, but some may be disabled if you don't remove
                            them.
                          </div>
                        </DowngradeWarning>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </Card.Body>
          </BillingCard>

          <BillingCard className="card">
            <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span>
                <FontAwesomeIcon icon={faGlobe} className="me-2" />
                Custom Domains Plan
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setEditingDomainPlan((v) => !v)}
              >
                <FontAwesomeIcon
                  icon={editingDomainPlan ? faCheck : faPen}
                  className="me-1"
                />
                {editingDomainPlan ? 'Done' : 'Edit'}
              </Button>
            </Card.Header>
            <Card.Body>
              {!editingDomainPlan ? (
                (() => {
                  const info = findTierInfo(domainTiers, currentDomainTier);
                  return (
                    <div className="d-flex flex-column gap-1">
                      <span className="fw-semibold">
                        {info?.name ??
                          formatTier(currentDomainTier, 'domain')}
                      </span>
                      <span className="text-muted">{info?.price ?? '—'}</span>
                      <span className="text-muted small">
                        {info?.limit ?? getDomainLimit(currentDomainTier)}
                      </span>
                    </div>
                  );
                })()
              ) : (
                <>
                  <TierSelectionGrid>
                    {domainTiers.map((tier) => {
                      const isCurrent = currentDomainTier === tier.id;
                      const isSelected = effectiveDomainTier === tier.id;
                      const isPending = pendingDomainTier === tier.id;
                      const isDisabled = !tier.isConfigured;
                      return (
                        <TierCard
                          key={tier.id}
                          $selected={isSelected}
                          $current={isCurrent}
                          $disabled={isDisabled}
                          onClick={() =>
                            !isDisabled &&
                            handleDomainTierSelect(tier.id as DomainTier)
                          }
                        >
                          {isCurrent && <CurrentBadge>Current</CurrentBadge>}
                          {isDisabled && !isCurrent && (
                            <UnavailableBadge>Coming Soon</UnavailableBadge>
                          )}
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
                  {pendingDomainTier && (() => {
                    const pendingLimit =
                      DOMAIN_LIMIT_COUNT[pendingDomainTier] ?? 0;
                    const currentDomainCount = usage?.domainCount ?? 0;
                    const wouldExceedLimit = currentDomainCount > pendingLimit;

                    if (wouldExceedLimit) {
                      return (
                        <DowngradeWarning>
                          <FontAwesomeIcon icon={faExclamationTriangle} />
                          <div>
                            <strong>Domain limit will be exceeded</strong>
                            You currently have {currentDomainCount} custom
                            domain{currentDomainCount !== 1 ? 's' : ''}, but
                            the {formatTier(pendingDomainTier, 'domain')} plan
                            only allows {pendingLimit}. You'll need to remove
                            domains before downgrading.
                          </div>
                        </DowngradeWarning>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </Card.Body>
          </BillingCard>
        </>
      )}

      {/* Usage */}
      <BillingCard className="card">
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

            {/* Domain Usage */}
            <UsageItem>
              <UsageHeader>
                <UsageLabel>
                  <FontAwesomeIcon icon={faGlobe} className="me-2" />
                  Custom Domains
                </UsageLabel>
                <UsageValue>
                  {usage?.domainCount ?? 0} /{' '}
                  {subscription?.domainLimit ?? 0}
                </UsageValue>
              </UsageHeader>
              {(subscription?.domainLimit ?? 0) > 0 && (
                <StyledProgressBar
                  now={billing?.domainUsagePercent ?? 0}
                  $variant={getProgressVariant(
                    billing?.domainUsagePercent ?? 0,
                  )}
                />
              )}
            </UsageItem>

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

          {billing?.isDomainLimitExceeded && (
            <ErrorBox>
              <FontAwesomeIcon icon={faTimesCircle} />
              <div>
                <strong>Domain limit exceeded!</strong> Please upgrade your
                plan or remove some custom domains.
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

      {/* Confirm Changes Modal - Two-step flow for new customers */}
      <Modal
        show={showConfirmModal}
        onHide={() => {
          setShowConfirmModal(false);
          setConfirmModalStep(1);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {!hasStripeCustomer && confirmModalStep === 1
              ? 'Set Up Billing'
              : 'Confirm Subscription Changes'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!hasStripeCustomer && confirmModalStep === 1 ? (
            /* Step 1: Configure billing info (for new customers) */
            <>
              <div className="text-center mb-3">
                <FontAwesomeIcon
                  icon={faCreditCard}
                  size="3x"
                  className="text-primary mb-3"
                />
              </div>
              <p>
                To upgrade your subscription, you'll need to set up your billing
                information first.
              </p>
              <p className="text-muted">
                You'll be securely redirected to Stripe to enter your payment
                details. Your information is never stored on our servers.
              </p>
              <Alert variant="info" className="mb-0">
                <small>
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  You can cancel anytime from your billing portal.
                </small>
              </Alert>
            </>
          ) : (
            /* Step 2: Confirm changes (or single step for existing customers) */
            <>
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
                {pendingDomainTier && (
                  <li>
                    Domains: {formatTier(currentDomainTier, 'domain')} →{' '}
                    {formatTier(pendingDomainTier, 'domain')}
                  </li>
                )}
              </ul>

              {hasStripeCustomer && loadingPreview && (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Calculating cost...
                </div>
              )}

              {hasStripeCustomer && preview && !loadingPreview && (
                <>
                  <hr />
                  {preview.lineItems.map((item, i) => (
                    <div
                      key={i}
                      className="d-flex justify-content-between mb-1"
                    >
                      <small className="text-muted">{item.description}</small>
                      <small
                        className={
                          item.amount < 0 ? 'text-success' : 'text-body'
                        }
                      >
                        {item.amount < 0 ? '−' : ''}
                        {formatCents(Math.abs(item.amount), preview.currency)}
                      </small>
                    </div>
                  ))}
                  <hr />
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>Due now</strong>
                    <strong>
                      {formatCents(
                        Math.max(0, preview.immediateAmount),
                        preview.currency,
                      )}
                    </strong>
                  </div>
                  {preview.immediateAmount < 0 && (
                    <small className="text-success">
                      {formatCents(
                        Math.abs(preview.immediateAmount),
                        preview.currency,
                      )}{' '}
                      credit applied to your account
                    </small>
                  )}
                  <div className="d-flex justify-content-between mt-2">
                    <small className="text-muted">
                      Then {formatCents(preview.recurringAmount, preview.currency)}/
                      {preview.interval}
                    </small>
                  </div>
                </>
              )}

              {!hasStripeCustomer && (
                <p className="text-muted mb-0">
                  You'll be redirected to Stripe to complete the payment.
                </p>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!hasStripeCustomer && confirmModalStep === 1 ? (
            /* Step 1 footer */
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmModalStep(1);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => setConfirmModalStep(2)}
              >
                Continue
                <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
              </Button>
            </>
          ) : (
            /* Step 2 footer (or single step for existing customers) */
            <>
              {!hasStripeCustomer && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setConfirmModalStep(1)}
                >
                  Back
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmModalStep(1);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmChanges}
                disabled={creatingCheckout || (hasStripeCustomer && loadingPreview)}
              >
                {creatingCheckout ? (
                  <Spinner animation="border" size="sm" className="me-1" />
                ) : null}
                {hasStripeCustomer ? 'Confirm & Pay' : 'Continue to Payment'}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </BillingContainer>
  );
}
