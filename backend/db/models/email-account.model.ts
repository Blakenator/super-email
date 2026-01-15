import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import { SmtpProfile } from './smtp-profile.model.js';

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
  declare user: User;

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

  // Unique sync ID to prevent overlapping syncs
  // If syncId is null, no sync is in progress
  // If syncId is set, only that sync instance should write progress
  @Column({ type: DataType.TEXT, allowNull: true })
  declare syncId: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare syncProgress: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare syncStatus: string | null;

  // Sync expiration time - if current time > this, sync is considered stale
  // and a new sync can be started. Updated periodically during active syncs.
  @Column({ type: DataType.DATE, allowNull: true })
  declare syncExpiresAt: Date | null;

  @ForeignKey(() => SmtpProfile)
  @Column({ type: DataType.UUID, allowNull: true })
  declare defaultSmtpProfileId: string | null;

  @BelongsTo(() => SmtpProfile)
  declare defaultSmtpProfile: SmtpProfile | null;

  // Provider ID for icon display (gmail, outlook, yahoo, etc.)
  @Column({ type: DataType.TEXT, allowNull: true })
  declare providerId: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isDefault: boolean;
}
