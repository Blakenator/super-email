import { getOrCreateSubscription } from './stripe.js';
import { getUserStorageUsageRealtime } from './usage-calculator.js';
import { STORAGE_LIMITS, ACCOUNT_LIMITS } from '../db/models/subscription.model.js';
import { logger } from './logger.js';

export interface BillingCheckResult {
  canSync: boolean;
  reason?: string;
  storageLimitBytes: number;
  currentStorageBytes: number;
  accountLimit: number;
  currentAccounts: number;
  isStorageExceeded: boolean;
  isAccountsExceeded: boolean;
}

/**
 * Check if a user can sync emails based on their billing limits
 * Uses real-time usage calculation for accuracy
 */
export async function checkBillingLimits(userId: string): Promise<BillingCheckResult> {
  // Get subscription
  const subscription = await getOrCreateSubscription(userId);

  // Get real-time usage
  const usage = await getUserStorageUsageRealtime(userId);

  const storageLimitBytes = STORAGE_LIMITS[subscription.storageTier];
  const accountLimit = ACCOUNT_LIMITS[subscription.accountTier];
  const currentStorageBytes = usage?.totalStorageBytes ?? 0;
  const currentAccounts = usage?.accountCount ?? 0;

  // Check if subscription is valid
  if (!subscription.isValid) {
    logger.warn(
      'Billing',
      `User ${userId} subscription not valid: ${subscription.status}`,
    );
    return {
      canSync: false,
      reason: `Subscription status is ${subscription.status}. Please update your payment method.`,
      storageLimitBytes,
      currentStorageBytes,
      accountLimit,
      currentAccounts,
      isStorageExceeded: false,
      isAccountsExceeded: false,
    };
  }

  // Check storage limit
  const isStorageExceeded = currentStorageBytes >= storageLimitBytes;
  if (isStorageExceeded) {
    const usedGB = (currentStorageBytes / (1024 * 1024 * 1024)).toFixed(1);
    const limitGB = (storageLimitBytes / (1024 * 1024 * 1024)).toFixed(0);
    logger.warn(
      'Billing',
      `User ${userId} storage limit exceeded: ${usedGB}GB / ${limitGB}GB`,
    );
    return {
      canSync: false,
      reason: `Storage limit exceeded (${usedGB}GB used of ${limitGB}GB). Please upgrade your plan or delete some emails.`,
      storageLimitBytes,
      currentStorageBytes,
      accountLimit,
      currentAccounts,
      isStorageExceeded: true,
      isAccountsExceeded: false,
    };
  }

  // Check account limit (only if limit is not unlimited)
  const isAccountsExceeded = accountLimit > 0 && currentAccounts > accountLimit;
  if (isAccountsExceeded) {
    logger.warn(
      'Billing',
      `User ${userId} account limit exceeded: ${currentAccounts} / ${accountLimit}`,
    );
    return {
      canSync: false,
      reason: `Account limit exceeded (${currentAccounts} accounts, limit is ${accountLimit}). Please upgrade your plan.`,
      storageLimitBytes,
      currentStorageBytes,
      accountLimit,
      currentAccounts,
      isStorageExceeded: false,
      isAccountsExceeded: true,
    };
  }

  return {
    canSync: true,
    storageLimitBytes,
    currentStorageBytes,
    accountLimit,
    currentAccounts,
    isStorageExceeded: false,
    isAccountsExceeded: false,
  };
}

/**
 * Get remaining storage bytes for a user
 */
export async function getRemainingStorageBytes(userId: string): Promise<number> {
  const subscription = await getOrCreateSubscription(userId);
  const usage = await getUserStorageUsageRealtime(userId);

  const storageLimitBytes = STORAGE_LIMITS[subscription.storageTier];
  const currentStorageBytes = usage?.totalStorageBytes ?? 0;

  return Math.max(0, storageLimitBytes - currentStorageBytes);
}
