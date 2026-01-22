import Stripe from 'stripe';
import { config } from '../config/env.js';
import { logger } from './logger.js';
import {
  Subscription,
  SubscriptionStatus,
  StorageTier,
  AccountTier,
} from '../db/models/subscription.model.js';
import type { User } from '../db/models/user.model.js';

// Initialize Stripe client (only if secret key is configured)
let stripe: Stripe | null = null;

/**
 * Get the Stripe client instance
 * Throws if Stripe is not configured
 */
export function getStripeClient(): Stripe {
  if (!stripe) {
    if (!config.stripe.secretKey) {
      throw new Error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      );
    }
    stripe = new Stripe(config.stripe.secretKey);
  }
  return stripe;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  console.log(config.stripe);
  return !!config.stripe.secretKey;
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
): Promise<string> {
  const stripeClient = getStripeClient();
  const customerId = await getOrCreateStripeCustomer(user);

  // Build line items based on selected tiers
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  // Add storage tier if not free
  if (storageTier !== StorageTier.FREE) {
    const priceId = getPriceIdForStorageTier(storageTier);
    if (priceId) {
      lineItems.push({ price: priceId, quantity: 1 });
    }
  }

  // Add account tier if not free
  if (accountTier !== AccountTier.FREE) {
    const priceId = getPriceIdForAccountTier(accountTier);
    if (priceId) {
      lineItems.push({ price: priceId, quantity: 1 });
    }
  }

  // If no paid items, this shouldn't create a checkout session
  if (lineItems.length === 0) {
    throw new Error('Cannot create checkout session for free tier');
  }

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
    },
  });

  logger.info(
    'Stripe',
    `Created checkout session ${session.id} for user ${user.id}`,
  );
  return session.url!;
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

  // Update with Stripe subscription ID
  if (session.subscription) {
    await subscription.update({
      stripeSubscriptionId: session.subscription as string,
      status: SubscriptionStatus.ACTIVE,
    });
    logger.info('Stripe Webhook', `Updated subscription for user ${userId}`);
  }
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

  // Extract tiers from subscription items
  let storageTier = StorageTier.FREE;
  let accountTier = AccountTier.FREE;

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
  }

  await subscription.update({
    stripeSubscriptionId: stripeSubscription.id,
    status,
    storageTier,
    accountTier,
    currentPeriodEnd: new Date(
      (stripeSubscription as any).current_period_end * 1000,
    ),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
  });

  logger.info(
    'Stripe Webhook',
    `Updated subscription for user ${subscription.userId}: ` +
      `storage=${storageTier}, accounts=${accountTier}, status=${status}`,
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
