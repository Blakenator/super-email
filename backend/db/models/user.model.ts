import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ timestamps: true, tableName: 'users' })
export class User extends Model {
  @Column({
    type: DataType.UUID,
    unique: true,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare passwordHash: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare firstName: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare lastName: string;
}
