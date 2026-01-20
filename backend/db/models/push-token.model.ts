/**
 * Push Token Model
 * Stores push notification tokens for mobile devices
 */

import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import type { User as UserType } from './user.model.js';

export type Platform = 'ios' | 'android' | 'web';

@Table({
  tableName: 'push_tokens',
  timestamps: true,
})
export class PushToken extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user?: UserType;

  @AllowNull(false)
  @Column(DataType.STRING(512))
  declare token: string;

  @AllowNull(false)
  @Column(DataType.ENUM('ios', 'android', 'web'))
  declare platform: Platform;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare deviceName: string | null;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastUsedAt: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
