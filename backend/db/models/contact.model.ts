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
import { ContactEmail } from './contact-email.model.js';

@Table({ timestamps: true, tableName: 'contacts' })
export class Contact extends Model {
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

  @BelongsTo(() => User)
  declare user: User;

  // Primary email for backward compatibility - will be synced with the primary ContactEmail
  @Column({ type: DataType.TEXT, allowNull: true })
  declare email: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare name: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare firstName: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare lastName: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare company: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare phone: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string | null;

  // Whether this contact was auto-created from email interaction
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isAutoCreated: boolean;

  @HasMany(() => ContactEmail)
  declare emails: ContactEmail[];
}
