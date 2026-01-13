import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from 'sequelize-typescript';
import { Contact } from './contact.model.js';

@Table({ timestamps: true, tableName: 'contact_emails' })
export class ContactEmail extends Model {
  @Column({
    type: DataType.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Contact)
  @Column({ type: DataType.UUID, allowNull: false })
  declare contactId: string;

  @BelongsTo(() => Contact)
  declare contact: Contact;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare email: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isPrimary: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare label: string | null; // e.g., "Work", "Personal", "Other"
}
