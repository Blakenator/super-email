import {
  Column,
  DataType,
  Model,
  Table,
  HasMany,
} from 'sequelize-typescript';
// Dual import pattern for circular dependencies
import { EmailAccount } from './email-account.model.js';
import type { EmailAccount as EmailAccountType } from './email-account.model.js';
import { SmtpProfile } from './smtp-profile.model.js';
import type { SmtpProfile as SmtpProfileType } from './smtp-profile.model.js';
import { Contact } from './contact.model.js';
import type { Contact as ContactType } from './contact.model.js';
import { AuthenticationMethod } from './authentication-method.model.js';
import type { AuthenticationMethod as AuthenticationMethodType } from './authentication-method.model.js';
import { Tag } from './tag.model.js';
import type { Tag as TagType } from './tag.model.js';
import { MailRule } from './mail-rule.model.js';
import type { MailRule as MailRuleType } from './mail-rule.model.js';

export enum ThemePreference {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  AUTO = 'AUTO',
}

export enum NotificationDetailLevel {
  MINIMAL = 'MINIMAL',
  FULL = 'FULL',
}

@Table({ timestamps: true, tableName: 'users' })
export class User extends Model {
  @Column({
    type: DataType.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare firstName: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare lastName: string;

  @Column({
    type: DataType.ENUM(...Object.values(ThemePreference)),
    allowNull: false,
    defaultValue: ThemePreference.AUTO,
  })
  declare themePreference: ThemePreference;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare navbarCollapsed: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(NotificationDetailLevel)),
    allowNull: false,
    defaultValue: NotificationDetailLevel.FULL,
  })
  declare notificationDetailLevel: NotificationDetailLevel;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare inboxDensity: boolean; // true = dense, false = spacious

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare inboxGroupByDate: boolean;

  // Associations
  @HasMany(() => EmailAccount)
  declare emailAccounts?: EmailAccountType[];

  @HasMany(() => SmtpProfile)
  declare smtpProfiles?: SmtpProfileType[];

  @HasMany(() => Contact)
  declare contacts?: ContactType[];

  @HasMany(() => AuthenticationMethod)
  declare authenticationMethods?: AuthenticationMethodType[];

  @HasMany(() => Tag)
  declare tags?: TagType[];

  @HasMany(() => MailRule)
  declare mailRules?: MailRuleType[];
}
