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

export enum DnsRecordType {
  CNAME = 'CNAME',
  TXT = 'TXT',
  MX = 'MX',
}

export enum DnsRecordPurpose {
  DKIM = 'DKIM',
  SPF = 'SPF',
  DMARC = 'DMARC',
  MX_INBOUND = 'MX_INBOUND',
}

@Table({
  timestamps: true,
  tableName: 'custom_domain_dns_records',
  indexes: [
    { fields: ['customDomainId'] },
  ],
})
export class CustomDomainDnsRecord extends Model {
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

  @Column({
    type: DataType.ENUM(...Object.values(DnsRecordType)),
    allowNull: false,
  })
  declare recordType: DnsRecordType;

  @Column({
    type: DataType.ENUM(...Object.values(DnsRecordPurpose)),
    allowNull: false,
  })
  declare purpose: DnsRecordPurpose;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare value: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isVerified: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastCheckedAt: Date | null;
}
