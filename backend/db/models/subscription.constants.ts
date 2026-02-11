/**
 * Subscription billing constants and enums.
 *
 * Extracted from subscription.model.ts so that code which only needs the
 * constants/enums (e.g. resolvers, billing helpers, tests) does not have to
 * pull in the Sequelize model and its entire import chain.
 */

/**
 * Subscription status matching Stripe's subscription statuses
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  PAUSED = 'paused',
}

/**
 * Storage tier for billing
 * Each tier has a storage limit in GB
 */
export enum StorageTier {
  FREE = 'free', // 5GB
  BASIC = 'basic', // 10GB
  PRO = 'pro', // 20GB
  ENTERPRISE = 'enterprise', // 100GB
}

/**
 * Account tier for billing
 * Each tier has an email account limit
 */
export enum AccountTier {
  FREE = 'free', // 1 account
  BASIC = 'basic', // 2 accounts
  PRO = 'pro', // 5 accounts
  ENTERPRISE = 'enterprise', // unlimited accounts
}

/**
 * Storage limits in bytes for each tier
 */
export const STORAGE_LIMITS: Record<StorageTier, number> = {
  [StorageTier.FREE]: 5 * 1024 * 1024 * 1024, // 5GB
  [StorageTier.BASIC]: 10 * 1024 * 1024 * 1024, // 10GB
  [StorageTier.PRO]: 20 * 1024 * 1024 * 1024, // 20GB
  [StorageTier.ENTERPRISE]: 100 * 1024 * 1024 * 1024, // 100GB
};

/**
 * Account limits for each tier
 */
export const ACCOUNT_LIMITS: Record<AccountTier, number> = {
  [AccountTier.FREE]: 1,
  [AccountTier.BASIC]: 2,
  [AccountTier.PRO]: 5,
  [AccountTier.ENTERPRISE]: -1, // -1 means unlimited
};
