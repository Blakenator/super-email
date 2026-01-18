import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
  Index,
} from 'sequelize-typescript';
// Import Email class for decorator usage via arrow function (lazy evaluation)
// Import Email type separately for type annotation
import { Email } from './email.model.js';
import type { Email as EmailType } from './email.model.js';

export enum AttachmentType {
  INLINE = 'INLINE',
  ATTACHMENT = 'ATTACHMENT',
}

@Table({
  timestamps: true,
  tableName: 'attachments',
  indexes: [
    // Index for fetching attachments by email
    { fields: ['emailId'] },
    // Index for finding attachments by storage key
    { fields: ['storageKey'] },
  ],
})
export class Attachment extends Model {
  @Column({
    type: DataType.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Email)
  @Column({ type: DataType.UUID, allowNull: false })
  declare emailId: string;

  // Don't declare type here to avoid circular ref in __metadata
  // Use type assertion when accessing: (attachment.email as Email)
  @BelongsTo(() => Email, { onDelete: 'CASCADE' })
  email?: EmailType;

  // Original filename from email
  @Column({ type: DataType.TEXT, allowNull: false })
  declare filename: string;

  // MIME type (e.g., 'application/pdf', 'image/jpeg')
  @Column({ type: DataType.TEXT, allowNull: false })
  declare mimeType: string;

  // File extension (e.g., 'pdf', 'jpg', 'png')
  @Column({ type: DataType.TEXT, allowNull: true })
  declare extension: string | null;

  // Size in bytes
  @Column({ type: DataType.BIGINT, allowNull: false })
  declare size: number;

  // Storage key (S3 key in production, file path in development)
  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  declare storageKey: string;

  // Whether this is an inline attachment (embedded in HTML) or separate
  @Column({
    type: DataType.ENUM(...Object.values(AttachmentType)),
    allowNull: false,
    defaultValue: AttachmentType.ATTACHMENT,
  })
  declare attachmentType: AttachmentType;

  // Content-ID for inline attachments (used in HTML body)
  @Column({ type: DataType.TEXT, allowNull: true })
  declare contentId: string | null;

  // Content-Disposition from email header
  @Column({ type: DataType.TEXT, allowNull: true })
  declare contentDisposition: string | null;

  // Whether the attachment is safe to preview/download
  // Could be set to false if virus scanning is implemented
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isSafe: boolean;
}
