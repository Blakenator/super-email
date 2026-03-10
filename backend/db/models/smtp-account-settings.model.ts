import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from 'sequelize-typescript';
import { SendProfile } from './send-profile.model.js';
import type { SendProfile as SendProfileType } from './send-profile.model.js';

@Table({
  timestamps: true,
  tableName: 'smtp_account_settings',
  indexes: [
    { fields: ['sendProfileId'], unique: true },
  ],
})
export class SmtpAccountSettings extends Model {
  @Column({
    type: DataType.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => SendProfile)
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  declare sendProfileId: string;

  @BelongsTo(() => SendProfile, { onDelete: 'CASCADE' })
  declare sendProfile?: SendProfileType;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare host: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare port: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare useSsl: boolean;
}
