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
import { SmtpProfile } from './smtp-profile.model.js';
import type { SmtpProfile as SmtpProfileType } from './smtp-profile.model.js';

export enum EmailAccountType {
  IMAP = 'IMAP',
  POP3 = 'POP3',
}

@Table({
  timestamps: true,
  tableName: 'email_accounts',
  indexes: [
    // Index for listing accounts by user
    { fields: ['userId'] },
  ],
})
export class EmailAccount extends Model {
  @Column({
    type: DataType.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user?: UserType;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare email: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare host: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare port: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare username: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare password: string;

  @Column({
    type: DataType.ENUM(...Object.values(EmailAccountType)),
    allowNull: false,
  })
  declare accountType: EmailAccountType;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare useSsl: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastSyncedAt: Date | null;

  // ===== HISTORICAL SYNC FIELDS (initial sync of old emails) =====
  // Historical sync fetches emails from newest to oldest on first sync
  @Column({ type: DataType.TEXT, allowNull: true })
  declare historicalSyncId: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare historicalSyncProgress: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare historicalSyncStatus: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare historicalSyncComplete: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare historicalSyncExpiresAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare historicalSyncLastAt: Date | null;

  // Resume point for interrupted historical syncs - stores the oldest message date synced so far
  // This allows historical syncs to resume from where they left off instead of starting over
  // Uses timestamp-based pagination which is more reliable than sequence numbers
  @Column({ type: DataType.DATE, allowNull: true })
  declare historicalSyncOldestDate: Date | null;

  // UID-based resume point for INBOX - stores the last processed UID
  // More reliable than date-based resume since UIDs are unique and ordered
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare historicalSyncLastUidInbox: number | null;

  // UID-based resume point for SENT folder
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare historicalSyncLastUidSent: number | null;

  // Total UIDs to process for progress calculation during resume
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare historicalSyncTotalInbox: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare historicalSyncTotalSent: number | null;

  // ===== UPDATE SYNC FIELDS (sync of new emails) =====
  // Update sync fetches only new emails since last sync
  @Column({ type: DataType.TEXT, allowNull: true })
  declare updateSyncId: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare updateSyncProgress: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare updateSyncStatus: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare updateSyncExpiresAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastSyncEmailReceivedAt: Date | null;

  @ForeignKey(() => SmtpProfile)
  @Column({ type: DataType.UUID, allowNull: true })
  declare defaultSmtpProfileId: string | null;

  @BelongsTo(() => SmtpProfile)
  declare defaultSmtpProfile?: SmtpProfileType | null;

  // Provider ID for icon display (gmail, outlook, yahoo, etc.)
  @Column({ type: DataType.TEXT, allowNull: true })
  declare providerId: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isDefault: boolean;
}
