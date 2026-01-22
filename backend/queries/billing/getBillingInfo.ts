import { makeQuery } from '../../types.js';
import {
  getOrCreateSubscription,
  isStripeConfigured,
  syncSubscriptionFromStripe,
  getStripePrices,
} from '../../helpers/stripe.js';
import {
  getOrCreateUserUsage,
  bytesToGB,
} from '../../helpers/usage-calculator.js';
import {
  STORAGE_LIMITS,
  ACCOUNT_LIMITS,
} from '../../db/models/subscription.model.js';
import { requireAuth } from '../../helpers/auth.js';

/**
 * Get the current user's billing information including subscription and usage.
 * Creates a free tier subscription if one doesn't exist.
 * Syncs subscription status from Stripe if the user has an active subscription.
 * Also fetches current prices from Stripe for display in the UI.
 */
export const getBillingInfo = makeQuery(
  'getBillingInfo',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    // Get or create subscription
    let subscription = await getOrCreateSubscription(userId);
    // Sync subscription status from Stripe (if they have a Stripe subscription)
    subscription = await syncSubscriptionFromStripe(subscription);

    // Fetch prices from Stripe
    const prices = await getStripePrices();

    // Get usage from cache table (or calculate if not exists)
    const usage = await getOrCreateUserUsage(userId);

    // Build usage object (default to zeros if not calculated yet)
    const storageUsage = {
      userId: userId,
      accountCount: usage?.accountCount ?? 0,
      totalBodySizeBytes: usage?.totalBodySizeBytes ?? 0,
      totalAttachmentSizeBytes: usage?.totalAttachmentSizeBytes ?? 0,
      totalStorageBytes: usage?.totalStorageBytes ?? 0,
      totalStorageGB: bytesToGB(usage?.totalStorageBytes ?? 0),
      emailCount: usage?.emailCount ?? 0,
      attachmentCount: usage?.attachmentCount ?? 0,
      lastRefreshedAt: usage?.lastRefreshedAt ?? null,
    };

    // Calculate limits
    const storageLimitBytes = STORAGE_LIMITS[subscription.storageTier];
    const accountLimit = ACCOUNT_LIMITS[subscription.accountTier];

    // Calculate percentages
    const storageUsagePercent =
      storageLimitBytes > 0
        ? Math.min(
            100,
            (storageUsage.totalStorageBytes / storageLimitBytes) * 100,
          )
        : 0;

    const accountUsagePercent =
      accountLimit > 0
        ? Math.min(100, (storageUsage.accountCount / accountLimit) * 100)
        : 0; // 0 for unlimited

    // Check if limits exceeded
    const isStorageLimitExceeded =
      storageUsage.totalStorageBytes > storageLimitBytes;
    const isAccountLimitExceeded =
      accountLimit > 0 && storageUsage.accountCount > accountLimit;

    return {
      subscription: {
        id: subscription.id,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        userId: subscription.userId,
        status: subscription.status.toUpperCase(),
        storageTier: subscription.storageTier.toUpperCase(),
        accountTier: subscription.accountTier.toUpperCase(),
        storageLimitBytes,
        accountLimit,
        isValid: subscription.isValid,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      hasStripeCustomer: !!subscription.stripeCustomerId,
      usage: storageUsage,
      storageUsagePercent,
      accountUsagePercent,
      isStorageLimitExceeded,
      isAccountLimitExceeded,
      isStripeConfigured: isStripeConfigured(),
      prices,
    };
  },
);
