/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: string; output: string; }
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

export type GetContactsForModalQueryVariables = Exact<{ [key: string]: never; }>;


export type GetContactsForModalQuery = { __typename?: 'Query', getContacts: Array<{ __typename?: 'Contact', id: string, email?: string | null, name?: string | null, firstName?: string | null, lastName?: string | null, company?: string | null, emails: Array<{ __typename?: 'ContactEmail', id: string, email: string, isPrimary: boolean, label?: string | null }> }> };

export type CreateContactFromModalMutationVariables = Exact<{
  input: CreateContactInput;
}>;


export type CreateContactFromModalMutation = { __typename?: 'Mutation', createContact: { __typename?: 'Contact', id: string, email?: string | null, name?: string | null, emails: Array<{ __typename?: 'ContactEmail', id: string, email: string, isPrimary: boolean }> } };

export type UpdateContactFromModalMutationVariables = Exact<{
  input: UpdateContactInput;
}>;


export type UpdateContactFromModalMutation = { __typename?: 'Mutation', updateContact: { __typename?: 'Contact', id: string, email?: string | null, name?: string | null, emails: Array<{ __typename?: 'ContactEmail', id: string, email: string, isPrimary: boolean }> } };

export type AddEmailToContactMutationVariables = Exact<{
  input: AddEmailToContactInput;
}>;


export type AddEmailToContactMutation = { __typename?: 'Mutation', addEmailToContact: { __typename?: 'Contact', id: string, email?: string | null, name?: string | null, emails: Array<{ __typename?: 'ContactEmail', id: string, email: string, isPrimary: boolean }> } };

export type SearchContactsForChipInputQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchContactsForChipInputQuery = { __typename?: 'Query', searchContacts: Array<{ __typename?: 'Contact', id: string, email?: string | null, name?: string | null, firstName?: string | null, lastName?: string | null, company?: string | null, phone?: string | null }> };

export type SearchContactByEmailQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchContactByEmailQuery = { __typename?: 'Query', searchContacts: Array<{ __typename?: 'Contact', id: string, email?: string | null, name?: string | null, firstName?: string | null, lastName?: string | null, company?: string | null, phone?: string | null, notes?: string | null }> };

export type FetchProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type FetchProfileQuery = { __typename?: 'Query', fetchProfile?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string } | null };

export type GetSmtpProfilesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSmtpProfilesQuery = { __typename?: 'Query', getSmtpProfiles: Array<{ __typename?: 'SmtpProfile', id: string, name: string, email: string, alias?: string | null, isDefault: boolean }> };

export type GetEmailAccountsForComposeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmailAccountsForComposeQuery = { __typename?: 'Query', getEmailAccounts: Array<{ __typename?: 'EmailAccount', id: string, name: string, email: string, defaultSmtpProfileId?: string | null }> };

export type SendEmailMutationVariables = Exact<{
  input: ComposeEmailInput;
}>;


export type SendEmailMutation = { __typename?: 'Mutation', sendEmail: { __typename?: 'Email', id: string, messageId: string, subject: string } };

export type SaveDraftMutationVariables = Exact<{
  input: SaveDraftInput;
}>;


export type SaveDraftMutation = { __typename?: 'Mutation', saveDraft: { __typename?: 'Email', id: string, subject: string } };

export type GetContactsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetContactsQuery = { __typename?: 'Query', getContacts: Array<{ __typename?: 'Contact', id: string, email?: string | null, name?: string | null, firstName?: string | null, lastName?: string | null, company?: string | null, phone?: string | null, notes?: string | null, isAutoCreated: boolean, createdAt?: string | null, emails: Array<{ __typename?: 'ContactEmail', id: string, email: string, isPrimary: boolean, label?: string | null }> }> };

export type SearchContactsQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchContactsQuery = { __typename?: 'Query', searchContacts: Array<{ __typename?: 'Contact', id: string, email?: string | null, name?: string | null, firstName?: string | null, lastName?: string | null, emails: Array<{ __typename?: 'ContactEmail', id: string, email: string, isPrimary: boolean, label?: string | null }> }> };

export type CreateContactMutationVariables = Exact<{
  input: CreateContactInput;
}>;


export type CreateContactMutation = { __typename?: 'Mutation', createContact: { __typename?: 'Contact', id: string, email?: string | null, name?: string | null, emails: Array<{ __typename?: 'ContactEmail', id: string, email: string, isPrimary: boolean, label?: string | null }> } };

export type UpdateContactMutationVariables = Exact<{
  input: UpdateContactInput;
}>;


export type UpdateContactMutation = { __typename?: 'Mutation', updateContact: { __typename?: 'Contact', id: string, email?: string | null, name?: string | null, firstName?: string | null, lastName?: string | null, company?: string | null, phone?: string | null, notes?: string | null, emails: Array<{ __typename?: 'ContactEmail', id: string, email: string, isPrimary: boolean, label?: string | null }> } };

export type DeleteContactMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteContactMutation = { __typename?: 'Mutation', deleteContact: boolean };

export type GetEmailsQueryVariables = Exact<{
  input: GetEmailsInput;
}>;


export type GetEmailsQuery = { __typename?: 'Query', getEmails: Array<{ __typename?: 'Email', id: string, messageId: string, folder: EmailFolder, fromAddress: string, fromName?: string | null, toAddresses: Array<string>, ccAddresses?: Array<string> | null, bccAddresses?: Array<string> | null, subject: string, textBody?: string | null, htmlBody?: string | null, receivedAt: string, isRead: boolean, isStarred: boolean, emailAccountId: string, inReplyTo?: string | null, threadId?: string | null, threadCount?: number | null }> };

export type GetEmailsByThreadQueryVariables = Exact<{
  threadId: Scalars['String']['input'];
}>;


export type GetEmailsByThreadQuery = { __typename?: 'Query', getEmailsByThread: Array<{ __typename?: 'Email', id: string, messageId: string, folder: EmailFolder, fromAddress: string, fromName?: string | null, toAddresses: Array<string>, ccAddresses?: Array<string> | null, bccAddresses?: Array<string> | null, subject: string, textBody?: string | null, htmlBody?: string | null, receivedAt: string, isRead: boolean, isStarred: boolean, emailAccountId: string, inReplyTo?: string | null, threadId?: string | null }> };

export type GetEmailQueryVariables = Exact<{
  input: GetEmailInput;
}>;


export type GetEmailQuery = { __typename?: 'Query', getEmail?: { __typename?: 'Email', id: string, emailAccountId: string, messageId: string, folder: EmailFolder, fromAddress: string, fromName?: string | null, toAddresses: Array<string>, ccAddresses?: Array<string> | null, subject: string, textBody?: string | null, htmlBody?: string | null, receivedAt: string, isRead: boolean, isStarred: boolean, inReplyTo?: string | null, references?: Array<string> | null, threadId?: string | null, threadCount?: number | null, headers?: Record<string, unknown> | null, isUnsubscribed: boolean, unsubscribeUrl?: string | null, unsubscribeEmail?: string | null } | null };

export type GetEmailCountQueryVariables = Exact<{
  input: GetEmailsInput;
}>;


export type GetEmailCountQuery = { __typename?: 'Query', getEmailCount: number };

export type GetStarredEmailsQueryVariables = Exact<{
  input: GetEmailsInput;
}>;


export type GetStarredEmailsQuery = { __typename?: 'Query', getEmails: Array<{ __typename?: 'Email', id: string, messageId: string, folder: EmailFolder, fromAddress: string, fromName?: string | null, toAddresses: Array<string>, subject: string, textBody?: string | null, receivedAt: string, isRead: boolean, isStarred: boolean, emailAccountId: string }> };

export type GetEmailAccountsForInboxQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmailAccountsForInboxQuery = { __typename?: 'Query', getEmailAccounts: Array<{ __typename?: 'EmailAccount', id: string, name: string, email: string, host: string, lastSyncedAt?: string | null, providerId?: string | null }> };

export type SyncAllAccountsMutationVariables = Exact<{ [key: string]: never; }>;


export type SyncAllAccountsMutation = { __typename?: 'Mutation', syncAllAccounts: boolean };

export type UnsubscribeMutationVariables = Exact<{
  input: UnsubscribeInput;
}>;


export type UnsubscribeMutation = { __typename?: 'Mutation', unsubscribe: { __typename?: 'Email', id: string, isUnsubscribed: boolean } };

export type CreateContactFromEmailMutationVariables = Exact<{
  emailId: Scalars['String']['input'];
}>;


export type CreateContactFromEmailMutation = { __typename?: 'Mutation', createContactFromEmail: { __typename?: 'Contact', id: string, email?: string | null, name?: string | null } };

export type BulkUpdateEmailsMutationVariables = Exact<{
  input: BulkUpdateEmailsInput;
}>;


export type BulkUpdateEmailsMutation = { __typename?: 'Mutation', bulkUpdateEmails: Array<{ __typename?: 'Email', id: string, isRead: boolean, isStarred: boolean, folder: EmailFolder }> };

export type BulkDeleteEmailsMutationVariables = Exact<{
  ids: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type BulkDeleteEmailsMutation = { __typename?: 'Mutation', bulkDeleteEmails: number };

export type ForwardEmailMutationVariables = Exact<{
  input: ForwardEmailInput;
}>;


export type ForwardEmailMutation = { __typename?: 'Mutation', forwardEmail: { __typename?: 'Email', id: string, messageId: string, subject: string } };

export type NukeOldEmailsMutationVariables = Exact<{
  input: NukeOldEmailsInput;
}>;


export type NukeOldEmailsMutation = { __typename?: 'Mutation', nukeOldEmails: number };

export type GetEmailAccountsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmailAccountsQuery = { __typename?: 'Query', getEmailAccounts: Array<{ __typename?: 'EmailAccount', id: string, name: string, email: string, host: string, port: number, accountType: EmailAccountType, useSsl: boolean, lastSyncedAt?: string | null, isSyncing: boolean, syncProgress?: number | null, syncStatus?: string | null, defaultSmtpProfileId?: string | null, providerId?: string | null, defaultSmtpProfile?: { __typename?: 'SmtpProfile', id: string, name: string, email: string } | null }> };

export type CreateEmailAccountMutationVariables = Exact<{
  input: CreateEmailAccountInput;
}>;


export type CreateEmailAccountMutation = { __typename?: 'Mutation', createEmailAccount: { __typename?: 'EmailAccount', id: string, name: string, email: string } };

export type DeleteEmailAccountMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteEmailAccountMutation = { __typename?: 'Mutation', deleteEmailAccount: boolean };

export type SyncEmailAccountMutationVariables = Exact<{
  input: SyncEmailAccountInput;
}>;


export type SyncEmailAccountMutation = { __typename?: 'Mutation', syncEmailAccount: boolean };

export type SyncAllAccountsSettingsMutationVariables = Exact<{ [key: string]: never; }>;


export type SyncAllAccountsSettingsMutation = { __typename?: 'Mutation', syncAllAccounts: boolean };

export type GetSmtpProfilesFullQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSmtpProfilesFullQuery = { __typename?: 'Query', getSmtpProfiles: Array<{ __typename?: 'SmtpProfile', id: string, name: string, email: string, alias?: string | null, host: string, port: number, useSsl: boolean, isDefault: boolean, providerId?: string | null }> };

export type CreateSmtpProfileMutationVariables = Exact<{
  input: CreateSmtpProfileInput;
}>;


export type CreateSmtpProfileMutation = { __typename?: 'Mutation', createSmtpProfile: { __typename?: 'SmtpProfile', id: string, name: string, email: string } };

export type DeleteSmtpProfileMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteSmtpProfileMutation = { __typename?: 'Mutation', deleteSmtpProfile: boolean };

export type TestEmailAccountConnectionMutationVariables = Exact<{
  input: TestEmailAccountConnectionInput;
}>;


export type TestEmailAccountConnectionMutation = { __typename?: 'Mutation', testEmailAccountConnection: { __typename?: 'TestConnectionResult', success: boolean, message: string } };

export type TestSmtpConnectionMutationVariables = Exact<{
  input: TestSmtpConnectionInput;
}>;


export type TestSmtpConnectionMutation = { __typename?: 'Mutation', testSmtpConnection: { __typename?: 'TestConnectionResult', success: boolean, message: string } };

export type UpdateEmailAccountMutationVariables = Exact<{
  input: UpdateEmailAccountInput;
}>;


export type UpdateEmailAccountMutation = { __typename?: 'Mutation', updateEmailAccount: { __typename?: 'EmailAccount', id: string, name: string, email: string, host: string, port: number, useSsl: boolean, defaultSmtpProfileId?: string | null } };

export type UpdateSmtpProfileMutationVariables = Exact<{
  input: UpdateSmtpProfileInput;
}>;


export type UpdateSmtpProfileMutation = { __typename?: 'Mutation', updateSmtpProfile: { __typename?: 'SmtpProfile', id: string, name: string, email: string, alias?: string | null, host: string, port: number, useSsl: boolean, isDefault: boolean } };

export type GetAuthenticationMethodsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAuthenticationMethodsQuery = { __typename?: 'Query', getAuthenticationMethods: Array<{ __typename?: 'AuthenticationMethod', id: string, provider: AuthProvider, email: string, displayName?: string | null, lastUsedAt?: string | null, createdAt?: string | null }> };

export type DeleteAuthenticationMethodMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteAuthenticationMethodMutation = { __typename?: 'Mutation', deleteAuthenticationMethod: boolean };


export const GetContactsForModalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContactsForModal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContacts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"company"}}]}}]}}]} as unknown as DocumentNode<GetContactsForModalQuery, GetContactsForModalQueryVariables>;
export const CreateContactFromModalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContactFromModal"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateContactInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}}]}}]} as unknown as DocumentNode<CreateContactFromModalMutation, CreateContactFromModalMutationVariables>;
export const UpdateContactFromModalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateContactFromModal"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateContactInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateContactFromModalMutation, UpdateContactFromModalMutationVariables>;
export const AddEmailToContactDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddEmailToContact"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddEmailToContactInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addEmailToContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}}]}}]} as unknown as DocumentNode<AddEmailToContactMutation, AddEmailToContactMutationVariables>;
export const SearchContactsForChipInputDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchContactsForChipInput"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchContacts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}}]}}]} as unknown as DocumentNode<SearchContactsForChipInputQuery, SearchContactsForChipInputQueryVariables>;
export const SearchContactByEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchContactByEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchContacts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<SearchContactByEmailQuery, SearchContactByEmailQueryVariables>;
export const FetchProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FetchProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fetchProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]} as unknown as DocumentNode<FetchProfileQuery, FetchProfileQueryVariables>;
export const GetSmtpProfilesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSmtpProfiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSmtpProfiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"alias"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<GetSmtpProfilesQuery, GetSmtpProfilesQueryVariables>;
export const GetEmailAccountsForComposeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmailAccountsForCompose"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmailAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"defaultSmtpProfileId"}}]}}]}}]} as unknown as DocumentNode<GetEmailAccountsForComposeQuery, GetEmailAccountsForComposeQueryVariables>;
export const SendEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ComposeEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}}]}}]}}]} as unknown as DocumentNode<SendEmailMutation, SendEmailMutationVariables>;
export const SaveDraftDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveDraft"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SaveDraftInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveDraft"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}}]}}]}}]} as unknown as DocumentNode<SaveDraftMutation, SaveDraftMutationVariables>;
export const GetContactsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContacts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContacts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"isAutoCreated"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<GetContactsQuery, GetContactsQueryVariables>;
export const SearchContactsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchContacts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchContacts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]} as unknown as DocumentNode<SearchContactsQuery, SearchContactsQueryVariables>;
export const CreateContactDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContact"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateContactInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateContactMutation, CreateContactMutationVariables>;
export const UpdateContactDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateContact"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateContactInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<UpdateContactMutation, UpdateContactMutationVariables>;
export const DeleteContactDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteContact"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteContactMutation, DeleteContactMutationVariables>;
export const GetEmailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"fromAddress"}},{"kind":"Field","name":{"kind":"Name","value":"fromName"}},{"kind":"Field","name":{"kind":"Name","value":"toAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"ccAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"bccAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"textBody"}},{"kind":"Field","name":{"kind":"Name","value":"htmlBody"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isStarred"}},{"kind":"Field","name":{"kind":"Name","value":"emailAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"inReplyTo"}},{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"threadCount"}}]}}]}}]} as unknown as DocumentNode<GetEmailsQuery, GetEmailsQueryVariables>;
export const GetEmailsByThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmailsByThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmailsByThread"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"threadId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"fromAddress"}},{"kind":"Field","name":{"kind":"Name","value":"fromName"}},{"kind":"Field","name":{"kind":"Name","value":"toAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"ccAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"bccAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"textBody"}},{"kind":"Field","name":{"kind":"Name","value":"htmlBody"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isStarred"}},{"kind":"Field","name":{"kind":"Name","value":"emailAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"inReplyTo"}},{"kind":"Field","name":{"kind":"Name","value":"threadId"}}]}}]}}]} as unknown as DocumentNode<GetEmailsByThreadQuery, GetEmailsByThreadQueryVariables>;
export const GetEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"emailAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"fromAddress"}},{"kind":"Field","name":{"kind":"Name","value":"fromName"}},{"kind":"Field","name":{"kind":"Name","value":"toAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"ccAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"textBody"}},{"kind":"Field","name":{"kind":"Name","value":"htmlBody"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isStarred"}},{"kind":"Field","name":{"kind":"Name","value":"inReplyTo"}},{"kind":"Field","name":{"kind":"Name","value":"references"}},{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"threadCount"}},{"kind":"Field","name":{"kind":"Name","value":"headers"}},{"kind":"Field","name":{"kind":"Name","value":"isUnsubscribed"}},{"kind":"Field","name":{"kind":"Name","value":"unsubscribeUrl"}},{"kind":"Field","name":{"kind":"Name","value":"unsubscribeEmail"}}]}}]}}]} as unknown as DocumentNode<GetEmailQuery, GetEmailQueryVariables>;
export const GetEmailCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmailCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmailCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<GetEmailCountQuery, GetEmailCountQueryVariables>;
export const GetStarredEmailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStarredEmails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"fromAddress"}},{"kind":"Field","name":{"kind":"Name","value":"fromName"}},{"kind":"Field","name":{"kind":"Name","value":"toAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"textBody"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isStarred"}},{"kind":"Field","name":{"kind":"Name","value":"emailAccountId"}}]}}]}}]} as unknown as DocumentNode<GetStarredEmailsQuery, GetStarredEmailsQueryVariables>;
export const GetEmailAccountsForInboxDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmailAccountsForInbox"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmailAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncedAt"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]}}]} as unknown as DocumentNode<GetEmailAccountsForInboxQuery, GetEmailAccountsForInboxQueryVariables>;
export const SyncAllAccountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SyncAllAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncAllAccounts"}}]}}]} as unknown as DocumentNode<SyncAllAccountsMutation, SyncAllAccountsMutationVariables>;
export const UnsubscribeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Unsubscribe"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnsubscribeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unsubscribe"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isUnsubscribed"}}]}}]}}]} as unknown as DocumentNode<UnsubscribeMutation, UnsubscribeMutationVariables>;
export const CreateContactFromEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContactFromEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"emailId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContactFromEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"emailId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"emailId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateContactFromEmailMutation, CreateContactFromEmailMutationVariables>;
export const BulkUpdateEmailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkUpdateEmails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BulkUpdateEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkUpdateEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isStarred"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}}]}}]}}]} as unknown as DocumentNode<BulkUpdateEmailsMutation, BulkUpdateEmailsMutationVariables>;
export const BulkDeleteEmailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkDeleteEmails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkDeleteEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<BulkDeleteEmailsMutation, BulkDeleteEmailsMutationVariables>;
export const ForwardEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ForwardEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ForwardEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"forwardEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}}]}}]}}]} as unknown as DocumentNode<ForwardEmailMutation, ForwardEmailMutationVariables>;
export const NukeOldEmailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"NukeOldEmails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NukeOldEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nukeOldEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<NukeOldEmailsMutation, NukeOldEmailsMutationVariables>;
export const GetEmailAccountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmailAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmailAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"port"}},{"kind":"Field","name":{"kind":"Name","value":"accountType"}},{"kind":"Field","name":{"kind":"Name","value":"useSsl"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isSyncing"}},{"kind":"Field","name":{"kind":"Name","value":"syncProgress"}},{"kind":"Field","name":{"kind":"Name","value":"syncStatus"}},{"kind":"Field","name":{"kind":"Name","value":"defaultSmtpProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"defaultSmtpProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]}}]} as unknown as DocumentNode<GetEmailAccountsQuery, GetEmailAccountsQueryVariables>;
export const CreateEmailAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmailAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmailAccountInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmailAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<CreateEmailAccountMutation, CreateEmailAccountMutationVariables>;
export const DeleteEmailAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteEmailAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEmailAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteEmailAccountMutation, DeleteEmailAccountMutationVariables>;
export const SyncEmailAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SyncEmailAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SyncEmailAccountInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncEmailAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<SyncEmailAccountMutation, SyncEmailAccountMutationVariables>;
export const SyncAllAccountsSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SyncAllAccountsSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncAllAccounts"}}]}}]} as unknown as DocumentNode<SyncAllAccountsSettingsMutation, SyncAllAccountsSettingsMutationVariables>;
export const GetSmtpProfilesFullDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSmtpProfilesFull"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSmtpProfiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"alias"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"port"}},{"kind":"Field","name":{"kind":"Name","value":"useSsl"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]}}]} as unknown as DocumentNode<GetSmtpProfilesFullQuery, GetSmtpProfilesFullQueryVariables>;
export const CreateSmtpProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSmtpProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSmtpProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSmtpProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<CreateSmtpProfileMutation, CreateSmtpProfileMutationVariables>;
export const DeleteSmtpProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSmtpProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSmtpProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteSmtpProfileMutation, DeleteSmtpProfileMutationVariables>;
export const TestEmailAccountConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestEmailAccountConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestEmailAccountConnectionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testEmailAccountConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<TestEmailAccountConnectionMutation, TestEmailAccountConnectionMutationVariables>;
export const TestSmtpConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestSmtpConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestSmtpConnectionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testSmtpConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<TestSmtpConnectionMutation, TestSmtpConnectionMutationVariables>;
export const UpdateEmailAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEmailAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEmailAccountInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEmailAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"port"}},{"kind":"Field","name":{"kind":"Name","value":"useSsl"}},{"kind":"Field","name":{"kind":"Name","value":"defaultSmtpProfileId"}}]}}]}}]} as unknown as DocumentNode<UpdateEmailAccountMutation, UpdateEmailAccountMutationVariables>;
export const UpdateSmtpProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSmtpProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSmtpProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSmtpProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"alias"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"port"}},{"kind":"Field","name":{"kind":"Name","value":"useSsl"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<UpdateSmtpProfileMutation, UpdateSmtpProfileMutationVariables>;
export const GetAuthenticationMethodsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAuthenticationMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAuthenticationMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<GetAuthenticationMethodsQuery, GetAuthenticationMethodsQueryVariables>;
export const DeleteAuthenticationMethodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAuthenticationMethod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAuthenticationMethod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAuthenticationMethodMutation, DeleteAuthenticationMethodMutationVariables>;