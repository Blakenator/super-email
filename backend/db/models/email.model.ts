import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from 'sequelize-typescript';
import { EmailAccount } from './email-account.model.js';

export enum EmailFolder {
  INBOX = 'INBOX',
  SENT = 'SENT',
  DRAFTS = 'DRAFTS',
  TRASH = 'TRASH',
  SPAM = 'SPAM',
  ARCHIVE = 'ARCHIVE',
}

@Table({ timestamps: true, tableName: 'emails' })
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

  @BelongsTo(() => EmailAccount)
  declare emailAccount: EmailAccount;

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

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: '(No Subject)' })
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

  @Column({ type: DataType.TEXT, allowNull: true })
  declare inReplyTo: string | null;

  @Column({ type: DataType.ARRAY(DataType.TEXT), allowNull: true })
  declare references: string[] | null;
}
