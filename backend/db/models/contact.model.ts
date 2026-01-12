import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
  Index,
} from 'sequelize-typescript';
import { User } from './user.model.js';

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

  @Column({ type: DataType.TEXT, allowNull: false })
  declare email: string;

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
}
