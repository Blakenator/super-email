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
 * Stores calculated usage metrics for a user.
 * This replaces the materialized view for better per-user update efficiency.
 */
@Table({
  timestamps: true,
  tableName: 'user_usages',
  indexes: [
    { fields: ['userId'], unique: true },
  ],
})
export class UserUsage extends Model {
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

  // Number of email accounts
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare accountCount: number;

  // Total email body size in bytes (textBody + htmlBody)
  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  declare totalBodySizeBytes: number;

  // Total attachment size in bytes
  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  declare totalAttachmentSizeBytes: number;

  // Combined total storage in bytes
  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  declare totalStorageBytes: number;

  // Number of emails
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare emailCount: number;

  // Number of attachments
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare attachmentCount: number;

  // When the usage was last calculated
  @Column({ type: DataType.DATE, allowNull: true })
  declare lastCalculatedAt: Date | null;
}
