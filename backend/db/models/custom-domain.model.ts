import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import type { User as UserType } from './user.model.js';
import { CustomDomainDnsRecord } from './custom-domain-dns-record.model.js';
import type { CustomDomainDnsRecord as CustomDomainDnsRecordType } from './custom-domain-dns-record.model.js';
import { CustomDomainAccount } from './custom-domain-account.model.js';
import type { CustomDomainAccount as CustomDomainAccountType } from './custom-domain-account.model.js';

export enum CustomDomainStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
}

@Table({
  timestamps: true,
  tableName: 'custom_domains',
  indexes: [
    { fields: ['userId'] },
    { fields: ['domain'], unique: true },
  ],
})
export class CustomDomain extends Model {
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

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  declare domain: string;

  @Column({
    type: DataType.ENUM(...Object.values(CustomDomainStatus)),
    allowNull: false,
    defaultValue: CustomDomainStatus.PENDING_VERIFICATION,
  })
  declare status: CustomDomainStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare sesIdentityArn: string | null;

  @HasMany(() => CustomDomainDnsRecord)
  declare dnsRecords?: CustomDomainDnsRecordType[];

  @HasMany(() => CustomDomainAccount)
  declare accounts?: CustomDomainAccountType[];
}
