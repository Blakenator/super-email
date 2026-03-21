import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
} from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faEnvelope,
  faArrowRight,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import {
  PageWrapper,
  SetupWizardCard,
  Logo,
  Tagline,
} from '../auth/auth.wrappers';
import {
  GET_BILLING_INFO_QUERY,
  CREATE_CHECKOUT_SESSION_MUTATION,
} from '../settings/queries';
import { COMPLETE_SETUP_WIZARD_MUTATION } from './setupQueries';
import {
  StorageTier,
  AccountTier,
  DomainTier,
  CheckoutContext,
} from '../../__generated__/graphql';
import {
  buildStorageTiers,
  buildAccountTiers,
  buildDomainTiers,
  formatPrice,
} from '../settings/components/billingTierBuilders';
import {
  TierSelectionGrid,
  TierCard,
  TierCardHeader,
  TierCardPrice,
  TierCardFeatures,
  TierCardFeature,
  CurrentBadge,
} from '../settings/components/BillingSettings.wrappers';
import {
  EmailAccountsTab,
  EmailAccountForm,
  SmtpProfileForm,
} from '../settings/components';
import {
  useEmailAccounts,
  useSendProfiles,
  useCustomDomains,
} from '../settings/hooks';
import { useAuth } from '../../contexts/AuthContext';

const STEPS = ['Account', 'Plan', 'Accounts'] as const;

export function SetupWizard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, refetchProfile } = useAuth();

  const initialStep = searchParams.get('step') === 'accounts' ? 'accounts' : 'plan';
  const [step, setStep] = useState<'plan' | 'accounts'>(initialStep);

  const checkoutSessionId = useMemo(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      return searchParams.get('session_id') ?? undefined;
    }
    return undefined;
  }, [searchParams]);

  const { data, loading, error, refetch } = useQuery(GET_BILLING_INFO_QUERY, {
    variables: { sessionId: checkoutSessionId },
  });

  const [pendingStorageTier, setPendingStorageTier] =
    useState<StorageTier | null>(null);
  const [pendingAccountTier, setPendingAccountTier] =
    useState<AccountTier | null>(null);
  const [pendingDomainTier, setPendingDomainTier] =
    useState<DomainTier | null>(null);
  const [planCheckoutDone, setPlanCheckoutDone] = useState(false);

  const [createCheckoutSession, { loading: creatingCheckout }] = useMutation(
    CREATE_CHECKOUT_SESSION_MUTATION,
  );
  const [completeSetup, { loading: completing }] = useMutation(
    COMPLETE_SETUP_WIZARD_MUTATION,
  );

  const billing = data?.getBillingInfo;
  const subscription = billing?.subscription;

  useEffect(() => {
    if (subscription) {
      setPendingStorageTier((p) => p ?? (subscription.storageTier as StorageTier));
      setPendingAccountTier((p) => p ?? (subscription.accountTier as AccountTier));
      setPendingDomainTier((p) => p ?? (subscription.domainTier as DomainTier));
    }
  }, [subscription]);

  const customDomains = useCustomDomains();
  const emailAccounts = useEmailAccounts();
  const sendProfiles = useSendProfiles(customDomains.domains);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success' && checkoutSessionId) {
      setPlanCheckoutDone(true);
      void refetch();
    }
    if (checkout === 'canceled') {
      toast('Checkout was canceled', { icon: '⚠️' });
    }
    if (checkout === 'success' || checkout === 'canceled') {
      const next = new URLSearchParams(searchParams);
      next.delete('checkout');
      next.delete('session_id');
      setSearchParams(next, { replace: true });
    }
  }, [checkoutSessionId, refetch, searchParams, setSearchParams]);

  useEffect(() => {
    const oauthStatus = searchParams.get('oauth');
    if (!oauthStatus) return;

    if (oauthStatus === 'success') {
      const isReauth = searchParams.get('reauth') === 'true';
      toast.success(
        isReauth
          ? 'Account re-authenticated successfully.'
          : 'Email account connected successfully.',
      );
      void emailAccounts.refetch();
    } else if (oauthStatus === 'error') {
      const reason = searchParams.get('reason') || 'unknown';
      toast.error(`Connection failed: ${reason}`);
    }

    const next = new URLSearchParams(searchParams);
    next.delete('oauth');
    next.delete('reason');
    next.delete('reauth');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, emailAccounts.refetch]);

  const handleReauth = useCallback(
    (accountId: string) => {
      if (!token) return;
      const account = emailAccounts.accounts.find((a) => a.id === accountId);
      if (!account) return;
      const providerMap: Record<string, string> = {
        OAUTH_GOOGLE: 'google',
        OAUTH_YAHOO: 'yahoo',
        OAUTH_OUTLOOK: 'outlook',
      };
      const oauthProvider = providerMap[account.authMethod];
      if (!oauthProvider) return;
      const oauthUrl = `${window.location.origin}/api/oauth/${oauthProvider}/start?token=${encodeURIComponent(token)}&accountId=${encodeURIComponent(accountId)}&returnPath=${encodeURIComponent('/setup')}`;
      window.location.href = oauthUrl;
    },
    [token, emailAccounts.accounts],
  );

  useEffect(() => {
    if (emailAccounts.pendingSmtpData) {
      sendProfiles.openCreate();
    }
  }, [emailAccounts.pendingSmtpData, sendProfiles]);

  const storageTier =
    pendingStorageTier ?? (subscription?.storageTier as StorageTier) ?? StorageTier.Free;
  const accountTier =
    pendingAccountTier ?? (subscription?.accountTier as AccountTier) ?? AccountTier.Free;
  const domainTier =
    pendingDomainTier ?? (subscription?.domainTier as DomainTier) ?? DomainTier.Free;

  const storageTiers = buildStorageTiers(billing?.prices ?? []);
  const accountTiers = buildAccountTiers(billing?.prices ?? []);
  const domainTiers = buildDomainTiers(billing?.prices ?? []);
  const platformPrice = billing?.prices?.find((p) => p.type === 'platform');

  const handlePlanCheckout = async () => {
    try {
      const result = await createCheckoutSession({
        variables: {
          storageTier,
          accountTier,
          domainTier,
          checkoutContext: CheckoutContext.Setup,
        },
      });
      const url = result.data?.createCheckoutSession;
      if (url) {
        window.location.href = url;
      } else {
        setPlanCheckoutDone(true);
        await refetch();
        toast.success('Subscription updated');
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to start checkout',
      );
    }
  };

  const finishSetup = async () => {
    try {
      await completeSetup();
      await refetchProfile();
      void navigate('/inbox', { replace: true });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to complete setup',
      );
    }
  };

  const pushAccountsStepInUrl = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set('step', 'accounts');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const pushPlanStepInUrl = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('step');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const advanceToAccountsStep = useCallback(() => {
    setStep('accounts');
    pushAccountsStepInUrl();
  }, [pushAccountsStepInUrl]);

  const goToPreviousWizardStep = useCallback(() => {
    if (step !== 'accounts') return;
    setStep('plan');
    pushPlanStepInUrl();
  }, [step, pushPlanStepInUrl]);

  const getStepDisplayState = (
    i: number,
  ): 'complete' | 'current' | 'upcoming' => {
    if (i === 0) return 'complete';
    if (i === 1) {
      if (planCheckoutDone || step === 'accounts') return 'complete';
      return step === 'plan' ? 'current' : 'upcoming';
    }
    if (step === 'accounts') return 'current';
    if (step === 'plan' && planCheckoutDone) return 'current';
    return 'upcoming';
  };

  if (!billing?.isStripeConfigured && step === 'plan') {
    return (
      <PageWrapper>
        <Container fluid className="px-3 px-sm-4">
          <SetupWizardCard className="card mx-auto">
            <Card.Body className="p-4 p-md-5">
              <Logo>
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                SuperMail
              </Logo>
              <Tagline>Set up your account</Tagline>
              <Alert variant="warning" className="mt-3">
                Billing is not configured on this server. You cannot complete
                the plan step locally without Stripe. Set{' '}
                <code>STRIPE_SECRET_KEY</code> and{' '}
                <code>STRIPE_PRICE_PLATFORM_BASE</code>.
              </Alert>
              <Button variant="primary" onClick={advanceToAccountsStep}>
                Skip to email accounts
              </Button>
            </Card.Body>
          </SetupWizardCard>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container fluid className="px-3 px-sm-4">
        <SetupWizardCard className="card mx-auto">
          <Card.Body className="p-4 p-md-5">
            <Logo>
              <FontAwesomeIcon icon={faEnvelope} className="me-2" />
              SuperMail
            </Logo>
            <Tagline>Set up your account</Tagline>

            {step === 'accounts' && (
              <div className="mb-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="d-inline-flex align-items-center gap-2"
                  onClick={goToPreviousWizardStep}
                  disabled={
                    completing ||
                    emailAccounts.showModal ||
                    emailAccounts.showDeleteModal ||
                    sendProfiles.showModal
                  }
                  aria-label="Go back to plan step"
                >
                  <FontAwesomeIcon icon={faArrowLeft} aria-hidden />
                  Back to plan
                </Button>
              </div>
            )}

            <div className="d-flex flex-wrap justify-content-center align-items-center gap-2 mb-4 mt-3">
              {STEPS.map((label, i) => {
                const displayState = getStepDisplayState(i);
                return (
                  <div
                    key={label}
                    className="d-flex align-items-center gap-2 small"
                  >
                    {displayState === 'complete' ? (
                      <span className="d-inline-flex align-items-center gap-2 fw-semibold text-success">
                        <FontAwesomeIcon icon={faCheck} aria-hidden />
                        <span>{label}</span>
                      </span>
                    ) : displayState === 'current' ? (
                      <span
                        className="fw-bold text-primary"
                        aria-current="step"
                      >
                        {i + 1}. {label}
                      </span>
                    ) : (
                      <span className="text-muted">
                        {i + 1}. {label}
                      </span>
                    )}
                    {i < STEPS.length - 1 && (
                      <span className="text-muted mx-1" aria-hidden>
                        →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <Alert variant="danger">
                {error.message}
              </Alert>
            )}

            {step === 'plan' && (
              <>
                <h5 className="mb-3">Choose your plan</h5>
                <p className="text-muted small">
                  Every subscription includes a platform fee. Add-on tiers are
                  optional.
                </p>

                {loading && !billing ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                  </div>
                ) : (
                  <>
                    {platformPrice && (
                      <Card className="mb-3 border-primary">
                        <Card.Body className="py-3">
                          <div className="fw-semibold">{platformPrice.name}</div>
                          <div className="text-muted small">
                            Included with your SuperMail subscription
                          </div>
                          <div className="fs-5 mt-1">
                            {formatPrice(
                              platformPrice.unitAmount,
                              platformPrice.currency,
                              platformPrice.interval,
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    )}

                    <h6 className="mt-3 mb-2">Storage</h6>
                    <TierSelectionGrid>
                      {storageTiers.map((tier) => (
                        <TierCard
                          key={tier.id}
                          $selected={storageTier === tier.id}
                          $disabled={!tier.isConfigured}
                          onClick={() =>
                            tier.isConfigured &&
                            setPendingStorageTier(tier.id as StorageTier)
                          }
                        >
                          <TierCardHeader>{tier.name}</TierCardHeader>
                          <TierCardPrice>{tier.price}</TierCardPrice>
                          <TierCardFeatures>
                            <TierCardFeature>{tier.limit}</TierCardFeature>
                          </TierCardFeatures>
                          {storageTier === tier.id && <CurrentBadge>Current</CurrentBadge>}
                        </TierCard>
                      ))}
                    </TierSelectionGrid>

                    <h6 className="mt-3 mb-2">Email accounts</h6>
                    <TierSelectionGrid>
                      {accountTiers.map((tier) => (
                        <TierCard
                          key={tier.id}
                          $selected={accountTier === tier.id}
                          $disabled={!tier.isConfigured}
                          onClick={() =>
                            tier.isConfigured &&
                            setPendingAccountTier(tier.id as AccountTier)
                          }
                        >
                          <TierCardHeader>{tier.name}</TierCardHeader>
                          <TierCardPrice>{tier.price}</TierCardPrice>
                          <TierCardFeatures>
                            <TierCardFeature>{tier.limit}</TierCardFeature>
                          </TierCardFeatures>
                          {accountTier === tier.id && <CurrentBadge>Current</CurrentBadge>}
                        </TierCard>
                      ))}
                    </TierSelectionGrid>

                    <h6 className="mt-3 mb-2">Custom domains</h6>
                    <TierSelectionGrid>
                      {domainTiers.map((tier) => (
                        <TierCard
                          key={tier.id}
                          $selected={domainTier === tier.id}
                          $disabled={!tier.isConfigured}
                          onClick={() =>
                            tier.isConfigured &&
                            setPendingDomainTier(tier.id as DomainTier)
                          }
                        >
                          <TierCardHeader>{tier.name}</TierCardHeader>
                          <TierCardPrice>{tier.price}</TierCardPrice>
                          <TierCardFeatures>
                            <TierCardFeature>{tier.limit}</TierCardFeature>
                          </TierCardFeatures>
                          {domainTier === tier.id && <CurrentBadge>Current</CurrentBadge>}
                        </TierCard>
                      ))}
                    </TierSelectionGrid>

                    {planCheckoutDone && (
                      <Alert variant="success" className="mt-3 d-flex align-items-center gap-2">
                        <FontAwesomeIcon icon={faCheck} />
                        <div>
                          <strong>You're subscribed.</strong> Continue to connect
                          your email.
                        </div>
                      </Alert>
                    )}

                    <div className="d-flex flex-wrap gap-2 mt-4">
                      {!planCheckoutDone ? (
                        <Button
                          variant="primary"
                          size="lg"
                          disabled={creatingCheckout}
                          onClick={() => void handlePlanCheckout()}
                          style={{
                            background:
                              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                          }}
                        >
                          {creatingCheckout ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Redirecting…
                            </>
                          ) : (
                            <>
                              Continue to secure checkout{' '}
                              <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={advanceToAccountsStep}
                          style={{
                            background:
                              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                          }}
                        >
                          Continue to accounts{' '}
                          <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {step === 'accounts' && (
              <>
                <h5 className="mb-3">Connect your email</h5>
                <p className="text-muted small mb-3">
                  Add at least one account to get started, or skip and configure
                  this later in Settings.
                </p>
                <EmailAccountsTab
                  accounts={emailAccounts.accounts}
                  loading={emailAccounts.loading}
                  syncingAll={emailAccounts.syncingAll}
                  showDeleteModal={emailAccounts.showDeleteModal}
                  deletingAccount={emailAccounts.deletingAccount}
                  deleting={emailAccounts.deleting}
                  onAddAccount={emailAccounts.openCreate}
                  onEditAccount={emailAccounts.openEdit}
                  onSyncAccount={emailAccounts.handleSync}
                  onDeleteAccount={emailAccounts.openDelete}
                  onSyncAll={emailAccounts.handleSyncAll}
                  onConfirmDelete={emailAccounts.confirmDelete}
                  onCancelDelete={emailAccounts.closeDeleteModal}
                  onReauth={handleReauth}
                />
                <Row className="mt-4 g-2">
                  <Col xs={12} md="auto">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100"
                      disabled={completing}
                      onClick={() => void finishSetup()}
                      style={{
                        background:
                          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                      }}
                    >
                      {completing ? (
                        <Spinner size="sm" />
                      ) : (
                        'Continue to inbox'
                      )}
                    </Button>
                  </Col>
                  <Col xs={12} md="auto">
                    <Button
                      variant="outline-secondary"
                      size="lg"
                      className="w-100"
                      disabled={completing}
                      onClick={() => void finishSetup()}
                    >
                      Skip for now
                    </Button>
                  </Col>
                </Row>
              </>
            )}
          </Card.Body>
        </SetupWizardCard>

        <EmailAccountForm
          show={emailAccounts.showModal}
          onHide={emailAccounts.closeModal}
          onSubmit={emailAccounts.handleSubmit}
          onTest={emailAccounts.handleTest}
          editingAccount={emailAccounts.editingAccount}
          smtpProfiles={sendProfiles.profiles}
          isSubmitting={emailAccounts.creating}
          isTesting={emailAccounts.testing}
          testResult={emailAccounts.testResult}
          customDomains={customDomains.domains}
          onCreateCustomDomainAccount={(data) =>
            void customDomains.handleCreateAccount(data, () => {
              emailAccounts.closeModal();
              void emailAccounts.refetch();
              void sendProfiles.refetch();
            })
          }
          isCreatingCustomDomainAccount={customDomains.creatingAccount}
          oauthReturnPath="/setup"
        />

        <SmtpProfileForm
          show={sendProfiles.showModal}
          onHide={() => {
            sendProfiles.closeModal();
            emailAccounts.setPendingSmtpData(null);
          }}
          onSubmit={(formData) => {
            sendProfiles.handleSubmit(formData);
            emailAccounts.setPendingSmtpData(null);
          }}
          onTest={sendProfiles.handleTest}
          editingProfile={sendProfiles.editingProfile}
          initialData={emailAccounts.pendingSmtpData}
          isSubmitting={sendProfiles.creating}
          isTesting={sendProfiles.testing}
          testResult={sendProfiles.testResult}
          customDomains={customDomains.domains}
          onCreateCustomDomainSendProfile={
            sendProfiles.handleCreateCustomDomainProfile
          }
          isCreatingCustomDomainSendProfile={sendProfiles.creatingCustomDomain}
        />
      </Container>
    </PageWrapper>
  );
}
