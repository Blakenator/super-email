import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from 'sequelize-typescript';
// Dual import pattern for circular dependencies
import { User } from './user.model.js';
import type { User as UserType } from './user.model.js';

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

@Table({
  timestamps: true,
  tableName: 'subscriptions',
  indexes: [
    { fields: ['userId'], unique: true },
    { fields: ['stripeCustomerId'] },
    { fields: ['stripeSubscriptionId'] },
  ],
})
export class Subscription extends Model {
  @Column({
    type: DataType.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  declare userId: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user?: UserType;

  // Stripe customer ID
  @Column({ type: DataType.TEXT, allowNull: true })
  declare stripeCustomerId: string | null;

  // Stripe subscription ID
  @Column({ type: DataType.TEXT, allowNull: true })
  declare stripeSubscriptionId: string | null;

  // Current subscription status
  @Column({
    type: DataType.ENUM(...Object.values(SubscriptionStatus)),
    allowNull: false,
    defaultValue: SubscriptionStatus.ACTIVE,
  })
  declare status: SubscriptionStatus;

  // Storage tier (determines storage limit)
  @Column({
    type: DataType.ENUM(...Object.values(StorageTier)),
    allowNull: false,
    defaultValue: StorageTier.FREE,
  })
  declare storageTier: StorageTier;

  // Account tier (determines number of email accounts allowed)
  @Column({
    type: DataType.ENUM(...Object.values(AccountTier)),
    allowNull: false,
    defaultValue: AccountTier.FREE,
  })
  declare accountTier: AccountTier;

  // Current period end (from Stripe)
  @Column({ type: DataType.DATE, allowNull: true })
  declare currentPeriodEnd: Date | null;

  // Cancel at period end (user has requested cancellation)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare cancelAtPeriodEnd: boolean;

  // Computed storage limit in bytes
  get storageLimitBytes(): number {
    return STORAGE_LIMITS[this.storageTier];
  }

  // Computed account limit
  get accountLimit(): number {
    return ACCOUNT_LIMITS[this.accountTier];
  }

  // Helper to check if subscription is valid for syncing
  get isValid(): boolean {
    return (
      this.status === SubscriptionStatus.ACTIVE ||
      this.status === SubscriptionStatus.TRIALING
    );
  }
}
