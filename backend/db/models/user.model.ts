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

  @Column({ type: DataType.TEXT, allowNull: true })
  declare firstName: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare lastName: string;

  // Note: HasMany associations are not defined here to avoid circular dependencies.
  // The ForeignKey/BelongsTo decorators on child models are sufficient for Sequelize
  // to establish relationships. Query with `include: [EmailAccount, SmtpProfile]` will still work.
  //
  // The associations exist implicitly:
  // - emailAccounts: EmailAccount[] (via EmailAccount.userId FK)
  // - smtpProfiles: SmtpProfile[] (via SmtpProfile.userId FK)
  // - contacts: Contact[] (via Contact.userId FK)
  // - authenticationMethods: AuthenticationMethod[] (via AuthenticationMethod.userId FK)
}
