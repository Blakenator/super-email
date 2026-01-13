import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model.js';

@Table({ timestamps: true, tableName: 'smtp_profiles' })
export class SmtpProfile extends Model {
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
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare email: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare alias: string | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare host: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare port: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare username: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare password: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare useSsl: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isDefault: boolean;

  // Provider ID for icon display (gmail, outlook, yahoo, etc.)
  @Column({ type: DataType.TEXT, allowNull: true })
  declare providerId: string | null;
}
