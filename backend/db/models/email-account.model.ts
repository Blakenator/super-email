import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model.js';

export enum EmailAccountType {
  IMAP = 'IMAP',
  POP3 = 'POP3',
}

@Table({ timestamps: true, tableName: 'email_accounts' })
export class EmailAccount extends Model {
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

  @Column({ type: DataType.TEXT, allowNull: false })
  declare host: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare port: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare username: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare password: string;

  @Column({
    type: DataType.ENUM(...Object.values(EmailAccountType)),
    allowNull: false,
  })
  declare accountType: EmailAccountType;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare useSsl: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastSyncedAt: Date | null;
}
