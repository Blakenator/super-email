import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model.js';

export enum AuthProvider {
  EMAIL_PASSWORD = 'EMAIL_PASSWORD',
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
  APPLE = 'APPLE',
  MICROSOFT = 'MICROSOFT',
}

@Table({
  timestamps: true,
  tableName: 'authentication_methods',
  indexes: [
    // Index for looking up auth methods by user
    { fields: ['userId'] },
    // Index for looking up by provider user ID (for OAuth logins)
    { fields: ['providerUserId'] },
  ],
})
export class AuthenticationMethod extends Model {
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

  @Column({
    type: DataType.ENUM(...Object.values(AuthProvider)),
    allowNull: false,
  })
  declare provider: AuthProvider;

  // The unique identifier from the auth provider (e.g., Supabase user ID, Google ID)
  @Column({ type: DataType.TEXT, allowNull: false })
  declare providerUserId: string;

  // The email associated with this auth method
  @Column({ type: DataType.TEXT, allowNull: false })
  declare email: string;

  // Display name for this auth method (e.g., "john@gmail.com via Google")
  @Column({ type: DataType.TEXT, allowNull: true })
  declare displayName: string | null;

  // When this auth method was last used
  @Column({ type: DataType.DATE, allowNull: true })
  declare lastUsedAt: Date | null;
}
