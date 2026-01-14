import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import { EmailAccount } from './email-account.model.js';

export enum RuleAction {
  ARCHIVE = 'ARCHIVE',
  STAR = 'STAR',
  DELETE = 'DELETE',
  MARK_READ = 'MARK_READ',
  ADD_TAGS = 'ADD_TAGS',
  FORWARD = 'FORWARD',
}

export interface RuleConditions {
  fromContains?: string;
  toContains?: string;
  ccContains?: string;
  bccContains?: string;
  subjectContains?: string;
  bodyContains?: string;
}

export interface RuleActions {
  archive?: boolean;
  star?: boolean;
  delete?: boolean;
  markRead?: boolean;
  addTagIds?: string[];
  forwardTo?: string;
}

@Table({
  timestamps: true,
  tableName: 'mail_rules',
  indexes: [
    { fields: ['userId'] },
    { fields: ['emailAccountId'] },
  ],
})
export class MailRule extends Model {
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

  // Optional: apply rule only to specific account
  @ForeignKey(() => EmailAccount)
  @Column({ type: DataType.UUID, allowNull: true })
  declare emailAccountId: string | null;

  @BelongsTo(() => EmailAccount, { onDelete: 'CASCADE' })
  declare emailAccount: EmailAccount | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  // Rule conditions stored as JSON
  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  declare conditions: RuleConditions;

  // Actions to perform when rule matches
  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  declare actions: RuleActions;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isEnabled: boolean;

  // Order for rule priority (lower = higher priority)
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare priority: number;

  // Stop processing further rules after this one matches
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare stopProcessing: boolean;
}
