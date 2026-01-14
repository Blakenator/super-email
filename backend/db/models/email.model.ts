import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  Model,
  Table,
  Index,
} from 'sequelize-typescript';
import { EmailAccount } from './email-account.model.js';
import { SmtpProfile } from './smtp-profile.model.js';
import { Tag } from './tag.model.js';
import { EmailTag } from './email-tag.model.js';

export enum EmailFolder {
  INBOX = 'INBOX',
  SENT = 'SENT',
  DRAFTS = 'DRAFTS',
  TRASH = 'TRASH',
  SPAM = 'SPAM',
  ARCHIVE = 'ARCHIVE',
}

@Table({
  timestamps: true,
  tableName: 'emails',
  indexes: [
    // Composite index for listing emails by account and folder, sorted by date
    { fields: ['emailAccountId', 'folder', 'receivedAt'] },
    // Index for thread lookups
    { fields: ['threadId'] },
    // Index for duplicate checking during sync
    { fields: ['emailAccountId', 'messageId'] },
    // Index for starred/unread filtering
    { fields: ['emailAccountId', 'isStarred'] },
    { fields: ['emailAccountId', 'isRead'] },
  ],
})
export class Email extends Model {
  @Column({
    type: DataType.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => EmailAccount)
  @Column({ type: DataType.UUID, allowNull: false })
  declare emailAccountId: string;

  @BelongsTo(() => EmailAccount, { onDelete: 'CASCADE' })
  declare emailAccount: EmailAccount;

  @ForeignKey(() => SmtpProfile)
  @Column({ type: DataType.UUID, allowNull: true })
  declare smtpProfileId: string | null;

  @BelongsTo(() => SmtpProfile)
  declare smtpProfile: SmtpProfile | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare messageId: string;

  @Column({
    type: DataType.ENUM(...Object.values(EmailFolder)),
    allowNull: false,
    defaultValue: EmailFolder.INBOX,
  })
  declare folder: EmailFolder;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare fromAddress: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare fromName: string | null;

  @Column({ type: DataType.ARRAY(DataType.TEXT), allowNull: false })
  declare toAddresses: string[];

  @Column({ type: DataType.ARRAY(DataType.TEXT), allowNull: true })
  declare ccAddresses: string[] | null;

  @Column({ type: DataType.ARRAY(DataType.TEXT), allowNull: true })
  declare bccAddresses: string[] | null;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: '(No Subject)',
  })
  declare subject: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare textBody: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare htmlBody: string | null;

  @Column({ type: DataType.DATE, allowNull: false })
  declare receivedAt: Date;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isRead: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isStarred: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isDraft: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare inReplyTo: string | null;

  @Column({ type: DataType.ARRAY(DataType.TEXT), allowNull: true })
  declare references: string[] | null;

  // Thread ID - the message ID of the first email in the thread
  // Used for grouping related emails together
  @Column({ type: DataType.TEXT, allowNull: true })
  declare threadId: string | null;

  // Store all email headers as JSON for future use
  @Column({ type: DataType.JSONB, allowNull: true })
  declare headers: Record<string, string | string[]> | null;

  // Track if user has unsubscribed via one-click unsubscribe
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isUnsubscribed: boolean;

  // Store the unsubscribe URL if present in headers
  @Column({ type: DataType.TEXT, allowNull: true })
  declare unsubscribeUrl: string | null;

  // Store mailto unsubscribe address if present
  @Column({ type: DataType.TEXT, allowNull: true })
  declare unsubscribeEmail: string | null;

  // Tags relationship via junction table
  @BelongsToMany(() => Tag, () => EmailTag)
  declare tags: Tag[];
}
