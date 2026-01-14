import { Column, DataType, Model, Table } from 'sequelize-typescript';

export enum ThemePreference {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  AUTO = 'AUTO',
}

export enum NotificationDetailLevel {
  MINIMAL = 'MINIMAL',
  FULL = 'FULL',
}

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

  @Column({
    type: DataType.ENUM(...Object.values(ThemePreference)),
    allowNull: false,
    defaultValue: ThemePreference.AUTO,
  })
  declare themePreference: ThemePreference;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare navbarCollapsed: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(NotificationDetailLevel)),
    allowNull: false,
    defaultValue: NotificationDetailLevel.FULL,
  })
  declare notificationDetailLevel: NotificationDetailLevel;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare inboxDensity: boolean; // true = dense, false = spacious

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare inboxGroupByDate: boolean;

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
