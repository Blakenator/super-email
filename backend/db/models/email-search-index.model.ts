import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table,
} from 'sequelize-typescript';
import { Email } from './email.model.js';
import type { Email as EmailType } from './email.model.js';

@Table({
  timestamps: true,
  tableName: 'email_search_index',
  indexes: [
    { fields: ['emailAccountId'] },
  ],
})
export class EmailSearchIndex extends Model {
  @Column({
    type: DataType.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Email)
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  declare emailId: string;

  @BelongsTo(() => Email, { onDelete: 'CASCADE' })
  declare email?: EmailType;

  @Column({ type: DataType.UUID, allowNull: false })
  declare emailAccountId: string;

  // TSVECTOR column for full-text search (managed via raw SQL in queries)
  @Column({ type: 'TSVECTOR' as any, allowNull: true })
  declare searchVector: any;

  // pgvector VECTOR(384) column for semantic search embeddings
  @Column({ type: 'VECTOR(384)' as any, allowNull: true })
  declare embedding: any;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare bodySize: number;
}
