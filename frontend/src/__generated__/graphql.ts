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
  /** Custom scalar for date/time values. Serializes to ISO 8601 string format. */
  Date: { input: string; output: string; }
  /** Custom scalar for arbitrary JSON data. Used for complex nested structures like email headers. */
  JSON: { input: Record<string, unknown>; output: Record<string, unknown>; }
};

/** Input for adding an email address to an existing contact. */
export type AddEmailToContactInput = {
  /** ID of the contact to add the email to */
  contactId: Scalars['String']['input'];
  /** The email address to add */
  email: Scalars['String']['input'];
  /** Whether this should become the primary email */
  isPrimary?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional label for this email */
  label?: InputMaybe<Scalars['String']['input']>;
};

/** Input for adding multiple tags to multiple emails (bulk operation). */
export type AddTagsToEmailsInput = {
  /** List of email IDs to add tags to */
  emailIds: Array<Scalars['String']['input']>;
  /** List of tag IDs to add */
  tagIds: Array<Scalars['String']['input']>;
};

/** A file attachment on an email. */
export type Attachment = BaseEntityProps & {
  __typename?: 'Attachment';
  /** Whether this is an inline or regular attachment */
  attachmentType: AttachmentType;
  /** Content-Disposition header value */
  contentDisposition?: Maybe<Scalars['String']['output']>;
  /** Content-ID for inline attachments (used in HTML src references) */
  contentId?: Maybe<Scalars['String']['output']>;
  /** Timestamp when the attachment was saved */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the email this attachment belongs to */
  emailId: Scalars['String']['output'];
  /** File extension (e.g., "pdf", "png") */
  extension?: Maybe<Scalars['String']['output']>;
  /** Original filename of the attachment */
  filename: Scalars['String']['output'];
  /** Unique identifier for this attachment */
  id: Scalars['String']['output'];
  /** Whether the attachment has been scanned and deemed safe */
  isSafe: Scalars['Boolean']['output'];
  /** MIME type (e.g., "application/pdf", "image/png") */
  mimeType: Scalars['String']['output'];
  /** File size in bytes */
  size: Scalars['Int']['output'];
  /** Storage key for retrieving the file (S3 key or local path) */
  storageKey: Scalars['String']['output'];
  /** Timestamp when the attachment was last updated */
  updatedAt?: Maybe<Scalars['Date']['output']>;
};

/**
 * Input for an attachment when composing/sending an email.
 * Attachment data is provided as base64-encoded string.
 */
export type AttachmentInput = {
  /** Base64-encoded file data */
  data: Scalars['String']['input'];
  /** Filename for the attachment */
  filename: Scalars['String']['input'];
  /** MIME type of the attachment */
  mimeType: Scalars['String']['input'];
  /** File size in bytes (for validation) */
  size: Scalars['Int']['input'];
};

/** Type of email attachment. */
export enum AttachmentType {
  /** Regular file attachment */
  Attachment = 'ATTACHMENT',
  /** Inline attachment (e.g., embedded images in HTML) */
  Inline = 'INLINE'
}

/** Supported authentication providers for user login. */
export enum AuthProvider {
  /** Apple Sign-In */
  Apple = 'APPLE',
  /** Traditional email and password login */
  EmailPassword = 'EMAIL_PASSWORD',
  /** GitHub OAuth login */
  Github = 'GITHUB',
  /** Google OAuth login */
  Google = 'GOOGLE',
  /** Microsoft/Azure AD login */
  Microsoft = 'MICROSOFT'
}

/**
 * Represents a linked authentication method for a user account.
 * Users can have multiple authentication methods (e.g., Google OAuth + email/password).
 */
export type AuthenticationMethod = BaseEntityProps & {
  __typename?: 'AuthenticationMethod';
  /** Timestamp when this auth method was linked */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** Display name from the provider (e.g., "john@gmail.com (Google)") */
  displayName?: Maybe<Scalars['String']['output']>;
  /** Email address associated with this auth provider */
  email: Scalars['String']['output'];
  /** Unique identifier for this authentication method */
  id: Scalars['String']['output'];
  /** Timestamp when this auth method was last used for login */
  lastUsedAt?: Maybe<Scalars['Date']['output']>;
  /** The authentication provider (GOOGLE, EMAIL_PASSWORD, etc.) */
  provider: AuthProvider;
  /** Unique identifier from the provider (e.g., Google user ID) */
  providerUserId: Scalars['String']['output'];
  /** Timestamp when this auth method was last updated */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user this auth method belongs to */
  userId: Scalars['String']['output'];
};

/** Common fields shared by all database entities. */
export type BaseEntityProps = {
  /** Timestamp when the entity was created */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** Unique identifier for the entity (UUID format) */
  id: Scalars['String']['output'];
  /** Timestamp when the entity was last updated */
  updatedAt?: Maybe<Scalars['Date']['output']>;
};

/** Input for bulk updating multiple emails at once. */
export type BulkUpdateEmailsInput = {
  /** Move to folder (null = don't change) */
  folder?: InputMaybe<EmailFolder>;
  /** IDs of emails to update */
  ids: Array<Scalars['String']['input']>;
  /** Set read status (null = don't change) */
  isRead?: InputMaybe<Scalars['Boolean']['input']>;
  /** Set starred status (null = don't change) */
  isStarred?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Input for composing and sending an email. */
export type ComposeEmailInput = {
  /** List of file attachments to include */
  attachments?: InputMaybe<Array<AttachmentInput>>;
  /** Optional list of BCC recipients */
  bccAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Optional list of CC recipients */
  ccAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
  /** ID of draft to convert to sent (draft will be deleted) */
  draftId?: InputMaybe<Scalars['String']['input']>;
  /** ID of the email account to send from */
  emailAccountId: Scalars['String']['input'];
  /** HTML body content */
  htmlBody?: InputMaybe<Scalars['String']['input']>;
  /** Message-ID of email being replied to (for threading) */
  inReplyTo?: InputMaybe<Scalars['String']['input']>;
  /** ID of the SMTP profile to use for sending */
  smtpProfileId: Scalars['String']['input'];
  /** Email subject line */
  subject: Scalars['String']['input'];
  /** Plain text body content */
  textBody?: InputMaybe<Scalars['String']['input']>;
  /** List of To recipient email addresses */
  toAddresses: Array<Scalars['String']['input']>;
};

/**
 * A contact in the user's address book. Contacts can be auto-created from
 * email senders or manually created.
 */
export type Contact = BaseEntityProps & {
  __typename?: 'Contact';
  /** Company or organization */
  company?: Maybe<Scalars['String']['output']>;
  /** Timestamp when the contact was created */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** Primary email address (deprecated - use emails array) */
  email?: Maybe<Scalars['String']['output']>;
  /** List of all email addresses for this contact */
  emails: Array<ContactEmail>;
  /** First name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this contact */
  id: Scalars['String']['output'];
  /** Whether this contact was auto-created from an email sender */
  isAutoCreated: Scalars['Boolean']['output'];
  /** Last name */
  lastName?: Maybe<Scalars['String']['output']>;
  /** Full display name */
  name?: Maybe<Scalars['String']['output']>;
  /** Additional notes about the contact */
  notes?: Maybe<Scalars['String']['output']>;
  /** Phone number */
  phone?: Maybe<Scalars['String']['output']>;
  /** Timestamp when the contact was last updated */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who owns this contact */
  userId: Scalars['String']['output'];
};

/** An email address associated with a contact. A contact can have multiple email addresses. */
export type ContactEmail = BaseEntityProps & {
  __typename?: 'ContactEmail';
  /** ID of the contact this email belongs to */
  contactId: Scalars['String']['output'];
  /** Timestamp when this email was added */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** The email address */
  email: Scalars['String']['output'];
  /** Unique identifier for this email entry */
  id: Scalars['String']['output'];
  /** Whether this is the primary email for the contact */
  isPrimary: Scalars['Boolean']['output'];
  /** Optional label (e.g., "Work", "Personal", "Other") */
  label?: Maybe<Scalars['String']['output']>;
  /** Timestamp when this email was last updated */
  updatedAt?: Maybe<Scalars['Date']['output']>;
};

/** Input for a contact email when creating/updating contacts. */
export type ContactEmailInput = {
  /** The email address */
  email: Scalars['String']['input'];
  /** Whether this should be the primary email */
  isPrimary?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional label for this email */
  label?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating a new contact. */
export type CreateContactInput = {
  /** Company or organization */
  company?: InputMaybe<Scalars['String']['input']>;
  /** List of email addresses for the contact */
  emails: Array<ContactEmailInput>;
  /** First name */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Last name */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** Full display name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Additional notes */
  notes?: InputMaybe<Scalars['String']['input']>;
  /** Phone number */
  phone?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating a new email account. Requires all connection details. */
export type CreateEmailAccountInput = {
  /** Protocol type (IMAP or POP3) */
  accountType: EmailAccountType;
  /** ID of the default SMTP profile for sending */
  defaultSmtpProfileId?: InputMaybe<Scalars['String']['input']>;
  /** Email address */
  email: Scalars['String']['input'];
  /** IMAP/POP3 server hostname */
  host: Scalars['String']['input'];
  /** Whether to set this as the default account */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  /** Display name for the account */
  name: Scalars['String']['input'];
  /** Password or app-specific password for authentication */
  password: Scalars['String']['input'];
  /** Server port number */
  port: Scalars['Int']['input'];
  /** External provider ID for OAuth-linked accounts */
  providerId?: InputMaybe<Scalars['String']['input']>;
  /** Whether to use SSL/TLS */
  useSsl: Scalars['Boolean']['input'];
  /** Username for authentication (often the email address) */
  username: Scalars['String']['input'];
};

/** Input for creating a new mail rule. */
export type CreateMailRuleInput = {
  /** Actions to perform on matches */
  actions: RuleActionsInput;
  /** Conditions for matching emails */
  conditions: RuleConditionsInput;
  /** Optional description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Optional: Restrict to a specific email account */
  emailAccountId?: InputMaybe<Scalars['String']['input']>;
  /** Whether the rule is enabled (default: true) */
  isEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** Display name for the rule */
  name: Scalars['String']['input'];
  /** Processing priority (default: 0) */
  priority?: InputMaybe<Scalars['Int']['input']>;
  /** Stop processing after match (default: false) */
  stopProcessing?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Input for creating a new SMTP profile. */
export type CreateSmtpProfileInput = {
  /** Optional display name alias */
  alias?: InputMaybe<Scalars['String']['input']>;
  /** The "from" email address */
  email: Scalars['String']['input'];
  /** SMTP server hostname */
  host: Scalars['String']['input'];
  /** Whether to set as default profile */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  /** Display name for the profile */
  name: Scalars['String']['input'];
  /** Password for SMTP authentication */
  password: Scalars['String']['input'];
  /** SMTP server port */
  port: Scalars['Int']['input'];
  /** External provider ID */
  providerId?: InputMaybe<Scalars['String']['input']>;
  /** Whether to use SSL/TLS */
  useSsl: Scalars['Boolean']['input'];
  /** Username for SMTP authentication */
  username: Scalars['String']['input'];
};

/** Input for creating a new tag. */
export type CreateTagInput = {
  /** Color hex code (defaults to a random color if not provided) */
  color?: InputMaybe<Scalars['String']['input']>;
  /** Optional description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Display name for the tag */
  name: Scalars['String']['input'];
};

/** An email message. Can be received, sent, or a draft. */
export type Email = BaseEntityProps & {
  __typename?: 'Email';
  /** Number of attachments */
  attachmentCount: Scalars['Int']['output'];
  /** List of file attachments */
  attachments: Array<Attachment>;
  /** List of "BCC" recipient email addresses (only for sent emails) */
  bccAddresses?: Maybe<Array<Scalars['String']['output']>>;
  /** List of "CC" recipient email addresses */
  ccAddresses?: Maybe<Array<Scalars['String']['output']>>;
  /** Timestamp when the email was stored locally */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** The email account object */
  emailAccount?: Maybe<EmailAccount>;
  /** ID of the email account this email belongs to */
  emailAccountId: Scalars['String']['output'];
  /** Which folder this email is in (INBOX, SENT, DRAFTS, etc.) */
  folder: EmailFolder;
  /** Sender's email address */
  fromAddress: Scalars['String']['output'];
  /** Sender's display name */
  fromName?: Maybe<Scalars['String']['output']>;
  /** Quick check if email has any attachments */
  hasAttachments: Scalars['Boolean']['output'];
  /** Raw email headers as JSON (for debugging) */
  headers?: Maybe<Scalars['JSON']['output']>;
  /** HTML body content */
  htmlBody?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this email */
  id: Scalars['String']['output'];
  /** Message-ID of the email this is replying to */
  inReplyTo?: Maybe<Scalars['String']['output']>;
  /** Whether this is an unsent draft */
  isDraft: Scalars['Boolean']['output'];
  /** Whether the email has been read */
  isRead: Scalars['Boolean']['output'];
  /** Whether the email is starred/flagged */
  isStarred: Scalars['Boolean']['output'];
  /** Whether the user has unsubscribed from this sender */
  isUnsubscribed: Scalars['Boolean']['output'];
  /** Unique message ID from the email headers (RFC 5322 Message-ID) */
  messageId: Scalars['String']['output'];
  /** When the email was received (from email headers) */
  receivedAt: Scalars['Date']['output'];
  /** List of Message-IDs in the email thread */
  references?: Maybe<Array<Scalars['String']['output']>>;
  /** The SMTP profile used to send this email */
  smtpProfile?: Maybe<SmtpProfile>;
  /** ID of the SMTP profile used to send (for sent emails) */
  smtpProfileId?: Maybe<Scalars['String']['output']>;
  /** Email subject line */
  subject: Scalars['String']['output'];
  /** Tags/labels applied to this email */
  tags: Array<Tag>;
  /** Plain text body content */
  textBody?: Maybe<Scalars['String']['output']>;
  /** Number of emails in this thread */
  threadCount?: Maybe<Scalars['Int']['output']>;
  /** Thread identifier for grouping related emails */
  threadId?: Maybe<Scalars['String']['output']>;
  /** List of "To" recipient email addresses */
  toAddresses: Array<Scalars['String']['output']>;
  /** List-Unsubscribe email address if available */
  unsubscribeEmail?: Maybe<Scalars['String']['output']>;
  /** List-Unsubscribe URL if available */
  unsubscribeUrl?: Maybe<Scalars['String']['output']>;
  /** Timestamp when the email was last modified locally */
  updatedAt?: Maybe<Scalars['Date']['output']>;
};

/**
 * An email account configured for receiving emails via IMAP or POP3.
 * Each user can have multiple email accounts from different providers.
 */
export type EmailAccount = BaseEntityProps & {
  __typename?: 'EmailAccount';
  /** Protocol type (IMAP or POP3) */
  accountType: EmailAccountType;
  /** Timestamp when the account was added */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** The default SMTP profile object for sending emails */
  defaultSmtpProfile?: Maybe<SmtpProfile>;
  /** ID of the default SMTP profile for sending from this account */
  defaultSmtpProfileId?: Maybe<Scalars['String']['output']>;
  /** Email address for this account */
  email: Scalars['String']['output'];
  /** IMAP/POP3 server hostname (e.g., "imap.gmail.com") */
  host: Scalars['String']['output'];
  /** Unique identifier for this email account */
  id: Scalars['String']['output'];
  /** Whether this is the user's default/primary email account */
  isDefault: Scalars['Boolean']['output'];
  /** Whether a sync operation is currently in progress */
  isSyncing: Scalars['Boolean']['output'];
  /** Timestamp of the last successful sync */
  lastSyncedAt?: Maybe<Scalars['Date']['output']>;
  /** Display name for this account (e.g., "Work Gmail") */
  name: Scalars['String']['output'];
  /** Server port number (e.g., 993 for IMAP with SSL) */
  port: Scalars['Int']['output'];
  /** External provider ID (for OAuth-linked accounts like Google Workspace) */
  providerId?: Maybe<Scalars['String']['output']>;
  /** When the current sync operation will timeout */
  syncExpiresAt?: Maybe<Scalars['Date']['output']>;
  /** Progress percentage (0-100) during sync */
  syncProgress?: Maybe<Scalars['Int']['output']>;
  /** Human-readable status message during sync */
  syncStatus?: Maybe<Scalars['String']['output']>;
  /** Timestamp when the account was last modified */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** Whether to use SSL/TLS encryption */
  useSsl: Scalars['Boolean']['output'];
  /** ID of the user who owns this account */
  userId: Scalars['String']['output'];
};

/** Type of email receiving protocol. */
export enum EmailAccountType {
  /** IMAP protocol - supports folder sync and IDLE for real-time updates */
  Imap = 'IMAP',
  /** POP3 protocol - download-and-delete model */
  Pop3 = 'POP3'
}

/** Email folder categories. Maps to standard IMAP folder semantics. */
export enum EmailFolder {
  /** Archived emails (removed from inbox but kept) */
  Archive = 'ARCHIVE',
  /** Unsent email drafts */
  Drafts = 'DRAFTS',
  /** Primary inbox for incoming emails */
  Inbox = 'INBOX',
  /** Emails sent by the user */
  Sent = 'SENT',
  /** Emails marked as spam/junk */
  Spam = 'SPAM',
  /** Deleted emails (soft delete) */
  Trash = 'TRASH'
}

/**
 * Aggregated information about a unique email sender.
 * Used for inbox triage and identifying frequent senders.
 */
export type EmailSource = {
  __typename?: 'EmailSource';
  /** Number of emails received from this sender */
  count: Scalars['Int']['output'];
  /** Email address of the sender */
  fromAddress: Scalars['String']['output'];
  /** Display name of the sender (if available) */
  fromName?: Maybe<Scalars['String']['output']>;
};

/** Input for forwarding an email. */
export type ForwardEmailInput = {
  /** Optional text to add before forwarded content */
  additionalText?: InputMaybe<Scalars['String']['input']>;
  /** Optional BCC recipients */
  bccAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Optional CC recipients */
  ccAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Email account to send from */
  emailAccountId: Scalars['String']['input'];
  /** ID of the email to forward */
  emailId: Scalars['String']['input'];
  /** Whether to include original attachments (default: true) */
  includeAttachments?: InputMaybe<Scalars['Boolean']['input']>;
  /** SMTP profile to use for sending */
  smtpProfileId: Scalars['String']['input'];
  /** To recipient addresses */
  toAddresses: Array<Scalars['String']['input']>;
};

/** Input for fetching a single email by ID. */
export type GetEmailInput = {
  /** ID of the email to fetch */
  id: Scalars['String']['input'];
};

/** Input for querying emails with filters. */
export type GetEmailsInput = {
  /** Advanced filter: BCC address contains */
  bccContains?: InputMaybe<Scalars['String']['input']>;
  /** Advanced filter: body contains */
  bodyContains?: InputMaybe<Scalars['String']['input']>;
  /** Advanced filter: CC address contains */
  ccContains?: InputMaybe<Scalars['String']['input']>;
  /** Filter by email account ID (null = all accounts) */
  emailAccountId?: InputMaybe<Scalars['String']['input']>;
  /** Filter by folder (null = depends on includeAllFolders) */
  folder?: InputMaybe<EmailFolder>;
  /** Advanced filter: sender contains */
  fromContains?: InputMaybe<Scalars['String']['input']>;
  /** If true, search across all folders; if false, defaults to INBOX */
  includeAllFolders?: InputMaybe<Scalars['Boolean']['input']>;
  /** Filter by read status (null = all) */
  isRead?: InputMaybe<Scalars['Boolean']['input']>;
  /** Filter by starred status (null = all) */
  isStarred?: InputMaybe<Scalars['Boolean']['input']>;
  /** Maximum number of emails to return (default: 50) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of emails to skip for pagination */
  offset?: InputMaybe<Scalars['Int']['input']>;
  /** Full-text search query across subject and body */
  searchQuery?: InputMaybe<Scalars['String']['input']>;
  /** Advanced filter: subject contains */
  subjectContains?: InputMaybe<Scalars['String']['input']>;
  /** Filter by applied tag IDs (emails must have ALL specified tags) */
  tagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Advanced filter: To address contains */
  toContains?: InputMaybe<Scalars['String']['input']>;
};

/**
 * An automated mail rule that applies actions to matching emails.
 * Rules are processed in priority order when new emails arrive.
 */
export type MailRule = BaseEntityProps & {
  __typename?: 'MailRule';
  /** Actions to perform on matching emails */
  actions: RuleActions;
  /** Conditions that emails must match */
  conditions: RuleConditions;
  /** Timestamp when the rule was created */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** Optional description of what this rule does */
  description?: Maybe<Scalars['String']['output']>;
  /** The email account this rule applies to */
  emailAccount?: Maybe<EmailAccount>;
  /** Optional: Apply only to emails from this account (null = all accounts) */
  emailAccountId?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this rule */
  id: Scalars['String']['output'];
  /** Whether this rule is currently active */
  isEnabled: Scalars['Boolean']['output'];
  /** Display name for the rule */
  name: Scalars['String']['output'];
  /** Processing priority (lower numbers run first) */
  priority: Scalars['Int']['output'];
  /** If true, stop processing further rules after this one matches */
  stopProcessing: Scalars['Boolean']['output'];
  /** Timestamp when the rule was last updated */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who owns this rule */
  userId: Scalars['String']['output'];
};

/** Real-time mailbox update event. */
export type MailboxUpdate = {
  __typename?: 'MailboxUpdate';
  /** ID of the email account that was updated */
  emailAccountId: Scalars['String']['output'];
  /** New or updated emails (for NEW_EMAILS, EMAIL_UPDATED events) */
  emails?: Maybe<Array<Email>>;
  /** Human-readable message describing the update */
  message?: Maybe<Scalars['String']['output']>;
  /** Type of update that occurred */
  type: MailboxUpdateType;
};

/** Types of mailbox update events. */
export enum MailboxUpdateType {
  /** IMAP IDLE connection was closed (client should reconnect) */
  ConnectionClosed = 'CONNECTION_CLOSED',
  /** IMAP IDLE connection was established */
  ConnectionEstablished = 'CONNECTION_ESTABLISHED',
  /** An email was deleted from the server */
  EmailDeleted = 'EMAIL_DELETED',
  /** An existing email was updated (flags changed, etc.) */
  EmailUpdated = 'EMAIL_UPDATED',
  /** An error occurred */
  Error = 'ERROR',
  /** New emails have arrived */
  NewEmails = 'NEW_EMAILS',
  /** Email sync has completed */
  SyncCompleted = 'SYNC_COMPLETED',
  /** Email sync has started */
  SyncStarted = 'SYNC_STARTED'
}

/** GraphQL mutations for modifying data. All mutations require authentication. */
export type Mutation = {
  __typename?: 'Mutation';
  /** Add an email address to an existing contact. */
  addEmailToContact: Contact;
  /**
   * Add tags to multiple emails (bulk operation).
   * Returns the updated emails.
   */
  addTagsToEmails: Array<Email>;
  /**
   * Permanently delete multiple emails.
   * Returns the number of emails deleted.
   */
  bulkDeleteEmails: Scalars['Int']['output'];
  /**
   * Update multiple emails at once (read status, starred, folder).
   * Returns the updated emails.
   */
  bulkUpdateEmails: Array<Email>;
  /** Create a new contact. */
  createContact: Contact;
  /**
   * Create a contact from an email sender.
   * Extracts name and email from the fromAddress/fromName fields.
   */
  createContactFromEmail: Contact;
  /**
   * Create a new email account (IMAP/POP3).
   * Credentials are securely stored in AWS Secrets Manager (production)
   * or a local file (development).
   */
  createEmailAccount: EmailAccount;
  /** Create a new mail rule. */
  createMailRule: MailRule;
  /** Create a new SMTP profile for sending emails. */
  createSmtpProfile: SmtpProfile;
  /** Create a new tag. */
  createTag: Tag;
  /**
   * Delete an authentication method (unlink OAuth provider).
   * Cannot delete the last remaining auth method.
   */
  deleteAuthenticationMethod: Scalars['Boolean']['output'];
  /** Delete a contact. */
  deleteContact: Scalars['Boolean']['output'];
  /**
   * Delete an email account and all associated emails.
   * This is a permanent, irreversible operation.
   */
  deleteEmailAccount: Scalars['Boolean']['output'];
  /** Delete a mail rule. */
  deleteMailRule: Scalars['Boolean']['output'];
  /**
   * Delete an SMTP profile.
   * Cannot delete a profile that is set as default for an email account.
   */
  deleteSmtpProfile: Scalars['Boolean']['output'];
  /**
   * Delete a tag.
   * Removes the tag from all emails but does not delete the emails.
   */
  deleteTag: Scalars['Boolean']['output'];
  /**
   * Forward an email to new recipients.
   * Optionally includes original attachments.
   */
  forwardEmail: Email;
  /**
   * Bulk delete old emails for inbox zero.
   * Permanently deletes emails older than the specified date.
   */
  nukeOldEmails: Scalars['Int']['output'];
  /**
   * Remove tags from multiple emails (bulk operation).
   * Returns the updated emails.
   */
  removeTagsFromEmails: Array<Email>;
  /**
   * Run a mail rule against existing emails.
   * Applies the rule's actions to all matching emails.
   * Returns counts of matched and processed emails.
   */
  runMailRule: RunRuleResult;
  /**
   * Save an email draft.
   * If id is provided, updates an existing draft; otherwise creates a new one.
   */
  saveDraft: Email;
  /**
   * Send an email via SMTP.
   * Stores a copy in the Sent folder and handles attachments.
   */
  sendEmail: Email;
  /**
   * Sync all email accounts for the current user.
   * Triggers parallel sync for each account.
   */
  syncAllAccounts: Scalars['Boolean']['output'];
  /**
   * Trigger a sync of an email account.
   * Downloads new emails from the IMAP/POP3 server.
   */
  syncEmailAccount: Scalars['Boolean']['output'];
  /**
   * Test an IMAP/POP3 connection before saving.
   * Returns success/failure with an error message if applicable.
   */
  testEmailAccountConnection: TestConnectionResult;
  /**
   * Test an SMTP connection before saving.
   * Returns success/failure with an error message if applicable.
   */
  testSmtpConnection: TestConnectionResult;
  /**
   * Unsubscribe from a sender's mailing list.
   * Uses List-Unsubscribe header if available.
   */
  unsubscribe: Email;
  /** Update an existing contact. */
  updateContact: Contact;
  /**
   * Update an existing email account.
   * If password is provided, the stored credentials are also updated.
   */
  updateEmailAccount: EmailAccount;
  /** Update an existing mail rule. */
  updateMailRule: MailRule;
  /** Update an existing SMTP profile. */
  updateSmtpProfile: SmtpProfile;
  /** Update an existing tag. */
  updateTag: Tag;
  /** Update the user's theme preference (LIGHT, DARK, or AUTO). */
  updateThemePreference: User;
  /**
   * Update multiple user preferences at once.
   * Only provided fields will be updated.
   */
  updateUserPreferences: User;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationAddEmailToContactArgs = {
  input: AddEmailToContactInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationAddTagsToEmailsArgs = {
  input: AddTagsToEmailsInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationBulkDeleteEmailsArgs = {
  ids: Array<Scalars['String']['input']>;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationBulkUpdateEmailsArgs = {
  input: BulkUpdateEmailsInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationCreateContactArgs = {
  input: CreateContactInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationCreateContactFromEmailArgs = {
  emailId: Scalars['String']['input'];
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationCreateEmailAccountArgs = {
  input: CreateEmailAccountInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationCreateMailRuleArgs = {
  input: CreateMailRuleInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationCreateSmtpProfileArgs = {
  input: CreateSmtpProfileInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationCreateTagArgs = {
  input: CreateTagInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationDeleteAuthenticationMethodArgs = {
  id: Scalars['String']['input'];
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationDeleteContactArgs = {
  id: Scalars['String']['input'];
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationDeleteEmailAccountArgs = {
  id: Scalars['String']['input'];
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationDeleteMailRuleArgs = {
  id: Scalars['String']['input'];
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationDeleteSmtpProfileArgs = {
  id: Scalars['String']['input'];
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationDeleteTagArgs = {
  id: Scalars['String']['input'];
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationForwardEmailArgs = {
  input: ForwardEmailInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationNukeOldEmailsArgs = {
  input: NukeOldEmailsInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationRemoveTagsFromEmailsArgs = {
  input: RemoveTagsFromEmailsInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationRunMailRuleArgs = {
  id: Scalars['String']['input'];
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationSaveDraftArgs = {
  input: SaveDraftInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationSendEmailArgs = {
  input: ComposeEmailInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationSyncEmailAccountArgs = {
  input: SyncEmailAccountInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationTestEmailAccountConnectionArgs = {
  input: TestEmailAccountConnectionInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationTestSmtpConnectionArgs = {
  input: TestSmtpConnectionInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationUnsubscribeArgs = {
  input: UnsubscribeInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationUpdateContactArgs = {
  input: UpdateContactInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationUpdateEmailAccountArgs = {
  input: UpdateEmailAccountInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationUpdateMailRuleArgs = {
  input: UpdateMailRuleInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationUpdateSmtpProfileArgs = {
  input: UpdateSmtpProfileInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationUpdateTagArgs = {
  input: UpdateTagInput;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationUpdateThemePreferenceArgs = {
  themePreference: ThemePreference;
};


/** GraphQL mutations for modifying data. All mutations require authentication. */
export type MutationUpdateUserPreferencesArgs = {
  input: UpdateUserPreferencesInput;
};

/** Level of detail shown in email notification previews. */
export enum NotificationDetailLevel {
  /** Show sender, subject, and message preview */
  Full = 'FULL',
  /** Show only sender and subject */
  Minimal = 'MINIMAL'
}

/** Input for bulk deleting old emails. */
export type NukeOldEmailsInput = {
  /** Delete emails older than this date */
  olderThan?: InputMaybe<Scalars['Date']['input']>;
};

/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type Query = {
  __typename?: 'Query';
  /**
   * Fetch the current user's profile. Creates the user record if this is
   * the first login after Supabase signup. Returns null if not authenticated.
   */
  fetchProfile?: Maybe<User>;
  /**
   * Get attachment metadata by ID.
   * Returns null if not found or not accessible.
   */
  getAttachment?: Maybe<Attachment>;
  /**
   * Get a signed download URL for an attachment.
   * In production, returns a presigned S3 URL (valid for 1 hour).
   * In development, returns a local API endpoint.
   */
  getAttachmentDownloadUrl: Scalars['String']['output'];
  /**
   * Get all authentication methods linked to the current user's account.
   * Useful for managing connected OAuth providers.
   */
  getAuthenticationMethods: Array<AuthenticationMethod>;
  /**
   * Get a specific contact by ID.
   * Returns null if not found or not owned by the current user.
   */
  getContact?: Maybe<Contact>;
  /**
   * Get all contacts for the current user.
   * Includes both manually created and auto-created contacts.
   */
  getContacts: Array<Contact>;
  /**
   * Get a single email by ID.
   * Returns null if not found or not accessible by the current user.
   */
  getEmail?: Maybe<Email>;
  /**
   * Get a specific email account by ID.
   * Returns null if not found or not owned by the current user.
   */
  getEmailAccount?: Maybe<EmailAccount>;
  /**
   * Get all email accounts configured for the current user.
   * Ordered by creation date, newest first.
   */
  getEmailAccounts: Array<EmailAccount>;
  /**
   * Get the count of emails matching the specified filters.
   * Useful for pagination and unread counts.
   */
  getEmailCount: Scalars['Int']['output'];
  /**
   * Get emails matching the specified filters.
   * Supports pagination, folder filtering, read/starred status, and full-text search.
   */
  getEmails: Array<Email>;
  /**
   * Get all emails in a specific thread.
   * Returns emails ordered by receivedAt ascending.
   */
  getEmailsByThread: Array<Email>;
  /**
   * Get a specific mail rule by ID.
   * Returns null if not found or not owned by the current user.
   */
  getMailRule?: Maybe<MailRule>;
  /**
   * Get all mail rules for the current user.
   * Ordered by priority (lowest first).
   */
  getMailRules: Array<MailRule>;
  /**
   * Get a specific SMTP profile by ID.
   * Returns null if not found or not owned by the current user.
   */
  getSmtpProfile?: Maybe<SmtpProfile>;
  /**
   * Get all SMTP profiles configured for the current user.
   * Ordered by creation date, newest first.
   */
  getSmtpProfiles: Array<SmtpProfile>;
  /**
   * Get a specific tag by ID.
   * Returns null if not found or not owned by the current user.
   */
  getTag?: Maybe<Tag>;
  /**
   * Get all tags for the current user.
   * Includes email count for each tag.
   */
  getTags: Array<Tag>;
  /**
   * Get the top email senders for inbox triage.
   * Aggregates senders by email count.
   */
  getTopEmailSources: Array<EmailSource>;
  /**
   * Preview how many existing emails would match a rule's conditions.
   * Useful for testing rules before running them.
   */
  previewMailRule: Scalars['Int']['output'];
  /**
   * Search contacts by name or email address.
   * Performs case-insensitive partial matching.
   */
  searchContacts: Array<Contact>;
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryGetAttachmentArgs = {
  id: Scalars['String']['input'];
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryGetAttachmentDownloadUrlArgs = {
  id: Scalars['String']['input'];
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryGetContactArgs = {
  id: Scalars['String']['input'];
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryGetEmailArgs = {
  input: GetEmailInput;
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryGetEmailAccountArgs = {
  id: Scalars['String']['input'];
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryGetEmailCountArgs = {
  input: GetEmailsInput;
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryGetEmailsArgs = {
  input: GetEmailsInput;
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryGetEmailsByThreadArgs = {
  threadId: Scalars['String']['input'];
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryGetMailRuleArgs = {
  id: Scalars['String']['input'];
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryGetSmtpProfileArgs = {
  id: Scalars['String']['input'];
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryGetTagArgs = {
  id: Scalars['String']['input'];
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryGetTopEmailSourcesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QueryPreviewMailRuleArgs = {
  id: Scalars['String']['input'];
};


/**
 * GraphQL queries for fetching data. All queries require authentication
 * unless otherwise noted.
 */
export type QuerySearchContactsArgs = {
  query: Scalars['String']['input'];
};

/** Input for removing multiple tags from multiple emails (bulk operation). */
export type RemoveTagsFromEmailsInput = {
  /** List of email IDs to remove tags from */
  emailIds: Array<Scalars['String']['input']>;
  /** List of tag IDs to remove */
  tagIds: Array<Scalars['String']['input']>;
};

/**
 * Actions to perform when a mail rule matches an email.
 * Multiple actions can be combined.
 */
export type RuleActions = {
  __typename?: 'RuleActions';
  /** IDs of tags to add to the email */
  addTagIds?: Maybe<Array<Scalars['String']['output']>>;
  /** Move the email to Archive folder */
  archive?: Maybe<Scalars['Boolean']['output']>;
  /** Move the email to Trash */
  delete?: Maybe<Scalars['Boolean']['output']>;
  /** Email address to forward the message to */
  forwardTo?: Maybe<Scalars['String']['output']>;
  /** Mark the email as read */
  markRead?: Maybe<Scalars['Boolean']['output']>;
  /** Star/flag the email */
  star?: Maybe<Scalars['Boolean']['output']>;
};

/** Input for rule actions when creating/updating a rule. */
export type RuleActionsInput = {
  /** Tag IDs to add */
  addTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Move to Archive */
  archive?: InputMaybe<Scalars['Boolean']['input']>;
  /** Move to Trash */
  delete?: InputMaybe<Scalars['Boolean']['input']>;
  /** Email to forward to */
  forwardTo?: InputMaybe<Scalars['String']['input']>;
  /** Mark as read */
  markRead?: InputMaybe<Scalars['Boolean']['input']>;
  /** Star the email */
  star?: InputMaybe<Scalars['Boolean']['input']>;
};

/**
 * Conditions for matching emails in a mail rule.
 * All conditions are optional - only non-null conditions are evaluated.
 * Multiple conditions are combined with AND logic.
 */
export type RuleConditions = {
  __typename?: 'RuleConditions';
  /** Match if any BCC address contains this substring */
  bccContains?: Maybe<Scalars['String']['output']>;
  /** Match if body (text or HTML) contains this substring */
  bodyContains?: Maybe<Scalars['String']['output']>;
  /** Match if any CC address contains this substring */
  ccContains?: Maybe<Scalars['String']['output']>;
  /** Match if sender address contains this substring (case-insensitive) */
  fromContains?: Maybe<Scalars['String']['output']>;
  /** Match if subject contains this substring (case-insensitive) */
  subjectContains?: Maybe<Scalars['String']['output']>;
  /** Match if any To address contains this substring */
  toContains?: Maybe<Scalars['String']['output']>;
};

/** Input for rule conditions when creating/updating a rule. */
export type RuleConditionsInput = {
  /** Match if any BCC address contains this substring */
  bccContains?: InputMaybe<Scalars['String']['input']>;
  /** Match if body contains this substring */
  bodyContains?: InputMaybe<Scalars['String']['input']>;
  /** Match if any CC address contains this substring */
  ccContains?: InputMaybe<Scalars['String']['input']>;
  /** Match if sender address contains this substring */
  fromContains?: InputMaybe<Scalars['String']['input']>;
  /** Match if subject contains this substring */
  subjectContains?: InputMaybe<Scalars['String']['input']>;
  /** Match if any To address contains this substring */
  toContains?: InputMaybe<Scalars['String']['input']>;
};

/** Result of running a mail rule against existing emails. */
export type RunRuleResult = {
  __typename?: 'RunRuleResult';
  /** Number of emails that matched the rule conditions */
  matchedCount: Scalars['Int']['output'];
  /** Number of emails that were successfully processed */
  processedCount: Scalars['Int']['output'];
};

/** Input for saving an email draft. */
export type SaveDraftInput = {
  /** Attachments for the draft */
  attachments?: InputMaybe<Array<AttachmentInput>>;
  /** BCC recipient addresses */
  bccAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
  /** CC recipient addresses */
  ccAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Email account this draft belongs to */
  emailAccountId: Scalars['String']['input'];
  /** HTML body */
  htmlBody?: InputMaybe<Scalars['String']['input']>;
  /** ID of existing draft to update (null = create new draft) */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Message-ID of email being replied to */
  inReplyTo?: InputMaybe<Scalars['String']['input']>;
  /** SMTP profile for sending (optional for drafts) */
  smtpProfileId?: InputMaybe<Scalars['String']['input']>;
  /** Email subject */
  subject?: InputMaybe<Scalars['String']['input']>;
  /** Plain text body */
  textBody?: InputMaybe<Scalars['String']['input']>;
  /** To recipient addresses */
  toAddresses?: InputMaybe<Array<Scalars['String']['input']>>;
};

/**
 * An SMTP profile for sending emails. Each email account can have a default SMTP profile,
 * or users can select a different profile when composing.
 */
export type SmtpProfile = BaseEntityProps & {
  __typename?: 'SmtpProfile';
  /** Optional display name alias (e.g., "John Doe" instead of just the email) */
  alias?: Maybe<Scalars['String']['output']>;
  /** Timestamp when the profile was created */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** The "from" email address for sent emails */
  email: Scalars['String']['output'];
  /** SMTP server hostname (e.g., "smtp.gmail.com") */
  host: Scalars['String']['output'];
  /** Unique identifier for this SMTP profile */
  id: Scalars['String']['output'];
  /** Whether this is the user's default SMTP profile */
  isDefault: Scalars['Boolean']['output'];
  /** Display name for this profile (e.g., "Personal Gmail SMTP") */
  name: Scalars['String']['output'];
  /** SMTP server port (e.g., 587 for TLS, 465 for SSL) */
  port: Scalars['Int']['output'];
  /** External provider ID for OAuth-linked profiles */
  providerId?: Maybe<Scalars['String']['output']>;
  /** Timestamp when the profile was last updated */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** Whether to use SSL/TLS encryption */
  useSsl: Scalars['Boolean']['output'];
  /** ID of the user who owns this profile */
  userId: Scalars['String']['output'];
};

/**
 * GraphQL subscriptions for real-time updates.
 * Requires WebSocket connection with authentication.
 */
export type Subscription = {
  __typename?: 'Subscription';
  /**
   * Subscribe to mailbox updates for all of the user's email accounts.
   * Uses IMAP IDLE to listen for new emails in real-time.
   *
   * Important: The connection will automatically close after approximately
   * 4.5 minutes due to IMAP IDLE timeout. Clients should reconnect when
   * they receive a CONNECTION_CLOSED event.
   *
   * Events include:
   * - NEW_EMAILS: New messages arrived
   * - EMAIL_UPDATED: Email flags changed
   * - SYNC_STARTED/COMPLETED: Sync operation status
   * - CONNECTION_ESTABLISHED/CLOSED: Connection lifecycle
   * - ERROR: Error occurred (check message field)
   */
  mailboxUpdates: MailboxUpdate;
};

/** Input for triggering a sync of a specific email account. */
export type SyncEmailAccountInput = {
  /** ID of the email account to sync */
  emailAccountId: Scalars['String']['input'];
};

/**
 * A tag/label that can be applied to emails for organization.
 * Similar to Gmail labels or folder categories.
 */
export type Tag = BaseEntityProps & {
  __typename?: 'Tag';
  /** Color hex code for the tag (e.g., "#FF5733") */
  color: Scalars['String']['output'];
  /** Timestamp when the tag was created */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** Optional description of what this tag is for */
  description?: Maybe<Scalars['String']['output']>;
  /** Number of emails with this tag applied */
  emailCount: Scalars['Int']['output'];
  /** Unique identifier for this tag */
  id: Scalars['String']['output'];
  /** Display name for the tag */
  name: Scalars['String']['output'];
  /** Timestamp when the tag was last updated */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user who owns this tag */
  userId: Scalars['String']['output'];
};

/** Result of testing an email account or SMTP connection. */
export type TestConnectionResult = {
  __typename?: 'TestConnectionResult';
  /** Human-readable message describing the result or error */
  message: Scalars['String']['output'];
  /** Whether the connection was successful */
  success: Scalars['Boolean']['output'];
};

/** Input for testing an IMAP/POP3 connection before saving. */
export type TestEmailAccountConnectionInput = {
  /** Protocol type (IMAP or POP3) */
  accountType: EmailAccountType;
  /** Server hostname */
  host: Scalars['String']['input'];
  /** Password for authentication */
  password: Scalars['String']['input'];
  /** Server port */
  port: Scalars['Int']['input'];
  /** Whether to use SSL/TLS */
  useSsl: Scalars['Boolean']['input'];
  /** Username for authentication */
  username: Scalars['String']['input'];
};

/** Input for testing an SMTP connection before saving. */
export type TestSmtpConnectionInput = {
  /** SMTP server hostname */
  host: Scalars['String']['input'];
  /** Password for authentication */
  password: Scalars['String']['input'];
  /** SMTP server port */
  port: Scalars['Int']['input'];
  /** Whether to use SSL/TLS */
  useSsl: Scalars['Boolean']['input'];
  /** Username for authentication */
  username: Scalars['String']['input'];
};

/** User's preferred color scheme for the application interface. */
export enum ThemePreference {
  /** Follow system/browser preference */
  Auto = 'AUTO',
  /** Dark color scheme */
  Dark = 'DARK',
  /** Light color scheme */
  Light = 'LIGHT'
}

/** Input for unsubscribing from a sender's mailing list. */
export type UnsubscribeInput = {
  /** ID of the email to unsubscribe from */
  emailId: Scalars['String']['input'];
};

/** Input for updating an existing contact. Only provided fields will be updated. */
export type UpdateContactInput = {
  /** Updated company */
  company?: InputMaybe<Scalars['String']['input']>;
  /** Updated list of email addresses */
  emails?: InputMaybe<Array<ContactEmailInput>>;
  /** Updated first name */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** ID of the contact to update */
  id: Scalars['String']['input'];
  /** Updated last name */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** Updated full name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Updated notes */
  notes?: InputMaybe<Scalars['String']['input']>;
  /** Updated phone */
  phone?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating an existing email account. Only provided fields will be updated. */
export type UpdateEmailAccountInput = {
  /** New default SMTP profile ID */
  defaultSmtpProfileId?: InputMaybe<Scalars['String']['input']>;
  /** New server hostname */
  host?: InputMaybe<Scalars['String']['input']>;
  /** ID of the email account to update */
  id: Scalars['String']['input'];
  /** Whether this should be the default account */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  /** New display name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** New password */
  password?: InputMaybe<Scalars['String']['input']>;
  /** New server port */
  port?: InputMaybe<Scalars['Int']['input']>;
  /** New provider ID */
  providerId?: InputMaybe<Scalars['String']['input']>;
  /** Whether to use SSL/TLS */
  useSsl?: InputMaybe<Scalars['Boolean']['input']>;
  /** New username */
  username?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating an existing mail rule. Only provided fields will be updated. */
export type UpdateMailRuleInput = {
  /** Updated actions */
  actions?: InputMaybe<RuleActionsInput>;
  /** Updated conditions */
  conditions?: InputMaybe<RuleConditionsInput>;
  /** New description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** New email account restriction */
  emailAccountId?: InputMaybe<Scalars['String']['input']>;
  /** ID of the rule to update */
  id: Scalars['String']['input'];
  /** Whether the rule is enabled */
  isEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  /** New display name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** New priority */
  priority?: InputMaybe<Scalars['Int']['input']>;
  /** Whether to stop processing after match */
  stopProcessing?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Input for updating an existing SMTP profile. Only provided fields will be updated. */
export type UpdateSmtpProfileInput = {
  /** New display name alias */
  alias?: InputMaybe<Scalars['String']['input']>;
  /** New server hostname */
  host?: InputMaybe<Scalars['String']['input']>;
  /** ID of the SMTP profile to update */
  id: Scalars['String']['input'];
  /** Whether this should be the default profile */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  /** New display name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** New password */
  password?: InputMaybe<Scalars['String']['input']>;
  /** New server port */
  port?: InputMaybe<Scalars['Int']['input']>;
  /** New provider ID */
  providerId?: InputMaybe<Scalars['String']['input']>;
  /** Whether to use SSL/TLS */
  useSsl?: InputMaybe<Scalars['Boolean']['input']>;
  /** New username */
  username?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating an existing tag. Only provided fields will be updated. */
export type UpdateTagInput = {
  /** New color hex code */
  color?: InputMaybe<Scalars['String']['input']>;
  /** New description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** ID of the tag to update */
  id: Scalars['String']['input'];
  /** New display name */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating user preferences. All fields are optional - only provided fields will be updated. */
export type UpdateUserPreferencesInput = {
  /** Whether to use compact inbox display */
  inboxDensity?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether to group emails by date */
  inboxGroupByDate?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether to collapse the navigation sidebar */
  navbarCollapsed?: InputMaybe<Scalars['Boolean']['input']>;
  /** New notification detail level */
  notificationDetailLevel?: InputMaybe<NotificationDetailLevel>;
  /** New theme preference */
  themePreference?: InputMaybe<ThemePreference>;
};

/**
 * A registered user of the email client application.
 * Contains user profile information, preferences, and related entities.
 */
export type User = BaseEntityProps & {
  __typename?: 'User';
  /** List of authentication methods linked to this account (OAuth, email/password) */
  authenticationMethods: Array<AuthenticationMethod>;
  /** Timestamp when the user account was created */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** User's primary email address (used for login) */
  email: Scalars['String']['output'];
  /** List of email accounts configured for this user (IMAP/POP3) */
  emailAccounts: Array<EmailAccount>;
  /** User's first name */
  firstName: Scalars['String']['output'];
  /** Unique identifier for the user (UUID format) */
  id: Scalars['String']['output'];
  /** Whether to use compact/dense inbox display mode */
  inboxDensity: Scalars['Boolean']['output'];
  /** Whether to group emails by date in the inbox view */
  inboxGroupByDate: Scalars['Boolean']['output'];
  /** User's last name */
  lastName: Scalars['String']['output'];
  /** Whether the navigation sidebar is collapsed */
  navbarCollapsed: Scalars['Boolean']['output'];
  /** Level of detail in notification previews */
  notificationDetailLevel: NotificationDetailLevel;
  /** List of SMTP profiles configured for sending emails */
  smtpProfiles: Array<SmtpProfile>;
  /** User's preferred color scheme (LIGHT, DARK, or AUTO) */
  themePreference: ThemePreference;
  /** Timestamp when the user account was last updated */
  updatedAt?: Maybe<Scalars['Date']['output']>;
};

export type GetAttachmentDownloadUrlQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetAttachmentDownloadUrlQuery = { __typename?: 'Query', getAttachmentDownloadUrl: string };

export type UpdateThemePreferenceMutationVariables = Exact<{
  themePreference: ThemePreference;
}>;


export type UpdateThemePreferenceMutation = { __typename?: 'Mutation', updateThemePreference: { __typename?: 'User', id: string, themePreference: ThemePreference } };

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


export type SearchContactsForChipInputQuery = { __typename?: 'Query', searchContacts: Array<{ __typename?: 'Contact', id: string, email?: string | null, name?: string | null, firstName?: string | null, lastName?: string | null, company?: string | null, phone?: string | null, emails: Array<{ __typename?: 'ContactEmail', id: string, email: string, isPrimary: boolean, label?: string | null }> }> };

export type SearchContactByEmailQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchContactByEmailQuery = { __typename?: 'Query', searchContacts: Array<{ __typename?: 'Contact', id: string, email?: string | null, name?: string | null, firstName?: string | null, lastName?: string | null, company?: string | null, phone?: string | null, notes?: string | null }> };

export type MailboxUpdatesSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type MailboxUpdatesSubscription = { __typename?: 'Subscription', mailboxUpdates: { __typename?: 'MailboxUpdate', type: MailboxUpdateType, emailAccountId: string, message?: string | null, emails?: Array<{ __typename?: 'Email', id: string, messageId: string, folder: EmailFolder, fromAddress: string, fromName?: string | null, subject: string, textBody?: string | null, receivedAt: string, isRead: boolean, isStarred: boolean, emailAccountId: string, toAddresses: Array<string>, ccAddresses?: Array<string> | null, bccAddresses?: Array<string> | null, threadId?: string | null, threadCount?: number | null, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> }> | null } };

export type FetchProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type FetchProfileQuery = { __typename?: 'Query', fetchProfile?: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, themePreference: ThemePreference, navbarCollapsed: boolean, notificationDetailLevel: NotificationDetailLevel, inboxDensity: boolean, inboxGroupByDate: boolean } | null };

export type UpdateUserPreferencesMutationVariables = Exact<{
  input: UpdateUserPreferencesInput;
}>;


export type UpdateUserPreferencesMutation = { __typename?: 'Mutation', updateUserPreferences: { __typename?: 'User', id: string, themePreference: ThemePreference, navbarCollapsed: boolean, notificationDetailLevel: NotificationDetailLevel, inboxDensity: boolean, inboxGroupByDate: boolean } };

export type GetSmtpProfilesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSmtpProfilesQuery = { __typename?: 'Query', getSmtpProfiles: Array<{ __typename?: 'SmtpProfile', id: string, name: string, email: string, alias?: string | null, isDefault: boolean }> };

export type GetEmailAccountsForComposeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmailAccountsForComposeQuery = { __typename?: 'Query', getEmailAccounts: Array<{ __typename?: 'EmailAccount', id: string, name: string, email: string, defaultSmtpProfileId?: string | null, isDefault: boolean }> };

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


export type GetEmailsQuery = { __typename?: 'Query', getEmails: Array<{ __typename?: 'Email', id: string, messageId: string, folder: EmailFolder, fromAddress: string, fromName?: string | null, toAddresses: Array<string>, ccAddresses?: Array<string> | null, bccAddresses?: Array<string> | null, subject: string, textBody?: string | null, htmlBody?: string | null, receivedAt: string, isRead: boolean, isStarred: boolean, emailAccountId: string, inReplyTo?: string | null, threadId?: string | null, threadCount?: number | null, hasAttachments: boolean, attachmentCount: number, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> }> };

export type GetEmailsByThreadQueryVariables = Exact<{
  threadId: Scalars['String']['input'];
}>;


export type GetEmailsByThreadQuery = { __typename?: 'Query', getEmailsByThread: Array<{ __typename?: 'Email', id: string, messageId: string, folder: EmailFolder, fromAddress: string, fromName?: string | null, toAddresses: Array<string>, ccAddresses?: Array<string> | null, bccAddresses?: Array<string> | null, subject: string, textBody?: string | null, htmlBody?: string | null, receivedAt: string, isRead: boolean, isStarred: boolean, emailAccountId: string, hasAttachments: boolean, attachmentCount: number, inReplyTo?: string | null, threadId?: string | null, attachments: Array<{ __typename?: 'Attachment', id: string, filename: string, mimeType: string, extension?: string | null, size: number, attachmentType: AttachmentType, contentId?: string | null, isSafe: boolean }> }> };

export type GetEmailQueryVariables = Exact<{
  input: GetEmailInput;
}>;


export type GetEmailQuery = { __typename?: 'Query', getEmail?: { __typename?: 'Email', id: string, emailAccountId: string, messageId: string, folder: EmailFolder, fromAddress: string, fromName?: string | null, toAddresses: Array<string>, ccAddresses?: Array<string> | null, subject: string, textBody?: string | null, htmlBody?: string | null, receivedAt: string, isRead: boolean, isStarred: boolean, inReplyTo?: string | null, references?: Array<string> | null, threadId?: string | null, threadCount?: number | null, headers?: Record<string, unknown> | null, isUnsubscribed: boolean, unsubscribeUrl?: string | null, unsubscribeEmail?: string | null, hasAttachments: boolean, attachmentCount: number, attachments: Array<{ __typename?: 'Attachment', id: string, filename: string, mimeType: string, extension?: string | null, size: number, attachmentType: AttachmentType, contentId?: string | null, isSafe: boolean }>, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> } | null };

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

export type GetTagsForInboxQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTagsForInboxQuery = { __typename?: 'Query', getTags: Array<{ __typename?: 'Tag', id: string, name: string, color: string, emailCount: number }> };

export type AddTagsToEmailsInboxMutationVariables = Exact<{
  input: AddTagsToEmailsInput;
}>;


export type AddTagsToEmailsInboxMutation = { __typename?: 'Mutation', addTagsToEmails: Array<{ __typename?: 'Email', id: string, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> }> };

export type RemoveTagsFromEmailsInboxMutationVariables = Exact<{
  input: RemoveTagsFromEmailsInput;
}>;


export type RemoveTagsFromEmailsInboxMutation = { __typename?: 'Mutation', removeTagsFromEmails: Array<{ __typename?: 'Email', id: string, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> }> };

export type GetEmailAccountsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmailAccountsQuery = { __typename?: 'Query', getEmailAccounts: Array<{ __typename?: 'EmailAccount', id: string, name: string, email: string, host: string, port: number, accountType: EmailAccountType, useSsl: boolean, lastSyncedAt?: string | null, isSyncing: boolean, syncProgress?: number | null, syncStatus?: string | null, defaultSmtpProfileId?: string | null, providerId?: string | null, isDefault: boolean, defaultSmtpProfile?: { __typename?: 'SmtpProfile', id: string, name: string, email: string } | null }> };

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

export type UpdateEmailAccountMutationVariables = Exact<{
  input: UpdateEmailAccountInput;
}>;


export type UpdateEmailAccountMutation = { __typename?: 'Mutation', updateEmailAccount: { __typename?: 'EmailAccount', id: string, name: string, email: string, host: string, port: number, useSsl: boolean, defaultSmtpProfileId?: string | null, isDefault: boolean } };

export type TestEmailAccountConnectionMutationVariables = Exact<{
  input: TestEmailAccountConnectionInput;
}>;


export type TestEmailAccountConnectionMutation = { __typename?: 'Mutation', testEmailAccountConnection: { __typename?: 'TestConnectionResult', success: boolean, message: string } };

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

export type UpdateSmtpProfileMutationVariables = Exact<{
  input: UpdateSmtpProfileInput;
}>;


export type UpdateSmtpProfileMutation = { __typename?: 'Mutation', updateSmtpProfile: { __typename?: 'SmtpProfile', id: string, name: string, email: string, alias?: string | null, host: string, port: number, useSsl: boolean, isDefault: boolean } };

export type TestSmtpConnectionMutationVariables = Exact<{
  input: TestSmtpConnectionInput;
}>;


export type TestSmtpConnectionMutation = { __typename?: 'Mutation', testSmtpConnection: { __typename?: 'TestConnectionResult', success: boolean, message: string } };

export type GetAuthenticationMethodsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAuthenticationMethodsQuery = { __typename?: 'Query', getAuthenticationMethods: Array<{ __typename?: 'AuthenticationMethod', id: string, provider: AuthProvider, email: string, displayName?: string | null, lastUsedAt?: string | null, createdAt?: string | null }> };

export type DeleteAuthenticationMethodMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteAuthenticationMethodMutation = { __typename?: 'Mutation', deleteAuthenticationMethod: boolean };

export type GetTagsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTagsQuery = { __typename?: 'Query', getTags: Array<{ __typename?: 'Tag', id: string, name: string, color: string, description?: string | null, emailCount: number }> };

export type CreateTagMutationVariables = Exact<{
  input: CreateTagInput;
}>;


export type CreateTagMutation = { __typename?: 'Mutation', createTag: { __typename?: 'Tag', id: string, name: string, color: string, description?: string | null, emailCount: number } };

export type UpdateTagMutationVariables = Exact<{
  input: UpdateTagInput;
}>;


export type UpdateTagMutation = { __typename?: 'Mutation', updateTag: { __typename?: 'Tag', id: string, name: string, color: string, description?: string | null, emailCount: number } };

export type DeleteTagMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteTagMutation = { __typename?: 'Mutation', deleteTag: boolean };

export type AddTagsToEmailsMutationVariables = Exact<{
  input: AddTagsToEmailsInput;
}>;


export type AddTagsToEmailsMutation = { __typename?: 'Mutation', addTagsToEmails: Array<{ __typename?: 'Email', id: string, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> }> };

export type RemoveTagsFromEmailsMutationVariables = Exact<{
  input: RemoveTagsFromEmailsInput;
}>;


export type RemoveTagsFromEmailsMutation = { __typename?: 'Mutation', removeTagsFromEmails: Array<{ __typename?: 'Email', id: string, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> }> };

export type GetMailRulesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMailRulesQuery = { __typename?: 'Query', getMailRules: Array<{ __typename?: 'MailRule', id: string, name: string, description?: string | null, emailAccountId?: string | null, isEnabled: boolean, priority: number, stopProcessing: boolean, emailAccount?: { __typename?: 'EmailAccount', id: string, name: string, email: string } | null, conditions: { __typename?: 'RuleConditions', fromContains?: string | null, toContains?: string | null, ccContains?: string | null, bccContains?: string | null, subjectContains?: string | null, bodyContains?: string | null }, actions: { __typename?: 'RuleActions', archive?: boolean | null, star?: boolean | null, delete?: boolean | null, markRead?: boolean | null, addTagIds?: Array<string> | null, forwardTo?: string | null } }> };

export type CreateMailRuleMutationVariables = Exact<{
  input: CreateMailRuleInput;
}>;


export type CreateMailRuleMutation = { __typename?: 'Mutation', createMailRule: { __typename?: 'MailRule', id: string, name: string, description?: string | null, isEnabled: boolean, priority: number } };

export type UpdateMailRuleMutationVariables = Exact<{
  input: UpdateMailRuleInput;
}>;


export type UpdateMailRuleMutation = { __typename?: 'Mutation', updateMailRule: { __typename?: 'MailRule', id: string, name: string, description?: string | null, isEnabled: boolean, priority: number } };

export type DeleteMailRuleMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteMailRuleMutation = { __typename?: 'Mutation', deleteMailRule: boolean };

export type PreviewMailRuleQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type PreviewMailRuleQuery = { __typename?: 'Query', previewMailRule: number };

export type RunMailRuleMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type RunMailRuleMutation = { __typename?: 'Mutation', runMailRule: { __typename?: 'RunRuleResult', matchedCount: number, processedCount: number } };

export type GetTopEmailSourcesQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetTopEmailSourcesQuery = { __typename?: 'Query', getTopEmailSources: Array<{ __typename?: 'EmailSource', fromAddress: string, fromName?: string | null, count: number }> };

export type GetEmailsForTriageQueryVariables = Exact<{
  input: GetEmailsInput;
}>;


export type GetEmailsForTriageQuery = { __typename?: 'Query', getEmails: Array<{ __typename?: 'Email', id: string, messageId: string, folder: EmailFolder, fromAddress: string, fromName?: string | null, toAddresses: Array<string>, subject: string, textBody?: string | null, receivedAt: string, isRead: boolean, isStarred: boolean, emailAccountId: string, tags: Array<{ __typename?: 'Tag', id: string, name: string, color: string }> }> };

export type GetEmailCountForTriageQueryVariables = Exact<{
  input: GetEmailsInput;
}>;


export type GetEmailCountForTriageQuery = { __typename?: 'Query', getEmailCount: number };

export type BulkUpdateEmailsTriageMutationVariables = Exact<{
  input: BulkUpdateEmailsInput;
}>;


export type BulkUpdateEmailsTriageMutation = { __typename?: 'Mutation', bulkUpdateEmails: Array<{ __typename?: 'Email', id: string, isRead: boolean, isStarred: boolean, folder: EmailFolder }> };

export type BulkDeleteEmailsTriageMutationVariables = Exact<{
  ids: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type BulkDeleteEmailsTriageMutation = { __typename?: 'Mutation', bulkDeleteEmails: number };


export const GetAttachmentDownloadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAttachmentDownloadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAttachmentDownloadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<GetAttachmentDownloadUrlQuery, GetAttachmentDownloadUrlQueryVariables>;
export const UpdateThemePreferenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateThemePreference"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"themePreference"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ThemePreference"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateThemePreference"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"themePreference"},"value":{"kind":"Variable","name":{"kind":"Name","value":"themePreference"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"themePreference"}}]}}]}}]} as unknown as DocumentNode<UpdateThemePreferenceMutation, UpdateThemePreferenceMutationVariables>;
export const GetContactsForModalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContactsForModal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContacts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"company"}}]}}]}}]} as unknown as DocumentNode<GetContactsForModalQuery, GetContactsForModalQueryVariables>;
export const CreateContactFromModalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContactFromModal"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateContactInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}}]}}]} as unknown as DocumentNode<CreateContactFromModalMutation, CreateContactFromModalMutationVariables>;
export const UpdateContactFromModalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateContactFromModal"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateContactInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateContactFromModalMutation, UpdateContactFromModalMutationVariables>;
export const AddEmailToContactDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddEmailToContact"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddEmailToContactInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addEmailToContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}}]}}]}}]} as unknown as DocumentNode<AddEmailToContactMutation, AddEmailToContactMutationVariables>;
export const SearchContactsForChipInputDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchContactsForChipInput"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchContacts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]} as unknown as DocumentNode<SearchContactsForChipInputQuery, SearchContactsForChipInputQueryVariables>;
export const SearchContactByEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchContactByEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchContacts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<SearchContactByEmailQuery, SearchContactByEmailQueryVariables>;
export const MailboxUpdatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"MailboxUpdates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mailboxUpdates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"emailAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"fromAddress"}},{"kind":"Field","name":{"kind":"Name","value":"fromName"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"textBody"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isStarred"}},{"kind":"Field","name":{"kind":"Name","value":"emailAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"toAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"ccAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"bccAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"threadCount"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]}}]} as unknown as DocumentNode<MailboxUpdatesSubscription, MailboxUpdatesSubscriptionVariables>;
export const FetchProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FetchProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fetchProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"themePreference"}},{"kind":"Field","name":{"kind":"Name","value":"navbarCollapsed"}},{"kind":"Field","name":{"kind":"Name","value":"notificationDetailLevel"}},{"kind":"Field","name":{"kind":"Name","value":"inboxDensity"}},{"kind":"Field","name":{"kind":"Name","value":"inboxGroupByDate"}}]}}]}}]} as unknown as DocumentNode<FetchProfileQuery, FetchProfileQueryVariables>;
export const UpdateUserPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserPreferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserPreferencesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserPreferences"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"themePreference"}},{"kind":"Field","name":{"kind":"Name","value":"navbarCollapsed"}},{"kind":"Field","name":{"kind":"Name","value":"notificationDetailLevel"}},{"kind":"Field","name":{"kind":"Name","value":"inboxDensity"}},{"kind":"Field","name":{"kind":"Name","value":"inboxGroupByDate"}}]}}]}}]} as unknown as DocumentNode<UpdateUserPreferencesMutation, UpdateUserPreferencesMutationVariables>;
export const GetSmtpProfilesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSmtpProfiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSmtpProfiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"alias"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<GetSmtpProfilesQuery, GetSmtpProfilesQueryVariables>;
export const GetEmailAccountsForComposeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmailAccountsForCompose"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmailAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"defaultSmtpProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<GetEmailAccountsForComposeQuery, GetEmailAccountsForComposeQueryVariables>;
export const SendEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ComposeEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}}]}}]}}]} as unknown as DocumentNode<SendEmailMutation, SendEmailMutationVariables>;
export const SaveDraftDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveDraft"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SaveDraftInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveDraft"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}}]}}]}}]} as unknown as DocumentNode<SaveDraftMutation, SaveDraftMutationVariables>;
export const GetContactsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetContacts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getContacts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"isAutoCreated"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<GetContactsQuery, GetContactsQueryVariables>;
export const SearchContactsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchContacts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchContacts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]} as unknown as DocumentNode<SearchContactsQuery, SearchContactsQueryVariables>;
export const CreateContactDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateContact"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateContactInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateContactMutation, CreateContactMutationVariables>;
export const UpdateContactDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateContact"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateContactInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"company"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}}]}}]}}]} as unknown as DocumentNode<UpdateContactMutation, UpdateContactMutationVariables>;
export const DeleteContactDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteContact"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteContact"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteContactMutation, DeleteContactMutationVariables>;
export const GetEmailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"fromAddress"}},{"kind":"Field","name":{"kind":"Name","value":"fromName"}},{"kind":"Field","name":{"kind":"Name","value":"toAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"ccAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"bccAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"textBody"}},{"kind":"Field","name":{"kind":"Name","value":"htmlBody"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isStarred"}},{"kind":"Field","name":{"kind":"Name","value":"emailAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"inReplyTo"}},{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"threadCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasAttachments"}},{"kind":"Field","name":{"kind":"Name","value":"attachmentCount"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<GetEmailsQuery, GetEmailsQueryVariables>;
export const GetEmailsByThreadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmailsByThread"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmailsByThread"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"threadId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"threadId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"fromAddress"}},{"kind":"Field","name":{"kind":"Name","value":"fromName"}},{"kind":"Field","name":{"kind":"Name","value":"toAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"ccAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"bccAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"textBody"}},{"kind":"Field","name":{"kind":"Name","value":"htmlBody"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isStarred"}},{"kind":"Field","name":{"kind":"Name","value":"emailAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"hasAttachments"}},{"kind":"Field","name":{"kind":"Name","value":"attachmentCount"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"extension"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"attachmentType"}},{"kind":"Field","name":{"kind":"Name","value":"contentId"}},{"kind":"Field","name":{"kind":"Name","value":"isSafe"}}]}},{"kind":"Field","name":{"kind":"Name","value":"inReplyTo"}},{"kind":"Field","name":{"kind":"Name","value":"threadId"}}]}}]}}]} as unknown as DocumentNode<GetEmailsByThreadQuery, GetEmailsByThreadQueryVariables>;
export const GetEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"emailAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"fromAddress"}},{"kind":"Field","name":{"kind":"Name","value":"fromName"}},{"kind":"Field","name":{"kind":"Name","value":"toAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"ccAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"textBody"}},{"kind":"Field","name":{"kind":"Name","value":"htmlBody"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isStarred"}},{"kind":"Field","name":{"kind":"Name","value":"inReplyTo"}},{"kind":"Field","name":{"kind":"Name","value":"references"}},{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"threadCount"}},{"kind":"Field","name":{"kind":"Name","value":"headers"}},{"kind":"Field","name":{"kind":"Name","value":"isUnsubscribed"}},{"kind":"Field","name":{"kind":"Name","value":"unsubscribeUrl"}},{"kind":"Field","name":{"kind":"Name","value":"unsubscribeEmail"}},{"kind":"Field","name":{"kind":"Name","value":"hasAttachments"}},{"kind":"Field","name":{"kind":"Name","value":"attachmentCount"}},{"kind":"Field","name":{"kind":"Name","value":"attachments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"extension"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"attachmentType"}},{"kind":"Field","name":{"kind":"Name","value":"contentId"}},{"kind":"Field","name":{"kind":"Name","value":"isSafe"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<GetEmailQuery, GetEmailQueryVariables>;
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
export const GetTagsForInboxDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTagsForInbox"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"emailCount"}}]}}]}}]} as unknown as DocumentNode<GetTagsForInboxQuery, GetTagsForInboxQueryVariables>;
export const AddTagsToEmailsInboxDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTagsToEmailsInbox"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddTagsToEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addTagsToEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<AddTagsToEmailsInboxMutation, AddTagsToEmailsInboxMutationVariables>;
export const RemoveTagsFromEmailsInboxDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveTagsFromEmailsInbox"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RemoveTagsFromEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeTagsFromEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveTagsFromEmailsInboxMutation, RemoveTagsFromEmailsInboxMutationVariables>;
export const GetEmailAccountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmailAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmailAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"port"}},{"kind":"Field","name":{"kind":"Name","value":"accountType"}},{"kind":"Field","name":{"kind":"Name","value":"useSsl"}},{"kind":"Field","name":{"kind":"Name","value":"lastSyncedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isSyncing"}},{"kind":"Field","name":{"kind":"Name","value":"syncProgress"}},{"kind":"Field","name":{"kind":"Name","value":"syncStatus"}},{"kind":"Field","name":{"kind":"Name","value":"defaultSmtpProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"defaultSmtpProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<GetEmailAccountsQuery, GetEmailAccountsQueryVariables>;
export const CreateEmailAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmailAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmailAccountInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmailAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<CreateEmailAccountMutation, CreateEmailAccountMutationVariables>;
export const DeleteEmailAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteEmailAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEmailAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteEmailAccountMutation, DeleteEmailAccountMutationVariables>;
export const SyncEmailAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SyncEmailAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SyncEmailAccountInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncEmailAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<SyncEmailAccountMutation, SyncEmailAccountMutationVariables>;
export const SyncAllAccountsSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SyncAllAccountsSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncAllAccounts"}}]}}]} as unknown as DocumentNode<SyncAllAccountsSettingsMutation, SyncAllAccountsSettingsMutationVariables>;
export const UpdateEmailAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEmailAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateEmailAccountInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEmailAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"port"}},{"kind":"Field","name":{"kind":"Name","value":"useSsl"}},{"kind":"Field","name":{"kind":"Name","value":"defaultSmtpProfileId"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<UpdateEmailAccountMutation, UpdateEmailAccountMutationVariables>;
export const TestEmailAccountConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestEmailAccountConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestEmailAccountConnectionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testEmailAccountConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<TestEmailAccountConnectionMutation, TestEmailAccountConnectionMutationVariables>;
export const GetSmtpProfilesFullDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSmtpProfilesFull"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSmtpProfiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"alias"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"port"}},{"kind":"Field","name":{"kind":"Name","value":"useSsl"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}},{"kind":"Field","name":{"kind":"Name","value":"providerId"}}]}}]}}]} as unknown as DocumentNode<GetSmtpProfilesFullQuery, GetSmtpProfilesFullQueryVariables>;
export const CreateSmtpProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSmtpProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSmtpProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSmtpProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<CreateSmtpProfileMutation, CreateSmtpProfileMutationVariables>;
export const DeleteSmtpProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSmtpProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSmtpProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteSmtpProfileMutation, DeleteSmtpProfileMutationVariables>;
export const UpdateSmtpProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSmtpProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSmtpProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSmtpProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"alias"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"port"}},{"kind":"Field","name":{"kind":"Name","value":"useSsl"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]}}]} as unknown as DocumentNode<UpdateSmtpProfileMutation, UpdateSmtpProfileMutationVariables>;
export const TestSmtpConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestSmtpConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestSmtpConnectionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testSmtpConnection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<TestSmtpConnectionMutation, TestSmtpConnectionMutationVariables>;
export const GetAuthenticationMethodsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAuthenticationMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAuthenticationMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"lastUsedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<GetAuthenticationMethodsQuery, GetAuthenticationMethodsQueryVariables>;
export const DeleteAuthenticationMethodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAuthenticationMethod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAuthenticationMethod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAuthenticationMethodMutation, DeleteAuthenticationMethodMutationVariables>;
export const GetTagsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"emailCount"}}]}}]}}]} as unknown as DocumentNode<GetTagsQuery, GetTagsQueryVariables>;
export const CreateTagDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTagInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTag"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"emailCount"}}]}}]}}]} as unknown as DocumentNode<CreateTagMutation, CreateTagMutationVariables>;
export const UpdateTagDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTagInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTag"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"emailCount"}}]}}]}}]} as unknown as DocumentNode<UpdateTagMutation, UpdateTagMutationVariables>;
export const DeleteTagDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTag"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTagMutation, DeleteTagMutationVariables>;
export const AddTagsToEmailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTagsToEmails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddTagsToEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addTagsToEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<AddTagsToEmailsMutation, AddTagsToEmailsMutationVariables>;
export const RemoveTagsFromEmailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveTagsFromEmails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RemoveTagsFromEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeTagsFromEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveTagsFromEmailsMutation, RemoveTagsFromEmailsMutationVariables>;
export const GetMailRulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMailRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getMailRules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"emailAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"emailAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conditions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromContains"}},{"kind":"Field","name":{"kind":"Name","value":"toContains"}},{"kind":"Field","name":{"kind":"Name","value":"ccContains"}},{"kind":"Field","name":{"kind":"Name","value":"bccContains"}},{"kind":"Field","name":{"kind":"Name","value":"subjectContains"}},{"kind":"Field","name":{"kind":"Name","value":"bodyContains"}}]}},{"kind":"Field","name":{"kind":"Name","value":"actions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archive"}},{"kind":"Field","name":{"kind":"Name","value":"star"}},{"kind":"Field","name":{"kind":"Name","value":"delete"}},{"kind":"Field","name":{"kind":"Name","value":"markRead"}},{"kind":"Field","name":{"kind":"Name","value":"addTagIds"}},{"kind":"Field","name":{"kind":"Name","value":"forwardTo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"stopProcessing"}}]}}]}}]} as unknown as DocumentNode<GetMailRulesQuery, GetMailRulesQueryVariables>;
export const CreateMailRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMailRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateMailRuleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMailRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}}]}}]}}]} as unknown as DocumentNode<CreateMailRuleMutation, CreateMailRuleMutationVariables>;
export const UpdateMailRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMailRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateMailRuleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMailRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}}]}}]}}]} as unknown as DocumentNode<UpdateMailRuleMutation, UpdateMailRuleMutationVariables>;
export const DeleteMailRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMailRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMailRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteMailRuleMutation, DeleteMailRuleMutationVariables>;
export const PreviewMailRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PreviewMailRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewMailRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<PreviewMailRuleQuery, PreviewMailRuleQueryVariables>;
export const RunMailRuleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RunMailRule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runMailRule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"matchedCount"}},{"kind":"Field","name":{"kind":"Name","value":"processedCount"}}]}}]}}]} as unknown as DocumentNode<RunMailRuleMutation, RunMailRuleMutationVariables>;
export const GetTopEmailSourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTopEmailSources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTopEmailSources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fromAddress"}},{"kind":"Field","name":{"kind":"Name","value":"fromName"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]} as unknown as DocumentNode<GetTopEmailSourcesQuery, GetTopEmailSourcesQueryVariables>;
export const GetEmailsForTriageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmailsForTriage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"messageId"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"fromAddress"}},{"kind":"Field","name":{"kind":"Name","value":"fromName"}},{"kind":"Field","name":{"kind":"Name","value":"toAddresses"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"textBody"}},{"kind":"Field","name":{"kind":"Name","value":"receivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isStarred"}},{"kind":"Field","name":{"kind":"Name","value":"emailAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<GetEmailsForTriageQuery, GetEmailsForTriageQueryVariables>;
export const GetEmailCountForTriageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEmailCountForTriage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEmailCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<GetEmailCountForTriageQuery, GetEmailCountForTriageQueryVariables>;
export const BulkUpdateEmailsTriageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkUpdateEmailsTriage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BulkUpdateEmailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkUpdateEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isRead"}},{"kind":"Field","name":{"kind":"Name","value":"isStarred"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}}]}}]}}]} as unknown as DocumentNode<BulkUpdateEmailsTriageMutation, BulkUpdateEmailsTriageMutationVariables>;
export const BulkDeleteEmailsTriageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkDeleteEmailsTriage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkDeleteEmails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]} as unknown as DocumentNode<BulkDeleteEmailsTriageMutation, BulkDeleteEmailsTriageMutationVariables>;