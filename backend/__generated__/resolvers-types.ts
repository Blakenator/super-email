import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { MyContext } from '@main/common';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: Date; output: Date; }
  JSON: { input: Record<string, unknown>; output: Record<string, unknown>; }
};

export type AddEmailToContactInput = {
  contactId: Scalars['String']['input'];
  email: Scalars['String']['input'];
  isPrimary?: InputMaybe<Scalars['Boolean']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
};

export enum AuthProvider {
  Apple = 'APPLE',
  EmailPassword = 'EMAIL_PASSWORD',
  Github = 'GITHUB',
  Google = 'GOOGLE',
  Microsoft = 'MICROSOFT'
}

export type AuthenticationMethod = BaseEntityProps & {
  __typename?: 'AuthenticationMethod';
  createdAt?: Maybe<Scalars['Date']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lastUsedAt?: Maybe<Scalars['Date']['output']>;
  provider: AuthProvider;
  providerUserId: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['Date']['output']>;
  userId: Scalars['String']['output'];
};

export type BaseEntityProps = {
  createdAt?: Maybe<Scalars['Date']['output']>;
  id: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['Date']['output']>;
};

export type BulkUpdateEmailsInput = {
  folder?: InputMaybe<EmailFolder>;
  ids: Array<Scalars['String']['input']>;
  isRead?: InputMaybe<Scalars['Boolean']['input']>;
  isStarred?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ComposeEmailInput = {
  bccAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
  ccAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
  draftId?: InputMaybe<Scalars['String']['input']>;
  emailAccountId: Scalars['String']['input'];
  htmlBody?: InputMaybe<Scalars['String']['input']>;
  inReplyTo?: InputMaybe<Scalars['String']['input']>;
  smtpProfileId: Scalars['String']['input'];
  subject: Scalars['String']['input'];
  textBody?: InputMaybe<Scalars['String']['input']>;
  toAddresses: Array<Scalars['String']['input']>;
};

export type Contact = BaseEntityProps & {
  __typename?: 'Contact';
  company?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emails: Array<ContactEmail>;
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  isAutoCreated: Scalars['Boolean']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  userId: Scalars['String']['output'];
};

export type ContactEmail = BaseEntityProps & {
  __typename?: 'ContactEmail';
  contactId: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['Date']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  isPrimary: Scalars['Boolean']['output'];
  label?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
};

export type ContactEmailInput = {
  email: Scalars['String']['input'];
  isPrimary?: InputMaybe<Scalars['Boolean']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
};

export type CreateContactInput = {
  company?: InputMaybe<Scalars['String']['input']>;
  emails: Array<ContactEmailInput>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type CreateEmailAccountInput = {
  accountType: EmailAccountType;
  defaultSmtpProfileId?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  host: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  port: Scalars['Int']['input'];
  providerId?: InputMaybe<Scalars['String']['input']>;
  useSsl: Scalars['Boolean']['input'];
  username: Scalars['String']['input'];
};

export type CreateSmtpProfileInput = {
  alias?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  host: Scalars['String']['input'];
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  port: Scalars['Int']['input'];
  providerId?: InputMaybe<Scalars['String']['input']>;
  useSsl: Scalars['Boolean']['input'];
  username: Scalars['String']['input'];
};

export type Email = BaseEntityProps & {
  __typename?: 'Email';
  bccAddresses?: Maybe<Array<Scalars['String']['output']>>;
  ccAddresses?: Maybe<Array<Scalars['String']['output']>>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  emailAccount?: Maybe<EmailAccount>;
  emailAccountId: Scalars['String']['output'];
  folder: EmailFolder;
  fromAddress: Scalars['String']['output'];
  fromName?: Maybe<Scalars['String']['output']>;
  headers?: Maybe<Scalars['JSON']['output']>;
  htmlBody?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  inReplyTo?: Maybe<Scalars['String']['output']>;
  isDraft: Scalars['Boolean']['output'];
  isRead: Scalars['Boolean']['output'];
  isStarred: Scalars['Boolean']['output'];
  isUnsubscribed: Scalars['Boolean']['output'];
  messageId: Scalars['String']['output'];
  receivedAt: Scalars['Date']['output'];
  references?: Maybe<Array<Scalars['String']['output']>>;
  smtpProfile?: Maybe<SmtpProfile>;
  smtpProfileId?: Maybe<Scalars['String']['output']>;
  subject: Scalars['String']['output'];
  textBody?: Maybe<Scalars['String']['output']>;
  threadCount?: Maybe<Scalars['Int']['output']>;
  threadId?: Maybe<Scalars['String']['output']>;
  toAddresses: Array<Scalars['String']['output']>;
  unsubscribeEmail?: Maybe<Scalars['String']['output']>;
  unsubscribeUrl?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
};

export type EmailAccount = BaseEntityProps & {
  __typename?: 'EmailAccount';
  accountType: EmailAccountType;
  createdAt?: Maybe<Scalars['Date']['output']>;
  defaultSmtpProfile?: Maybe<SmtpProfile>;
  defaultSmtpProfileId?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  host: Scalars['String']['output'];
  id: Scalars['String']['output'];
  isSyncing: Scalars['Boolean']['output'];
  lastSyncedAt?: Maybe<Scalars['Date']['output']>;
  name: Scalars['String']['output'];
  port: Scalars['Int']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  syncProgress?: Maybe<Scalars['Int']['output']>;
  syncStatus?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  useSsl: Scalars['Boolean']['output'];
  userId: Scalars['String']['output'];
};

export enum EmailAccountType {
  Imap = 'IMAP',
  Pop3 = 'POP3'
}

export enum EmailFolder {
  Archive = 'ARCHIVE',
  Drafts = 'DRAFTS',
  Inbox = 'INBOX',
  Sent = 'SENT',
  Spam = 'SPAM',
  Trash = 'TRASH'
}

export type ForwardEmailInput = {
  additionalText?: InputMaybe<Scalars['String']['input']>;
  bccAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
  ccAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
  emailAccountId: Scalars['String']['input'];
  emailId: Scalars['String']['input'];
  smtpProfileId: Scalars['String']['input'];
  toAddresses: Array<Scalars['String']['input']>;
};

export type GetEmailInput = {
  id: Scalars['String']['input'];
};

export type GetEmailsInput = {
  emailAccountId?: InputMaybe<Scalars['String']['input']>;
  folder?: InputMaybe<EmailFolder>;
  isRead?: InputMaybe<Scalars['Boolean']['input']>;
  isStarred?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addEmailToContact: Contact;
  bulkDeleteEmails: Scalars['Int']['output'];
  bulkUpdateEmails: Array<Email>;
  createContact: Contact;
  createContactFromEmail: Contact;
  createEmailAccount: EmailAccount;
  createSmtpProfile: SmtpProfile;
  deleteAuthenticationMethod: Scalars['Boolean']['output'];
  deleteContact: Scalars['Boolean']['output'];
  deleteEmailAccount: Scalars['Boolean']['output'];
  deleteSmtpProfile: Scalars['Boolean']['output'];
  forwardEmail: Email;
  nukeOldEmails: Scalars['Int']['output'];
  saveDraft: Email;
  sendEmail: Email;
  syncAllAccounts: Scalars['Boolean']['output'];
  syncEmailAccount: Scalars['Boolean']['output'];
  testEmailAccountConnection: TestConnectionResult;
  testSmtpConnection: TestConnectionResult;
  unsubscribe: Email;
  updateContact: Contact;
  updateEmailAccount: EmailAccount;
  updateSmtpProfile: SmtpProfile;
};


export type MutationAddEmailToContactArgs = {
  input: AddEmailToContactInput;
};


export type MutationBulkDeleteEmailsArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type MutationBulkUpdateEmailsArgs = {
  input: BulkUpdateEmailsInput;
};


export type MutationCreateContactArgs = {
  input: CreateContactInput;
};


export type MutationCreateContactFromEmailArgs = {
  emailId: Scalars['String']['input'];
};


export type MutationCreateEmailAccountArgs = {
  input: CreateEmailAccountInput;
};


export type MutationCreateSmtpProfileArgs = {
  input: CreateSmtpProfileInput;
};


export type MutationDeleteAuthenticationMethodArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteContactArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteEmailAccountArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteSmtpProfileArgs = {
  id: Scalars['String']['input'];
};


export type MutationForwardEmailArgs = {
  input: ForwardEmailInput;
};


export type MutationNukeOldEmailsArgs = {
  input: NukeOldEmailsInput;
};


export type MutationSaveDraftArgs = {
  input: SaveDraftInput;
};


export type MutationSendEmailArgs = {
  input: ComposeEmailInput;
};


export type MutationSyncEmailAccountArgs = {
  input: SyncEmailAccountInput;
};


export type MutationTestEmailAccountConnectionArgs = {
  input: TestEmailAccountConnectionInput;
};


export type MutationTestSmtpConnectionArgs = {
  input: TestSmtpConnectionInput;
};


export type MutationUnsubscribeArgs = {
  input: UnsubscribeInput;
};


export type MutationUpdateContactArgs = {
  input: UpdateContactInput;
};


export type MutationUpdateEmailAccountArgs = {
  input: UpdateEmailAccountInput;
};


export type MutationUpdateSmtpProfileArgs = {
  input: UpdateSmtpProfileInput;
};

export type NukeOldEmailsInput = {
  olderThan: Scalars['Date']['input'];
};

export type Query = {
  __typename?: 'Query';
  fetchProfile?: Maybe<User>;
  getAuthenticationMethods: Array<AuthenticationMethod>;
  getContact?: Maybe<Contact>;
  getContacts: Array<Contact>;
  getEmail?: Maybe<Email>;
  getEmailAccount?: Maybe<EmailAccount>;
  getEmailAccounts: Array<EmailAccount>;
  getEmailCount: Scalars['Int']['output'];
  getEmails: Array<Email>;
  getEmailsByThread: Array<Email>;
  getSmtpProfile?: Maybe<SmtpProfile>;
  getSmtpProfiles: Array<SmtpProfile>;
  searchContacts: Array<Contact>;
};


export type QueryGetContactArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetEmailArgs = {
  input: GetEmailInput;
};


export type QueryGetEmailAccountArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetEmailCountArgs = {
  input: GetEmailsInput;
};


export type QueryGetEmailsArgs = {
  input: GetEmailsInput;
};


export type QueryGetEmailsByThreadArgs = {
  threadId: Scalars['String']['input'];
};


export type QueryGetSmtpProfileArgs = {
  id: Scalars['String']['input'];
};


export type QuerySearchContactsArgs = {
  query: Scalars['String']['input'];
};

export type SaveDraftInput = {
  bccAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
  ccAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
  emailAccountId: Scalars['String']['input'];
  htmlBody?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  inReplyTo?: InputMaybe<Scalars['String']['input']>;
  smtpProfileId?: InputMaybe<Scalars['String']['input']>;
  subject?: InputMaybe<Scalars['String']['input']>;
  textBody?: InputMaybe<Scalars['String']['input']>;
  toAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SmtpProfile = BaseEntityProps & {
  __typename?: 'SmtpProfile';
  alias?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  email: Scalars['String']['output'];
  host: Scalars['String']['output'];
  id: Scalars['String']['output'];
  isDefault: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  port: Scalars['Int']['output'];
  providerId?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  useSsl: Scalars['Boolean']['output'];
  userId: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  emailCreated: Email;
  emailUpdated: Email;
};

export type SyncEmailAccountInput = {
  emailAccountId: Scalars['String']['input'];
};

export type TestConnectionResult = {
  __typename?: 'TestConnectionResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type TestEmailAccountConnectionInput = {
  accountType: EmailAccountType;
  host: Scalars['String']['input'];
  password: Scalars['String']['input'];
  port: Scalars['Int']['input'];
  useSsl: Scalars['Boolean']['input'];
  username: Scalars['String']['input'];
};

export type TestSmtpConnectionInput = {
  host: Scalars['String']['input'];
  password: Scalars['String']['input'];
  port: Scalars['Int']['input'];
  useSsl: Scalars['Boolean']['input'];
  username: Scalars['String']['input'];
};

export type UnsubscribeInput = {
  emailId: Scalars['String']['input'];
};

export type UpdateContactInput = {
  company?: InputMaybe<Scalars['String']['input']>;
  emails?: InputMaybe<Array<ContactEmailInput>>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEmailAccountInput = {
  defaultSmtpProfileId?: InputMaybe<Scalars['String']['input']>;
  host?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  port?: InputMaybe<Scalars['Int']['input']>;
  providerId?: InputMaybe<Scalars['String']['input']>;
  useSsl?: InputMaybe<Scalars['Boolean']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSmtpProfileInput = {
  alias?: InputMaybe<Scalars['String']['input']>;
  host?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  port?: InputMaybe<Scalars['Int']['input']>;
  providerId?: InputMaybe<Scalars['String']['input']>;
  useSsl?: InputMaybe<Scalars['Boolean']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type User = BaseEntityProps & {
  __typename?: 'User';
  authenticationMethods: Array<AuthenticationMethod>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  email: Scalars['String']['output'];
  emailAccounts: Array<EmailAccount>;
  firstName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  smtpProfiles: Array<SmtpProfile>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;




/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = ResolversObject<{
  BaseEntityProps:
    | ( AuthenticationMethod )
    | ( Contact )
    | ( ContactEmail )
    | ( Email )
    | ( EmailAccount )
    | ( SmtpProfile )
    | ( User )
  ;
}>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AddEmailToContactInput: AddEmailToContactInput;
  AuthProvider: AuthProvider;
  AuthenticationMethod: ResolverTypeWrapper<AuthenticationMethod>;
  BaseEntityProps: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['BaseEntityProps']>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BulkUpdateEmailsInput: BulkUpdateEmailsInput;
  ComposeEmailInput: ComposeEmailInput;
  Contact: ResolverTypeWrapper<Contact>;
  ContactEmail: ResolverTypeWrapper<ContactEmail>;
  ContactEmailInput: ContactEmailInput;
  CreateContactInput: CreateContactInput;
  CreateEmailAccountInput: CreateEmailAccountInput;
  CreateSmtpProfileInput: CreateSmtpProfileInput;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  Email: ResolverTypeWrapper<Email>;
  EmailAccount: ResolverTypeWrapper<EmailAccount>;
  EmailAccountType: EmailAccountType;
  EmailFolder: EmailFolder;
  ForwardEmailInput: ForwardEmailInput;
  GetEmailInput: GetEmailInput;
  GetEmailsInput: GetEmailsInput;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  NukeOldEmailsInput: NukeOldEmailsInput;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  SaveDraftInput: SaveDraftInput;
  SmtpProfile: ResolverTypeWrapper<SmtpProfile>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>;
  SyncEmailAccountInput: SyncEmailAccountInput;
  TestConnectionResult: ResolverTypeWrapper<TestConnectionResult>;
  TestEmailAccountConnectionInput: TestEmailAccountConnectionInput;
  TestSmtpConnectionInput: TestSmtpConnectionInput;
  UnsubscribeInput: UnsubscribeInput;
  UpdateContactInput: UpdateContactInput;
  UpdateEmailAccountInput: UpdateEmailAccountInput;
  UpdateSmtpProfileInput: UpdateSmtpProfileInput;
  User: ResolverTypeWrapper<User>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AddEmailToContactInput: AddEmailToContactInput;
  AuthenticationMethod: AuthenticationMethod;
  BaseEntityProps: ResolversInterfaceTypes<ResolversParentTypes>['BaseEntityProps'];
  Boolean: Scalars['Boolean']['output'];
  BulkUpdateEmailsInput: BulkUpdateEmailsInput;
  ComposeEmailInput: ComposeEmailInput;
  Contact: Contact;
  ContactEmail: ContactEmail;
  ContactEmailInput: ContactEmailInput;
  CreateContactInput: CreateContactInput;
  CreateEmailAccountInput: CreateEmailAccountInput;
  CreateSmtpProfileInput: CreateSmtpProfileInput;
  Date: Scalars['Date']['output'];
  Email: Email;
  EmailAccount: EmailAccount;
  ForwardEmailInput: ForwardEmailInput;
  GetEmailInput: GetEmailInput;
  GetEmailsInput: GetEmailsInput;
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  Mutation: Record<PropertyKey, never>;
  NukeOldEmailsInput: NukeOldEmailsInput;
  Query: Record<PropertyKey, never>;
  SaveDraftInput: SaveDraftInput;
  SmtpProfile: SmtpProfile;
  String: Scalars['String']['output'];
  Subscription: Record<PropertyKey, never>;
  SyncEmailAccountInput: SyncEmailAccountInput;
  TestConnectionResult: TestConnectionResult;
  TestEmailAccountConnectionInput: TestEmailAccountConnectionInput;
  TestSmtpConnectionInput: TestSmtpConnectionInput;
  UnsubscribeInput: UnsubscribeInput;
  UpdateContactInput: UpdateContactInput;
  UpdateEmailAccountInput: UpdateEmailAccountInput;
  UpdateSmtpProfileInput: UpdateSmtpProfileInput;
  User: User;
}>;

export type AuthenticationMethodResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['AuthenticationMethod'] = ResolversParentTypes['AuthenticationMethod']> = ResolversObject<{
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  displayName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastUsedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  provider?: Resolver<ResolversTypes['AuthProvider'], ParentType, ContextType>;
  providerUserId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BaseEntityPropsResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['BaseEntityProps'] = ResolversParentTypes['BaseEntityProps']> = ResolversObject<{
  __resolveType: TypeResolveFn<'AuthenticationMethod' | 'Contact' | 'ContactEmail' | 'Email' | 'EmailAccount' | 'SmtpProfile' | 'User', ParentType, ContextType>;
}>;

export type ContactResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Contact'] = ResolversParentTypes['Contact']> = ResolversObject<{
  company?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  emails?: Resolver<Array<ResolversTypes['ContactEmail']>, ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isAutoCreated?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ContactEmailResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['ContactEmail'] = ResolversParentTypes['ContactEmail']> = ResolversObject<{
  contactId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isPrimary?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  label?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type EmailResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Email'] = ResolversParentTypes['Email']> = ResolversObject<{
  bccAddresses?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  ccAddresses?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  emailAccount?: Resolver<Maybe<ResolversTypes['EmailAccount']>, ParentType, ContextType>;
  emailAccountId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  folder?: Resolver<ResolversTypes['EmailFolder'], ParentType, ContextType>;
  fromAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fromName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  headers?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  htmlBody?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  inReplyTo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isDraft?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isRead?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isStarred?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isUnsubscribed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  messageId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  receivedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  references?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  smtpProfile?: Resolver<Maybe<ResolversTypes['SmtpProfile']>, ParentType, ContextType>;
  smtpProfileId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  textBody?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  threadCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  threadId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  toAddresses?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  unsubscribeEmail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  unsubscribeUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailAccountResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['EmailAccount'] = ResolversParentTypes['EmailAccount']> = ResolversObject<{
  accountType?: Resolver<ResolversTypes['EmailAccountType'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  defaultSmtpProfile?: Resolver<Maybe<ResolversTypes['SmtpProfile']>, ParentType, ContextType>;
  defaultSmtpProfileId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  host?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isSyncing?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastSyncedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  port?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  providerId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  syncProgress?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  syncStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  useSsl?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type MutationResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  addEmailToContact?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<MutationAddEmailToContactArgs, 'input'>>;
  bulkDeleteEmails?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationBulkDeleteEmailsArgs, 'ids'>>;
  bulkUpdateEmails?: Resolver<Array<ResolversTypes['Email']>, ParentType, ContextType, RequireFields<MutationBulkUpdateEmailsArgs, 'input'>>;
  createContact?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<MutationCreateContactArgs, 'input'>>;
  createContactFromEmail?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<MutationCreateContactFromEmailArgs, 'emailId'>>;
  createEmailAccount?: Resolver<ResolversTypes['EmailAccount'], ParentType, ContextType, RequireFields<MutationCreateEmailAccountArgs, 'input'>>;
  createSmtpProfile?: Resolver<ResolversTypes['SmtpProfile'], ParentType, ContextType, RequireFields<MutationCreateSmtpProfileArgs, 'input'>>;
  deleteAuthenticationMethod?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteAuthenticationMethodArgs, 'id'>>;
  deleteContact?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteContactArgs, 'id'>>;
  deleteEmailAccount?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteEmailAccountArgs, 'id'>>;
  deleteSmtpProfile?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteSmtpProfileArgs, 'id'>>;
  forwardEmail?: Resolver<ResolversTypes['Email'], ParentType, ContextType, RequireFields<MutationForwardEmailArgs, 'input'>>;
  nukeOldEmails?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationNukeOldEmailsArgs, 'input'>>;
  saveDraft?: Resolver<ResolversTypes['Email'], ParentType, ContextType, RequireFields<MutationSaveDraftArgs, 'input'>>;
  sendEmail?: Resolver<ResolversTypes['Email'], ParentType, ContextType, RequireFields<MutationSendEmailArgs, 'input'>>;
  syncAllAccounts?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  syncEmailAccount?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSyncEmailAccountArgs, 'input'>>;
  testEmailAccountConnection?: Resolver<ResolversTypes['TestConnectionResult'], ParentType, ContextType, RequireFields<MutationTestEmailAccountConnectionArgs, 'input'>>;
  testSmtpConnection?: Resolver<ResolversTypes['TestConnectionResult'], ParentType, ContextType, RequireFields<MutationTestSmtpConnectionArgs, 'input'>>;
  unsubscribe?: Resolver<ResolversTypes['Email'], ParentType, ContextType, RequireFields<MutationUnsubscribeArgs, 'input'>>;
  updateContact?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<MutationUpdateContactArgs, 'input'>>;
  updateEmailAccount?: Resolver<ResolversTypes['EmailAccount'], ParentType, ContextType, RequireFields<MutationUpdateEmailAccountArgs, 'input'>>;
  updateSmtpProfile?: Resolver<ResolversTypes['SmtpProfile'], ParentType, ContextType, RequireFields<MutationUpdateSmtpProfileArgs, 'input'>>;
}>;

export type QueryResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  fetchProfile?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  getAuthenticationMethods?: Resolver<Array<ResolversTypes['AuthenticationMethod']>, ParentType, ContextType>;
  getContact?: Resolver<Maybe<ResolversTypes['Contact']>, ParentType, ContextType, RequireFields<QueryGetContactArgs, 'id'>>;
  getContacts?: Resolver<Array<ResolversTypes['Contact']>, ParentType, ContextType>;
  getEmail?: Resolver<Maybe<ResolversTypes['Email']>, ParentType, ContextType, RequireFields<QueryGetEmailArgs, 'input'>>;
  getEmailAccount?: Resolver<Maybe<ResolversTypes['EmailAccount']>, ParentType, ContextType, RequireFields<QueryGetEmailAccountArgs, 'id'>>;
  getEmailAccounts?: Resolver<Array<ResolversTypes['EmailAccount']>, ParentType, ContextType>;
  getEmailCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryGetEmailCountArgs, 'input'>>;
  getEmails?: Resolver<Array<ResolversTypes['Email']>, ParentType, ContextType, RequireFields<QueryGetEmailsArgs, 'input'>>;
  getEmailsByThread?: Resolver<Array<ResolversTypes['Email']>, ParentType, ContextType, RequireFields<QueryGetEmailsByThreadArgs, 'threadId'>>;
  getSmtpProfile?: Resolver<Maybe<ResolversTypes['SmtpProfile']>, ParentType, ContextType, RequireFields<QueryGetSmtpProfileArgs, 'id'>>;
  getSmtpProfiles?: Resolver<Array<ResolversTypes['SmtpProfile']>, ParentType, ContextType>;
  searchContacts?: Resolver<Array<ResolversTypes['Contact']>, ParentType, ContextType, RequireFields<QuerySearchContactsArgs, 'query'>>;
}>;

export type SmtpProfileResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['SmtpProfile'] = ResolversParentTypes['SmtpProfile']> = ResolversObject<{
  alias?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  host?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isDefault?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  port?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  providerId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  useSsl?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SubscriptionResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  emailCreated?: SubscriptionResolver<ResolversTypes['Email'], "emailCreated", ParentType, ContextType>;
  emailUpdated?: SubscriptionResolver<ResolversTypes['Email'], "emailUpdated", ParentType, ContextType>;
}>;

export type TestConnectionResultResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['TestConnectionResult'] = ResolversParentTypes['TestConnectionResult']> = ResolversObject<{
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  authenticationMethods?: Resolver<Array<ResolversTypes['AuthenticationMethod']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  emailAccounts?: Resolver<Array<ResolversTypes['EmailAccount']>, ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  smtpProfiles?: Resolver<Array<ResolversTypes['SmtpProfile']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = MyContext> = ResolversObject<{
  AuthenticationMethod?: AuthenticationMethodResolvers<ContextType>;
  BaseEntityProps?: BaseEntityPropsResolvers<ContextType>;
  Contact?: ContactResolvers<ContextType>;
  ContactEmail?: ContactEmailResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Email?: EmailResolvers<ContextType>;
  EmailAccount?: EmailAccountResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  SmtpProfile?: SmtpProfileResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  TestConnectionResult?: TestConnectionResultResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
}>;

