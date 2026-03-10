import Stripe from 'stripe';
import { config } from '../config/env.js';
import { logger } from './logger.js';
import {
  Subscription,
  SubscriptionStatus,
  StorageTier,
  AccountTier,
} from '../db/models/subscription.model.js';
import { DomainTier } from '../db/models/subscription.constants.js';
import type { User } from '../db/models/user.model.js';

// Initialize Stripe client (only if secret key is configured)
let stripe: Stripe | null = null;

/**
 * Check if a Stripe secret key is valid (not empty or placeholder)
 */
function isValidStripeKey(key: string | undefined): boolean {
  if (!key) return false;
  // Check for placeholder values used in infrastructure when not configured
  if (key === 'not-configured' || key === '') return false;
  // Valid Stripe keys start with sk_test_ or sk_live_
  return key.startsWith('sk_test_') || key.startsWith('sk_live_');
}

/**
 * Get the Stripe client instance
 * Throws if Stripe is not configured
 */
export function getStripeClient(): Stripe {
  if (!stripe) {
    if (!isValidStripeKey(config.stripe.secretKey)) {
      throw new Error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable with a valid Stripe secret key (sk_test_... or sk_live_...).',
      );
    }
    stripe = new Stripe(config.stripe.secretKey);
  }
  return stripe;
}

/**
 * Check if Stripe is configured with a valid API key
 */
export function isStripeConfigured(): boolean {
  return isValidStripeKey(config.stripe.secretKey);
}

/**
 * Create or get a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(user: User): Promise<string> {
  const stripeClient = getStripeClient();

  // Check if user already has a subscription with a Stripe customer ID
  const existingSubscription = await Subscription.findOne({
    where: { userId: user.id },
  });

  if (existingSubscription?.stripeCustomerId) {
    return existingSubscription.stripeCustomerId;
  }

  // Create a new Stripe customer
  const customer = await stripeClient.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim() || user.email,
    metadata: {
      userId: user.id,
    },
  });

  // Create or update the subscription record with the customer ID
  if (existingSubscription) {
    await existingSubscription.update({ stripeCustomerId: customer.id });
  } else {
    await Subscription.create({
      userId: user.id,
      stripeCustomerId: customer.id,
      status: SubscriptionStatus.ACTIVE,
      storageTier: StorageTier.FREE,
      accountTier: AccountTier.FREE,
    });
  }

  logger.info('Stripe', `Created customer ${customer.id} for user ${user.id}`);
  return customer.id;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  user: User,
  storageTier: StorageTier,
  accountTier: AccountTier,
  successUrl: string,
  cancelUrl: string,
  domainTier: DomainTier = DomainTier.FREE,
): Promise<string> {
  const stripeClient = getStripeClient();
  const customerId = await getOrCreateStripeCustomer(user);
  const desired = collectPriceItems(storageTier, accountTier, domainTier);

  if (desired.length === 0) {
    throw new Error(
      'Cannot create checkout session for free tier. ' +
        'Please select at least one paid plan to upgrade.',
    );
  }

  const lineItems = desired.map((d) => ({ price: d.priceId, quantity: 1 }));

  const session = await stripeClient.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: user.id,
      storageTier,
      accountTier,
      domainTier,
    },
  });

  logger.info(
    'Stripe',
    `Created checkout session ${session.id} for user ${user.id}: ` +
      `${lineItems.length} line item(s), ` +
      `storage=${storageTier}, accounts=${accountTier}, domains=${domainTier}`,
  );
  return session.url!;
}

/**
 * Collect the Stripe price IDs for the requested tiers.
 * Throws if any paid tier is missing its env-var configuration.
 */
function collectPriceItems(
  storageTier: StorageTier,
  accountTier: AccountTier,
  domainTier: DomainTier,
): { priceId: string; tier: string }[] {
  const items: { priceId: string; tier: string }[] = [];
  const missing: string[] = [];

  if (storageTier !== StorageTier.FREE) {
    const priceId = getPriceIdForStorageTier(storageTier);
    if (priceId) items.push({ priceId, tier: `storage ${storageTier}` });
    else missing.push(`storage ${storageTier}`);
  }
  if (accountTier !== AccountTier.FREE) {
    const priceId = getPriceIdForAccountTier(accountTier);
    if (priceId) items.push({ priceId, tier: `account ${accountTier}` });
    else missing.push(`account ${accountTier}`);
  }
  if (domainTier !== DomainTier.FREE) {
    const priceId = getPriceIdForDomainTier(domainTier);
    if (priceId) items.push({ priceId, tier: `domain ${domainTier}` });
    else missing.push(`domain ${domainTier}`);
  }

  if (missing.length > 0) {
    logger.error(
      'Stripe',
      `Missing Stripe price IDs for: ${missing.join(', ')}. ` +
        'Check that STRIPE_PRICE_* environment variables are configured.',
    );
    throw new Error(
      `The selected plan(s) are not available: ${missing.join(', ')}. ` +
        'Please contact support or try a different plan.',
    );
  }

  return items;
}

/**
 * Update an existing Stripe subscription's line items in-place.
 * Replaces all current items with the desired tier items.
 * Stripe automatically prorates the changes.
 */
export async function updateExistingSubscription(
  stripeSubscriptionId: string,
  storageTier: StorageTier,
  accountTier: AccountTier,
  domainTier: DomainTier,
): Promise<void> {
  const stripeClient = getStripeClient();
  const desired = collectPriceItems(storageTier, accountTier, domainTier);

  if (desired.length === 0) {
    throw new Error(
      'Cannot update subscription to all-free tiers. ' +
        'Use the Manage Billing portal to cancel your subscription.',
    );
  }

  const stripeSub = await stripeClient.subscriptions.retrieve(
    stripeSubscriptionId,
    { expand: ['items'] },
  );

  const currentItems = stripeSub.items?.data ?? [];
  const currentPriceIds = new Set(currentItems.map((i) => i.price.id));
  const desiredPriceIds = new Set(desired.map((d) => d.priceId));

  const updateItems: Stripe.SubscriptionUpdateParams.Item[] = [];

  // Keep existing items whose price is still desired, delete the rest
  for (const item of currentItems) {
    if (desiredPriceIds.has(item.price.id)) {
      desiredPriceIds.delete(item.price.id);
    } else {
      updateItems.push({ id: item.id, deleted: true });
    }
  }

  // Add new items that don't already exist on the subscription
  for (const priceId of desiredPriceIds) {
    updateItems.push({ price: priceId, quantity: 1 });
  }

  if (updateItems.length === 0) {
    logger.info('Stripe', `Subscription ${stripeSubscriptionId} already matches desired tiers`);
    return;
  }

  await stripeClient.subscriptions.update(stripeSubscriptionId, {
    items: updateItems,
    proration_behavior: 'create_prorations',
  });

  logger.info(
    'Stripe',
    `Updated subscription ${stripeSubscriptionId} in-place: ` +
      `storage=${storageTier}, accounts=${accountTier}, domains=${domainTier} ` +
      `(${updateItems.length} item change(s))`,
  );
}

export interface SubscriptionPreview {
  /** Amount due immediately (in cents), can be negative for downgrades */
  immediateAmount: number;
  /** New recurring total per period (in cents) */
  recurringAmount: number;
  /** Currency code, e.g. "usd" */
  currency: string;
  /** Billing interval, e.g. "month" */
  interval: string;
  /** Individual line items describing what changed */
  lineItems: {
    description: string;
    amount: number;
  }[];
}

/**
 * Preview the cost of changing a subscription before applying it.
 * Uses Stripe's invoice preview API to calculate prorations.
 */
export async function previewSubscriptionUpdate(
  stripeSubscriptionId: string,
  stripeCustomerId: string,
  storageTier: StorageTier,
  accountTier: AccountTier,
  domainTier: DomainTier,
): Promise<SubscriptionPreview> {
  const stripeClient = getStripeClient();
  const desired = collectPriceItems(storageTier, accountTier, domainTier);

  const stripeSub = await stripeClient.subscriptions.retrieve(
    stripeSubscriptionId,
    { expand: ['items'] },
  );

  const currentItems = stripeSub.items?.data ?? [];
  const desiredPriceIds = new Set(desired.map((d) => d.priceId));

  // Build the items array for the preview in the same way as the update
  const previewItems: Stripe.InvoiceCreatePreviewParams.SubscriptionDetails.Item[] = [];

  for (const item of currentItems) {
    if (desiredPriceIds.has(item.price.id)) {
      // Item stays — keep it as-is
      previewItems.push({ id: item.id, price: item.price.id });
      desiredPriceIds.delete(item.price.id);
    } else {
      // Item removed
      previewItems.push({ id: item.id, deleted: true });
    }
  }

  // New items to add
  for (const priceId of desiredPriceIds) {
    previewItems.push({ price: priceId, quantity: 1 });
  }

  const preview = await stripeClient.invoices.createPreview({
    customer: stripeCustomerId,
    subscription_details: {
      items: previewItems,
    },
    subscription: stripeSubscriptionId,
  });

  const allLines = preview.lines?.data ?? [];

  const lineItems = allLines.map((line) => ({
    description: line.description || 'Subscription change',
    amount: line.amount,
  }));

  // Recurring amount = sum of non-proration line items (the full-period charges)
  const recurringAmount = allLines
    .filter((l) => !l.proration)
    .reduce((sum, l) => sum + l.amount, 0);

  let interval = 'month';
  const recurringLine = allLines.find((l) => l.price?.recurring);
  if (recurringLine?.price?.recurring?.interval) {
    interval = recurringLine.price.recurring.interval;
  }

  return {
    immediateAmount: preview.amount_due ?? 0,
    recurringAmount,
    currency: preview.currency || 'usd',
    interval,
    lineItems,
  };
}

/**
 * Create a Stripe Billing Portal session for managing subscription
 */
export async function createBillingPortalSession(
  user: User,
  returnUrl: string,
): Promise<string> {
  const stripeClient = getStripeClient();
  const customerId = await getOrCreateStripeCustomer(user);

  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  logger.info('Stripe', `Created portal session for user ${user.id}`);
  return session.url;
}

/**
 * Get price ID for a storage tier
 */
function getPriceIdForStorageTier(tier: StorageTier): string | null {
  switch (tier) {
    case StorageTier.BASIC:
      return config.stripe.storagePriceIds.basic || null;
    case StorageTier.PRO:
      return config.stripe.storagePriceIds.pro || null;
    case StorageTier.ENTERPRISE:
      return config.stripe.storagePriceIds.enterprise || null;
    default:
      return null;
  }
}

/**
 * Get price ID for an account tier
 */
function getPriceIdForAccountTier(tier: AccountTier): string | null {
  switch (tier) {
    case AccountTier.BASIC:
      return config.stripe.accountPriceIds.basic || null;
    case AccountTier.PRO:
      return config.stripe.accountPriceIds.pro || null;
    case AccountTier.ENTERPRISE:
      return config.stripe.accountPriceIds.enterprise || null;
    default:
      return null;
  }
}

function getPriceIdForDomainTier(tier: DomainTier): string | null {
  switch (tier) {
    case DomainTier.BASIC:
      return config.stripe.domainPriceIds.basic || null;
    case DomainTier.PRO:
      return config.stripe.domainPriceIds.pro || null;
    case DomainTier.ENTERPRISE:
      return config.stripe.domainPriceIds.enterprise || null;
    default:
      return null;
  }
}

function getDomainTierFromPriceId(priceId: string): DomainTier | null {
  if (priceId === config.stripe.domainPriceIds.basic) {
    return DomainTier.BASIC;
  }
  if (priceId === config.stripe.domainPriceIds.pro) {
    return DomainTier.PRO;
  }
  if (priceId === config.stripe.domainPriceIds.enterprise) {
    return DomainTier.ENTERPRISE;
  }
  return null;
}

/**
 * Map Stripe price ID to storage tier
 */
function getStorageTierFromPriceId(priceId: string): StorageTier | null {
  if (priceId === config.stripe.storagePriceIds.basic) {
    return StorageTier.BASIC;
  }
  if (priceId === config.stripe.storagePriceIds.pro) {
    return StorageTier.PRO;
  }
  if (priceId === config.stripe.storagePriceIds.enterprise) {
    return StorageTier.ENTERPRISE;
  }
  return null;
}

/**
 * Map Stripe price ID to account tier
 */
function getAccountTierFromPriceId(priceId: string): AccountTier | null {
  if (priceId === config.stripe.accountPriceIds.basic) {
    return AccountTier.BASIC;
  }
  if (priceId === config.stripe.accountPriceIds.pro) {
    return AccountTier.PRO;
  }
  if (priceId === config.stripe.accountPriceIds.enterprise) {
    return AccountTier.ENTERPRISE;
  }
  return null;
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  payload: string | Buffer,
  signature: string,
): Promise<void> {
  const stripeClient = getStripeClient();

  let event: Stripe.Event;

  try {
    event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret,
    );
  } catch (err) {
    logger.error('Stripe Webhook', 'Signature verification failed:', err);
    throw new Error('Webhook signature verification failed');
  }

  logger.info('Stripe Webhook', `Received event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;

    default:
      logger.debug('Stripe Webhook', `Unhandled event type: ${event.type}`);
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) {
    logger.warn('Stripe Webhook', 'No userId in checkout session metadata');
    return;
  }

  const subscription = await Subscription.findOne({ where: { userId } });
  if (!subscription) {
    logger.warn('Stripe Webhook', `No subscription found for user ${userId}`);
    return;
  }

  const newSubId = session.subscription as string | null;
  if (!newSubId) {
    return;
  }

  // If replacing an existing Stripe subscription, cancel the old one
  const oldSubId = subscription.stripeSubscriptionId;
  if (oldSubId && oldSubId !== newSubId) {
    logger.info(
      'Stripe Webhook',
      `Checkout created new subscription ${newSubId}, replacing old ${oldSubId} for user ${userId}`,
    );
    try {
      const stripeClient = getStripeClient();
      await stripeClient.subscriptions.cancel(oldSubId);
      logger.info('Stripe Webhook', `Canceled old subscription ${oldSubId}`);
    } catch (err) {
      logger.warn(
        'Stripe Webhook',
        `Failed to cancel old subscription ${oldSubId}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  await subscription.update({
    stripeSubscriptionId: newSubId,
    status: SubscriptionStatus.ACTIVE,
  });
  logger.info(
    'Stripe Webhook',
    `Updated subscription for user ${userId}: ${newSubId}`,
  );
}

/**
 * Handle subscription created/updated events
 */
async function handleSubscriptionUpdated(
  stripeSubscription: Stripe.Subscription,
): Promise<void> {
  const customerId = stripeSubscription.customer as string;

  const subscription = await Subscription.findOne({
    where: { stripeCustomerId: customerId },
  });

  if (!subscription) {
    logger.warn(
      'Stripe Webhook',
      `No subscription found for customer ${customerId}`,
    );
    return;
  }

  // Map Stripe status to our status enum
  const status = mapStripeStatus(stripeSubscription.status);

  let storageTier = StorageTier.FREE;
  let accountTier = AccountTier.FREE;
  let domainTier = DomainTier.FREE;

  for (const item of stripeSubscription.items.data) {
    const priceId = item.price.id;

    const storage = getStorageTierFromPriceId(priceId);
    if (storage) {
      storageTier = storage;
    }

    const account = getAccountTierFromPriceId(priceId);
    if (account) {
      accountTier = account;
    }

    const domain = getDomainTierFromPriceId(priceId);
    if (domain) {
      domainTier = domain;
    }
  }

  const stripeSub = stripeSubscription as any;
  const periodEnd = stripeSub.current_period_end;
  const cancelAtEnd = stripeSub.cancel_at_period_end ?? false;

  const updateData: {
    stripeSubscriptionId: string;
    status: typeof status;
    storageTier: typeof storageTier;
    accountTier: typeof accountTier;
    domainTier: typeof domainTier;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd: boolean;
  } = {
    stripeSubscriptionId: stripeSubscription.id,
    status,
    storageTier,
    accountTier,
    domainTier,
    cancelAtPeriodEnd: cancelAtEnd,
  };

  if (periodEnd && typeof periodEnd === 'number') {
    updateData.currentPeriodEnd = new Date(periodEnd * 1000);
  }

  await subscription.update(updateData);

  logger.info(
    'Stripe Webhook',
    `Updated subscription for user ${subscription.userId}: ` +
      `storage=${storageTier}, accounts=${accountTier}, domains=${domainTier}, status=${status}`,
  );
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(
  stripeSubscription: Stripe.Subscription,
): Promise<void> {
  const customerId = stripeSubscription.customer as string;

  const subscription = await Subscription.findOne({
    where: { stripeCustomerId: customerId },
  });

  if (!subscription) {
    logger.warn(
      'Stripe Webhook',
      `No subscription found for customer ${customerId}`,
    );
    return;
  }

  // Reset to free tier
  await subscription.update({
    stripeSubscriptionId: null,
    status: SubscriptionStatus.CANCELED,
    storageTier: StorageTier.FREE,
    accountTier: AccountTier.FREE,
    domainTier: DomainTier.FREE,
    cancelAtPeriodEnd: false,
  });

  logger.info(
    'Stripe Webhook',
    `Subscription canceled for user ${subscription.userId}`,
  );
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  const subscription = await Subscription.findOne({
    where: { stripeCustomerId: customerId },
  });

  if (!subscription) {
    logger.warn(
      'Stripe Webhook',
      `No subscription found for customer ${customerId}`,
    );
    return;
  }

  await subscription.update({
    status: SubscriptionStatus.PAST_DUE,
  });

  logger.warn(
    'Stripe Webhook',
    `Payment failed for user ${subscription.userId}`,
  );
}

/**
 * Map Stripe subscription status to our enum
 */
function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'unpaid':
      return SubscriptionStatus.UNPAID;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'incomplete':
      return SubscriptionStatus.INCOMPLETE;
    case 'incomplete_expired':
      return SubscriptionStatus.INCOMPLETE_EXPIRED;
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    case 'paused':
      return SubscriptionStatus.PAUSED;
    default:
      return SubscriptionStatus.ACTIVE;
  }
}

/**
 * Get or create a subscription record for a user (ensures one exists)
 */
export async function getOrCreateSubscription(
  userId: string,
): Promise<Subscription> {
  let subscription = await Subscription.findOne({ where: { userId } });

  if (!subscription) {
    subscription = await Subscription.create({
      userId,
      status: SubscriptionStatus.ACTIVE,
      storageTier: StorageTier.FREE,
      accountTier: AccountTier.FREE,
    });
  }

  return subscription;
}

/**
 * Resolve a checkout session ID into a subscription update.
 * Used when the user is redirected back from Stripe checkout before the webhook arrives.
 * Fetches the checkout session, extracts the subscription ID, and updates the local record.
 */
export async function resolveCheckoutSession(
  subscription: Subscription,
  sessionId: string,
): Promise<Subscription> {
  if (!isStripeConfigured()) {
    return subscription;
  }

  try {
    const stripeClient = getStripeClient();
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    const newSubId = session.subscription as string | null;
    if (!newSubId) {
      return subscription;
    }

    // If the checkout created a different subscription than what we have,
    // cancel the old one on Stripe to avoid double-charging.
    const oldSubId = subscription.stripeSubscriptionId;
    if (oldSubId && oldSubId !== newSubId) {
      logger.info(
        'Stripe',
        `Checkout created new subscription ${newSubId}, replacing old ${oldSubId} for user ${subscription.userId}`,
      );
      try {
        await stripeClient.subscriptions.cancel(oldSubId);
        logger.info('Stripe', `Canceled old subscription ${oldSubId}`);
      } catch (err) {
        logger.warn(
          'Stripe',
          `Failed to cancel old subscription ${oldSubId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    if (oldSubId !== newSubId) {
      await subscription.update({
        stripeSubscriptionId: newSubId,
        status: SubscriptionStatus.ACTIVE,
      });
      await subscription.reload();

      logger.info(
        'Stripe',
        `Resolved checkout session ${sessionId} -> subscription ${newSubId} for user ${subscription.userId}`,
      );
    }
  } catch (error) {
    logger.warn(
      'Stripe',
      `Failed to resolve checkout session ${sessionId}: ${error instanceof Error ? error.message : error}`,
    );
  }

  return subscription;
}

/**
 * Sync subscription status from Stripe and update local database
 * Called when loading billing page to ensure local data is in sync
 */
export async function syncSubscriptionFromStripe(
  subscription: Subscription,
): Promise<Subscription> {
  // If no Stripe subscription ID, nothing to sync
  if (!subscription.stripeSubscriptionId) {
    return subscription;
  }

  // If Stripe is not configured, can't sync
  if (!isStripeConfigured()) {
    return subscription;
  }

  try {
    const stripeClient = getStripeClient();
    const stripeSubscription = await stripeClient.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
      { expand: ['items', 'items.data.price'] },
    );

    logger.info(
      'Stripe',
      `Retrieved subscription ${subscription.stripeSubscriptionId}: ` +
        `status=${stripeSubscription.status}, ` +
        `items=${stripeSubscription.items?.data?.length ?? 0}`,
    );

    // Map Stripe status to our status enum
    const status = mapStripeStatus(stripeSubscription.status);

    let storageTier = StorageTier.FREE;
    let accountTier = AccountTier.FREE;
    let domainTier = DomainTier.FREE;

    const items = stripeSubscription.items?.data ?? [];
    for (const item of items) {
      const priceId = item.price.id;

      logger.debug('Stripe', `Subscription item price: ${priceId}`);

      const storage = getStorageTierFromPriceId(priceId);
      if (storage) {
        storageTier = storage;
      }

      const account = getAccountTierFromPriceId(priceId);
      if (account) {
        accountTier = account;
      }

      const domain = getDomainTierFromPriceId(priceId);
      if (domain) {
        domainTier = domain;
      }
    }

    if (items.length > 0 && storageTier === StorageTier.FREE && accountTier === AccountTier.FREE && domainTier === DomainTier.FREE) {
      logger.warn(
        'Stripe',
        `No tier mappings found for subscription ${subscription.stripeSubscriptionId}. ` +
          `Price IDs from Stripe: [${items.map((i) => i.price.id).join(', ')}]. ` +
          `Configured storage price IDs: basic=${config.stripe.storagePriceIds.basic || '(empty)'}, ` +
          `pro=${config.stripe.storagePriceIds.pro || '(empty)'}, ` +
          `enterprise=${config.stripe.storagePriceIds.enterprise || '(empty)'}. ` +
          `Configured account price IDs: basic=${config.stripe.accountPriceIds.basic || '(empty)'}, ` +
          `pro=${config.stripe.accountPriceIds.pro || '(empty)'}, ` +
          `enterprise=${config.stripe.accountPriceIds.enterprise || '(empty)'}. ` +
          `Configured domain price IDs: basic=${config.stripe.domainPriceIds.basic || '(empty)'}, ` +
          `pro=${config.stripe.domainPriceIds.pro || '(empty)'}, ` +
          `enterprise=${config.stripe.domainPriceIds.enterprise || '(empty)'}`,
      );
    }

    // Safely extract period end and cancel status
    // Stripe SDK v20 uses snake_case for API properties
    const stripeSub = stripeSubscription as any;
    
    // Try to get current_period_end, fall back to calculating from billing_cycle_anchor
    let periodEnd = stripeSub.current_period_end;
    if (!periodEnd && stripeSub.billing_cycle_anchor) {
      // If no current_period_end, calculate next period from billing_cycle_anchor
      // Assume monthly billing - add 30 days
      const anchorDate = new Date(stripeSub.billing_cycle_anchor * 1000);
      const nextPeriod = new Date(anchorDate);
      nextPeriod.setMonth(nextPeriod.getMonth() + 1);
      periodEnd = Math.floor(nextPeriod.getTime() / 1000);
    }
    
    const cancelAtEnd = stripeSub.cancel_at_period_end ?? false;

    const updateData: {
      status: typeof status;
      storageTier: typeof storageTier;
      accountTier: typeof accountTier;
      domainTier: typeof domainTier;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd: boolean;
    } = {
      status,
      storageTier,
      accountTier,
      domainTier,
      cancelAtPeriodEnd: cancelAtEnd,
    };

    // Only set currentPeriodEnd if we have a valid timestamp
    if (periodEnd && typeof periodEnd === 'number') {
      updateData.currentPeriodEnd = new Date(periodEnd * 1000);
    }

    // Update local subscription
    await subscription.update(updateData);

    await subscription.reload();
    logger.info(
      'Stripe',
      `Synced subscription for user ${subscription.userId}: ` +
        `status=${status}, storage=${storageTier}, accounts=${accountTier}, domains=${domainTier}`,
    );
    return subscription;
  } catch (error: any) {
    logger.error(
      'Stripe',
      `Error syncing subscription ${subscription.stripeSubscriptionId}: ${error.message}`,
      error.stack,
    );
    // Return existing subscription on error
    return subscription;
  }
}

/**
 * Price info from Stripe
 */
export interface StripePriceInfo {
  id: string;
  tier: string;
  type: 'storage' | 'account' | 'domain';
  name: string;
  unitAmount: number; // in cents
  currency: string;
  interval: string;
}

/**
 * Fetch all product prices from Stripe for display in billing UI
 */
export async function getStripePrices(): Promise<StripePriceInfo[]> {
  if (!isStripeConfigured()) {
    return [];
  }

  try {
    const stripeClient = getStripeClient();
    const prices: StripePriceInfo[] = [];

    // Get all configured price IDs
    const storagePriceIds = [
      { tier: 'BASIC', id: config.stripe.storagePriceIds.basic },
      { tier: 'PRO', id: config.stripe.storagePriceIds.pro },
      { tier: 'ENTERPRISE', id: config.stripe.storagePriceIds.enterprise },
    ].filter((p) => p.id);

    const accountPriceIds = [
      { tier: 'BASIC', id: config.stripe.accountPriceIds.basic },
      { tier: 'PRO', id: config.stripe.accountPriceIds.pro },
      { tier: 'ENTERPRISE', id: config.stripe.accountPriceIds.enterprise },
    ].filter((p) => p.id);

    // Fetch storage prices
    for (const { tier, id } of storagePriceIds) {
      if (!id) {
        continue;
      }
      try {
        const price = await stripeClient.prices.retrieve(id, {
          expand: ['product'],
        });
        const product = price.product as Stripe.Product;
        prices.push({
          id: price.id,
          tier,
          type: 'storage',
          name: product.name || `Storage ${tier}`,
          unitAmount: price.unit_amount || 0,
          currency: price.currency,
          interval: price.recurring?.interval || 'month',
        });
      } catch (e: any) {
        logger.warn('Stripe', `Failed to fetch price ${id}: ${e.message}`);
      }
    }

    // Fetch account prices
    for (const { tier, id } of accountPriceIds) {
      if (!id) {
        continue;
      }
      try {
        const price = await stripeClient.prices.retrieve(id, {
          expand: ['product'],
        });
        const product = price.product as Stripe.Product;
        prices.push({
          id: price.id,
          tier,
          type: 'account',
          name: product.name || `Accounts ${tier}`,
          unitAmount: price.unit_amount || 0,
          currency: price.currency,
          interval: price.recurring?.interval || 'month',
        });
      } catch (e: any) {
        logger.warn('Stripe', `Failed to fetch price ${id}: ${e.message}`);
      }
    }

    // Fetch domain prices
    const domainPriceIds = [
      { tier: 'BASIC', id: config.stripe.domainPriceIds.basic },
      { tier: 'PRO', id: config.stripe.domainPriceIds.pro },
      { tier: 'ENTERPRISE', id: config.stripe.domainPriceIds.enterprise },
    ].filter((p) => p.id);

    for (const { tier, id } of domainPriceIds) {
      if (!id) {
        continue;
      }
      try {
        const price = await stripeClient.prices.retrieve(id, {
          expand: ['product'],
        });
        const product = price.product as Stripe.Product;
        prices.push({
          id: price.id,
          tier,
          type: 'domain',
          name: product.name || `Domains ${tier}`,
          unitAmount: price.unit_amount || 0,
          currency: price.currency,
          interval: price.recurring?.interval || 'month',
        });
      } catch (e: any) {
        logger.warn('Stripe', `Failed to fetch price ${id}: ${e.message}`);
      }
    }

    return prices;
  } catch (error: any) {
    logger.error('Stripe', `Error fetching prices: ${error.message}`);
    return [];
  }
}
