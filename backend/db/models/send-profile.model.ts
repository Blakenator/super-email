import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import type { User as UserType } from './user.model.js';
import { SmtpAccountSettings } from './smtp-account-settings.model.js';
import type { SmtpAccountSettings as SmtpAccountSettingsType } from './smtp-account-settings.model.js';
import { EmailAccount } from './email-account.model.js';
import type { EmailAccount as EmailAccountType } from './email-account.model.js';
import { AuthMethod } from './auth-method.js';

export { AuthMethod };

export enum SendProfileType {
  SMTP = 'SMTP',
  CUSTOM_DOMAIN = 'CUSTOM_DOMAIN',
}

@Table({
  timestamps: true,
  tableName: 'send_profiles',
  indexes: [
    { fields: ['userId'] },
  ],
})
export class SendProfile extends Model {
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

  @Column({ type: DataType.TEXT, allowNull: true })
  declare alias: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(SendProfileType)),
    allowNull: false,
    defaultValue: SendProfileType.SMTP,
  })
  declare type: SendProfileType;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isDefault: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare providerId: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(AuthMethod)),
    allowNull: false,
    defaultValue: AuthMethod.PASSWORD,
  })
  declare authMethod: AuthMethod;

  @ForeignKey(() => EmailAccount)
  @Column({ type: DataType.UUID, allowNull: true })
  declare emailAccountId: string | null;

  @BelongsTo(() => EmailAccount, { foreignKey: 'emailAccountId', onDelete: 'SET NULL' })
  declare emailAccount?: EmailAccountType | null;

  @HasOne(() => SmtpAccountSettings)
  declare smtpSettings?: SmtpAccountSettingsType | null;
}
