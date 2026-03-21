import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
// Dual import pattern for circular dependencies
import { User } from './user.model.js';
import type { User as UserType } from './user.model.js';
import { SendProfile } from './send-profile.model.js';
import type { SendProfile as SendProfileType } from './send-profile.model.js';
import { ImapAccountSettings } from './imap-account-settings.model.js';
import type { ImapAccountSettings as ImapAccountSettingsType } from './imap-account-settings.model.js';
import { AuthMethod } from './auth-method.js';

export enum EmailAccountType {
  IMAP = 'IMAP',
  CUSTOM_DOMAIN = 'CUSTOM_DOMAIN',
}

export { AuthMethod };

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

  @Column({
    type: DataType.ENUM(...Object.values(EmailAccountType)),
    allowNull: false,
    defaultValue: EmailAccountType.IMAP,
  })
  declare type: EmailAccountType;

  @ForeignKey(() => SendProfile)
  @Column({ type: DataType.UUID, allowNull: true })
  declare defaultSendProfileId: string | null;

  @BelongsTo(() => SendProfile)
  declare defaultSendProfile?: SendProfileType | null;

  // Provider ID for icon display (gmail, outlook, yahoo, etc.)
  @Column({ type: DataType.TEXT, allowNull: true })
  declare providerId: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isDefault: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(AuthMethod)),
    allowNull: false,
    defaultValue: AuthMethod.PASSWORD,
  })
  declare authMethod: AuthMethod;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare needsReauth: boolean;

  @HasOne(() => ImapAccountSettings)
  declare imapSettings?: ImapAccountSettingsType | null;
}
