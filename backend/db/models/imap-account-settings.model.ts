import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from 'sequelize-typescript';
import { EmailAccount } from './email-account.model.js';
import type { EmailAccount as EmailAccountType } from './email-account.model.js';

export enum ImapAccountType {
  IMAP = 'IMAP',
  POP3 = 'POP3',
}

@Table({
  timestamps: true,
  tableName: 'imap_account_settings',
  indexes: [
    { fields: ['emailAccountId'], unique: true },
  ],
})
export class ImapAccountSettings extends Model {
  @Column({
    type: DataType.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => EmailAccount)
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  declare emailAccountId: string;

  @BelongsTo(() => EmailAccount, { onDelete: 'CASCADE' })
  declare emailAccount?: EmailAccountType;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare host: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare port: number;

  @Column({
    type: DataType.ENUM(...Object.values(ImapAccountType)),
    allowNull: false,
  })
  declare accountType: ImapAccountType;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare useSsl: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastSyncedAt: Date | null;

  // ===== HISTORICAL SYNC FIELDS =====
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

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare historicalSyncLastUidInbox: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare historicalSyncLastUidSent: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare historicalSyncTotalInbox: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare historicalSyncTotalSent: number | null;

  // ===== UPDATE SYNC FIELDS =====
  @Column({ type: DataType.TEXT, allowNull: true })
  declare updateSyncId: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare updateSyncProgress: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare updateSyncStatus: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare updateSyncExpiresAt: Date | null;

  // ===== UID-BASED INCREMENTAL SYNC =====
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare lastSyncUidNextInbox: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare lastSyncUidNextSent: number | null;
}
