import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from 'sequelize-typescript';
import { CustomDomain } from './custom-domain.model.js';
import type { CustomDomain as CustomDomainType } from './custom-domain.model.js';
import { EmailAccount } from './email-account.model.js';
import type { EmailAccount as EmailAccountType } from './email-account.model.js';
import { SendProfile } from './send-profile.model.js';
import type { SendProfile as SendProfileType } from './send-profile.model.js';

@Table({
  timestamps: true,
  tableName: 'custom_domain_accounts',
  indexes: [
    { fields: ['customDomainId'] },
    { fields: ['emailAccountId'] },
    { fields: ['sendProfileId'] },
    { fields: ['customDomainId', 'localPart'], unique: true },
  ],
})
export class CustomDomainAccount extends Model {
  @Column({
    type: DataType.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => CustomDomain)
  @Column({ type: DataType.UUID, allowNull: false })
  declare customDomainId: string;

  @BelongsTo(() => CustomDomain, { onDelete: 'CASCADE' })
  declare customDomain?: CustomDomainType;

  @ForeignKey(() => EmailAccount)
  @Column({ type: DataType.UUID, allowNull: true })
  declare emailAccountId: string | null;

  @BelongsTo(() => EmailAccount, { onDelete: 'SET NULL' })
  declare emailAccount?: EmailAccountType | null;

  @ForeignKey(() => SendProfile)
  @Column({ type: DataType.UUID, allowNull: true })
  declare sendProfileId: string | null;

  @BelongsTo(() => SendProfile, { onDelete: 'SET NULL' })
  declare sendProfile?: SendProfileType | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare localPart: string;
}
