import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Email } from './email.model.js';
import { Tag } from './tag.model.js';

@Table({
  timestamps: true,
  tableName: 'email_tags',
  indexes: [
    { fields: ['emailId', 'tagId'], unique: true },
    { fields: ['tagId'] },
  ],
})
export class EmailTag extends Model {
  @Column({
    type: DataType.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Email)
  @Column({ type: DataType.UUID, allowNull: false })
  declare emailId: string;

  @ForeignKey(() => Tag)
  @Column({ type: DataType.UUID, allowNull: false })
  declare tagId: string;
}
