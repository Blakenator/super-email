import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model.js';
import { Email } from './email.model.js';
import { EmailTag } from './email-tag.model.js';

@Table({
  timestamps: true,
  tableName: 'tags',
  indexes: [
    { fields: ['userId'] },
    { fields: ['userId', 'name'], unique: true },
  ],
})
export class Tag extends Model {
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

  @Column({ type: DataType.TEXT, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: '#6c757d' })
  declare color: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @BelongsToMany(() => Email, () => EmailTag)
  declare emails: Email[];
}
