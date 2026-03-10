import { makeQuery } from '../../types.js';
import {
  getOrCreateSubscription,
  isStripeConfigured,
  syncSubscriptionFromStripe,
  resolveCheckoutSession,
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
import { DOMAIN_LIMITS } from '../../db/models/subscription.constants.js';
import { requireAuth } from '../../helpers/auth.js';

export const getBillingInfo = makeQuery(
  'getBillingInfo',
  async (_parent, args, context) => {
    const userId = requireAuth(context);

    let subscription = await getOrCreateSubscription(userId);

    if (args.sessionId) {
      subscription = await resolveCheckoutSession(
        subscription,
        args.sessionId,
      );
    }

    subscription = await syncSubscriptionFromStripe(subscription);

    const prices = await getStripePrices();

    const usage = await getOrCreateUserUsage(userId);

    const domainCount = usage?.domainCount ?? 0;

    const storageUsage = {
      userId: userId,
      accountCount: usage?.accountCount ?? 0,
      domainCount,
      totalBodySizeBytes: usage?.totalStorageBytes ?? 0,
      totalAttachmentSizeBytes: usage?.totalAttachmentSizeBytes ?? 0,
      totalStorageBytes: usage?.totalStorageBytes ?? 0,
      totalStorageGB: bytesToGB(usage?.totalStorageBytes ?? 0),
      emailCount: usage?.emailCount ?? 0,
      attachmentCount: usage?.attachmentCount ?? 0,
      lastRefreshedAt: usage?.lastRefreshedAt ?? null,
    };

    const storageLimitBytes = STORAGE_LIMITS[subscription.storageTier];
    const accountLimit = ACCOUNT_LIMITS[subscription.accountTier];
    const domainLimit = DOMAIN_LIMITS[subscription.domainTier];

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
        : 0;

    const domainUsagePercent =
      domainLimit > 0
        ? Math.min(100, (domainCount / domainLimit) * 100)
        : 0;

    const isStorageLimitExceeded =
      storageUsage.totalStorageBytes > storageLimitBytes;
    const isAccountLimitExceeded =
      accountLimit > 0 && storageUsage.accountCount > accountLimit;
    const isDomainLimitExceeded =
      domainLimit >= 0 && domainCount > domainLimit;

    return {
      subscription: {
        id: subscription.id,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        userId: subscription.userId,
        status: subscription.status.toUpperCase(),
        storageTier: subscription.storageTier.toUpperCase(),
        accountTier: subscription.accountTier.toUpperCase(),
        domainTier: subscription.domainTier.toUpperCase(),
        storageLimitBytes,
        accountLimit,
        domainLimit,
        isValid: subscription.isValid,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      hasStripeCustomer: !!subscription.stripeSubscriptionId,
      usage: storageUsage,
      storageUsagePercent,
      accountUsagePercent,
      domainCount,
      domainUsagePercent,
      isStorageLimitExceeded,
      isAccountLimitExceeded,
      isDomainLimitExceeded,
      isStripeConfigured: isStripeConfigured(),
      prices,
    };
  },
);
