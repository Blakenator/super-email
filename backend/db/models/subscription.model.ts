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

// Re-export constants/enums from the standalone constants file so that
// existing `import { X } from 'subscription.model.js'` statements keep working.
export {
  SubscriptionStatus,
  StorageTier,
  AccountTier,
  STORAGE_LIMITS,
  ACCOUNT_LIMITS,
} from './subscription.constants.js';

import {
  SubscriptionStatus,
  StorageTier,
  AccountTier,
  STORAGE_LIMITS,
  ACCOUNT_LIMITS,
} from './subscription.constants.js';

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
