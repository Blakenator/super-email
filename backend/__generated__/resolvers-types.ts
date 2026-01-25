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
  /** Custom scalar for date/time values. Serializes to ISO 8601 string format. */
  Date: { input: Date; output: Date; }
  /** Custom scalar for arbitrary JSON data. Used for complex nested structures like email headers. */
  JSON: { input: Record<string, unknown>; output: Record<string, unknown>; }
};

/** Account tier for billing. Each tier has an email account limit. */
export enum AccountTier {
  /** Basic tier - 2 email accounts */
  Basic = 'BASIC',
  /** Enterprise tier - unlimited accounts */
  Enterprise = 'ENTERPRISE',
  /** Free tier - 1 email account */
  Free = 'FREE',
  /** Pro tier - 5 email accounts */
  Pro = 'PRO'
}

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

/** Combined billing information including subscription and usage. */
export type BillingInfo = {
  __typename?: 'BillingInfo';
  /** Account usage as a percentage (0-100, 0 for unlimited) */
  accountUsagePercent: Scalars['Float']['output'];
  /** Whether the user has a Stripe customer ID (required for paid plans) */
  hasStripeCustomer: Scalars['Boolean']['output'];
  /** Whether the user has exceeded their account limit */
  isAccountLimitExceeded: Scalars['Boolean']['output'];
  /** Whether the user has exceeded their storage limit */
  isStorageLimitExceeded: Scalars['Boolean']['output'];
  /** Whether Stripe billing is configured on the server */
  isStripeConfigured: Scalars['Boolean']['output'];
  /** Available prices from Stripe for subscription tiers */
  prices: Array<StripePrice>;
  /** Storage usage as a percentage (0-100) */
  storageUsagePercent: Scalars['Float']['output'];
  /** User's subscription details */
  subscription: BillingSubscription;
  /** Current storage usage */
  usage: StorageUsage;
};

/** User's billing subscription information. */
export type BillingSubscription = BaseEntityProps & {
  __typename?: 'BillingSubscription';
  /** Maximum number of email accounts allowed (-1 for unlimited) */
  accountLimit: Scalars['Int']['output'];
  /** Current account tier */
  accountTier: AccountTier;
  /** Whether the subscription will cancel at period end */
  cancelAtPeriodEnd: Scalars['Boolean']['output'];
  /** Timestamp when the subscription was created */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** When the current billing period ends */
  currentPeriodEnd?: Maybe<Scalars['Date']['output']>;
  /** Unique identifier for this subscription */
  id: Scalars['String']['output'];
  /** Whether the subscription is valid for syncing emails */
  isValid: Scalars['Boolean']['output'];
  /** Current subscription status */
  status: BillingSubscriptionStatus;
  /** Storage limit in bytes for the current tier */
  storageLimitBytes: Scalars['Float']['output'];
  /** Current storage tier */
  storageTier: StorageTier;
  /** Timestamp when the subscription was last updated */
  updatedAt?: Maybe<Scalars['Date']['output']>;
  /** ID of the user this subscription belongs to */
  userId: Scalars['String']['output'];
};

/** Status of a billing subscription. */
export enum BillingSubscriptionStatus {
  /** Subscription is active and in good standing */
  Active = 'ACTIVE',
  /** Subscription has been canceled */
  Canceled = 'CANCELED',
  /** Initial payment is incomplete */
  Incomplete = 'INCOMPLETE',
  /** Initial payment expired before completion */
  IncompleteExpired = 'INCOMPLETE_EXPIRED',
  /** Payment is past due but subscription still active */
  PastDue = 'PAST_DUE',
  /** Subscription is paused */
  Paused = 'PAUSED',
  /** Subscription is in trial period */
  Trialing = 'TRIALING',
  /** Payment failed and subscription is unpaid */
  Unpaid = 'UNPAID'
}

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
  /** Timestamp of the last historical sync */
  historicalSyncLastAt?: Maybe<Scalars['Date']['output']>;
  /** Progress percentage (0-100) during historical sync */
  historicalSyncProgress?: Maybe<Scalars['Int']['output']>;
  /** Human-readable status message during historical sync */
  historicalSyncStatus?: Maybe<Scalars['String']['output']>;
  /** IMAP/POP3 server hostname (e.g., "imap.gmail.com") */
  host: Scalars['String']['output'];
  /** Unique identifier for this email account */
  id: Scalars['String']['output'];
  /** Whether this is the user's default/primary email account */
  isDefault: Scalars['Boolean']['output'];
  /** Whether a historical sync (initial import) is in progress */
  isHistoricalSyncing: Scalars['Boolean']['output'];
  /** Whether a sync operation is currently in progress (legacy) */
  isSyncing: Scalars['Boolean']['output'];
  /** Whether an update sync (new emails) is in progress */
  isUpdateSyncing: Scalars['Boolean']['output'];
  /** Timestamp of the last successful sync (legacy, for backwards compatibility) */
  lastSyncedAt?: Maybe<Scalars['Date']['output']>;
  /** Display name for this account (e.g., "Work Gmail") */
  name: Scalars['String']['output'];
  /** Server port number (e.g., 993 for IMAP with SSL) */
  port: Scalars['Int']['output'];
  /** External provider ID (for OAuth-linked accounts like Google Workspace) */
  providerId?: Maybe<Scalars['String']['output']>;
  /** When the current sync operation will timeout (legacy) */
  syncExpiresAt?: Maybe<Scalars['Date']['output']>;
  /** Progress percentage (0-100) during sync (legacy) */
  syncProgress?: Maybe<Scalars['Int']['output']>;
  /** Human-readable status message during sync (legacy) */
  syncStatus?: Maybe<Scalars['String']['output']>;
  /** Timestamp of the last update sync */
  updateSyncLastAt?: Maybe<Scalars['Date']['output']>;
  /** Progress percentage (0-100) during update sync */
  updateSyncProgress?: Maybe<Scalars['Int']['output']>;
  /** Human-readable status message during update sync */
  updateSyncStatus?: Maybe<Scalars['String']['output']>;
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
  /** Filter by attachment status (true = only emails with attachments, false = only emails without attachments, null = all) */
  hasAttachments?: InputMaybe<Scalars['Boolean']['input']>;
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
  /**
   * Create a Stripe Billing Portal session to manage subscription.
   * Returns the URL to redirect the user to.
   * Requires Stripe to be configured on the server.
   */
  createBillingPortalSession: Scalars['String']['output'];
  /**
   * Create a Stripe Checkout session to upgrade subscription.
   * Returns the URL to redirect the user to.
   * Requires Stripe to be configured on the server.
   */
  createCheckoutSession: Scalars['String']['output'];
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
  /** Get all registered push tokens for the current user. */
  getPushTokens: Array<PushToken>;
  /**
   * Bulk delete old emails for inbox zero.
   * Permanently deletes emails older than the specified date.
   */
  nukeOldEmails: Scalars['Int']['output'];
  /**
   * Force refresh the storage usage materialized view.
   * Normally this runs automatically at midnight UTC.
   * Returns true if successful.
   */
  refreshStorageUsage: Scalars['Boolean']['output'];
  /**
   * Register a push notification token for receiving mobile/web push notifications.
   * Creates or updates an existing token for the device.
   */
  registerPushToken: PushTokenResult;
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
   * Unregister a push notification token.
   * Used when logging out or disabling notifications.
   */
  unregisterPushToken: Scalars['Boolean']['output'];
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
export type MutationCreateCheckoutSessionArgs = {
  accountTier: AccountTier;
  storageTier: StorageTier;
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
export type MutationRegisterPushTokenArgs = {
  input: RegisterPushTokenInput;
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
export type MutationUnregisterPushTokenArgs = {
  token: Scalars['String']['input'];
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

/** Platform type for push notification tokens. */
export enum PushPlatform {
  /** Android device (FCM) */
  Android = 'ANDROID',
  /** iOS device (APNS) */
  Ios = 'IOS',
  /** Web browser (Web Push API) */
  Web = 'WEB'
}

/** A registered push notification token for a device. */
export type PushToken = BaseEntityProps & {
  __typename?: 'PushToken';
  /** Timestamp when the token was registered */
  createdAt?: Maybe<Scalars['Date']['output']>;
  /** Optional device name for identification */
  deviceName?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for this push token */
  id: Scalars['String']['output'];
  /** Whether this token is currently active */
  isActive: Scalars['Boolean']['output'];
  /** Last time this token was used to send a notification */
  lastUsedAt?: Maybe<Scalars['Date']['output']>;
  /** Platform type (IOS, ANDROID, WEB) */
  platform: PushPlatform;
  /** The push notification token string */
  token: Scalars['String']['output'];
  /** Timestamp when the token was last updated */
  updatedAt?: Maybe<Scalars['Date']['output']>;
};

/** Result of push token registration. */
export type PushTokenResult = {
  __typename?: 'PushTokenResult';
  /** Human-readable message about the result */
  message: Scalars['String']['output'];
  /** The registered push token (if successful) */
  pushToken?: Maybe<PushToken>;
  /** Whether the operation was successful */
  success: Scalars['Boolean']['output'];
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
   * Get the current user's billing information including subscription and usage.
   * Creates a free tier subscription if one doesn't exist.
   */
  getBillingInfo: BillingInfo;
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
   * Get only the current user's storage usage (cached from materialized view).
   * Returns null if usage hasn't been calculated yet.
   */
  getStorageUsage?: Maybe<StorageUsage>;
  /**
   * Get real-time storage usage (bypasses cache, slower but accurate).
   * Use this before syncing to check current limits.
   */
  getStorageUsageRealtime?: Maybe<StorageUsage>;
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

/** Input for registering a push notification token. */
export type RegisterPushTokenInput = {
  /** Optional device name for identification */
  deviceName?: InputMaybe<Scalars['String']['input']>;
  /** Platform type (IOS, ANDROID, WEB) */
  platform: PushPlatform;
  /** The push notification token from the device */
  token: Scalars['String']['input'];
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

/** Storage tier for billing. Each tier has a storage limit. */
export enum StorageTier {
  /** Basic tier - 10GB storage */
  Basic = 'BASIC',
  /** Enterprise tier - 100GB storage */
  Enterprise = 'ENTERPRISE',
  /** Free tier - 5GB storage */
  Free = 'FREE',
  /** Pro tier - 20GB storage */
  Pro = 'PRO'
}

/** Current storage usage statistics for a user. */
export type StorageUsage = {
  __typename?: 'StorageUsage';
  /** Number of email accounts */
  accountCount: Scalars['Int']['output'];
  /** Total number of attachments */
  attachmentCount: Scalars['Int']['output'];
  /** Total number of emails */
  emailCount: Scalars['Int']['output'];
  /** When the usage was last calculated */
  lastRefreshedAt?: Maybe<Scalars['Date']['output']>;
  /** Total size of attachments in bytes */
  totalAttachmentSizeBytes: Scalars['Float']['output'];
  /** Total size of email bodies in bytes */
  totalBodySizeBytes: Scalars['Float']['output'];
  /** Combined total storage used in bytes */
  totalStorageBytes: Scalars['Float']['output'];
  /** Total storage used in GB (rounded to 0.1) */
  totalStorageGB: Scalars['Float']['output'];
  /** ID of the user */
  userId: Scalars['String']['output'];
};

/** Price information fetched from Stripe for a subscription tier. */
export type StripePrice = {
  __typename?: 'StripePrice';
  /** Currency code (e.g., "usd") */
  currency: Scalars['String']['output'];
  /** Stripe price ID */
  id: Scalars['String']['output'];
  /** Billing interval (e.g., "month", "year") */
  interval: Scalars['String']['output'];
  /** Product name from Stripe */
  name: Scalars['String']['output'];
  /** Tier this price is for (BASIC, PRO, ENTERPRISE) */
  tier: Scalars['String']['output'];
  /** Type of tier (storage or account) */
  type: Scalars['String']['output'];
  /** Price in cents */
  unitAmount: Scalars['Int']['output'];
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
  /** Optional: ID of existing account to use saved password from */
  accountId?: InputMaybe<Scalars['String']['input']>;
  /** Protocol type (IMAP or POP3) */
  accountType: EmailAccountType;
  /** Server hostname */
  host: Scalars['String']['input'];
  /** Password for authentication. Optional when editing - if not provided and accountId is set, uses saved password. */
  password?: InputMaybe<Scalars['String']['input']>;
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
  /** Password for authentication. Optional when editing - if not provided and profileId is set, uses saved password. */
  password?: InputMaybe<Scalars['String']['input']>;
  /** SMTP server port */
  port: Scalars['Int']['input'];
  /** Optional: ID of existing profile to use saved password from */
  profileId?: InputMaybe<Scalars['String']['input']>;
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
  /** Whether to block external images in emails by default */
  blockExternalImages?: InputMaybe<Scalars['Boolean']['input']>;
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
  /** Whether to block external images in emails by default (privacy/security) */
  blockExternalImages: Scalars['Boolean']['output'];
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
    | ( Attachment )
    | ( AuthenticationMethod )
    | ( BillingSubscription )
    | ( Contact )
    | ( ContactEmail )
    | ( Email )
    | ( EmailAccount )
    | ( MailRule )
    | ( PushToken )
    | ( SmtpProfile )
    | ( Tag )
    | ( User )
  ;
}>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AccountTier: AccountTier;
  AddEmailToContactInput: AddEmailToContactInput;
  AddTagsToEmailsInput: AddTagsToEmailsInput;
  Attachment: ResolverTypeWrapper<Attachment>;
  AttachmentInput: AttachmentInput;
  AttachmentType: AttachmentType;
  AuthProvider: AuthProvider;
  AuthenticationMethod: ResolverTypeWrapper<AuthenticationMethod>;
  BaseEntityProps: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['BaseEntityProps']>;
  BillingInfo: ResolverTypeWrapper<BillingInfo>;
  BillingSubscription: ResolverTypeWrapper<BillingSubscription>;
  BillingSubscriptionStatus: BillingSubscriptionStatus;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BulkUpdateEmailsInput: BulkUpdateEmailsInput;
  ComposeEmailInput: ComposeEmailInput;
  Contact: ResolverTypeWrapper<Contact>;
  ContactEmail: ResolverTypeWrapper<ContactEmail>;
  ContactEmailInput: ContactEmailInput;
  CreateContactInput: CreateContactInput;
  CreateEmailAccountInput: CreateEmailAccountInput;
  CreateMailRuleInput: CreateMailRuleInput;
  CreateSmtpProfileInput: CreateSmtpProfileInput;
  CreateTagInput: CreateTagInput;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  Email: ResolverTypeWrapper<Email>;
  EmailAccount: ResolverTypeWrapper<EmailAccount>;
  EmailAccountType: EmailAccountType;
  EmailFolder: EmailFolder;
  EmailSource: ResolverTypeWrapper<EmailSource>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ForwardEmailInput: ForwardEmailInput;
  GetEmailInput: GetEmailInput;
  GetEmailsInput: GetEmailsInput;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  MailRule: ResolverTypeWrapper<MailRule>;
  MailboxUpdate: ResolverTypeWrapper<MailboxUpdate>;
  MailboxUpdateType: MailboxUpdateType;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  NotificationDetailLevel: NotificationDetailLevel;
  NukeOldEmailsInput: NukeOldEmailsInput;
  PushPlatform: PushPlatform;
  PushToken: ResolverTypeWrapper<PushToken>;
  PushTokenResult: ResolverTypeWrapper<PushTokenResult>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RegisterPushTokenInput: RegisterPushTokenInput;
  RemoveTagsFromEmailsInput: RemoveTagsFromEmailsInput;
  RuleActions: ResolverTypeWrapper<RuleActions>;
  RuleActionsInput: RuleActionsInput;
  RuleConditions: ResolverTypeWrapper<RuleConditions>;
  RuleConditionsInput: RuleConditionsInput;
  RunRuleResult: ResolverTypeWrapper<RunRuleResult>;
  SaveDraftInput: SaveDraftInput;
  SmtpProfile: ResolverTypeWrapper<SmtpProfile>;
  StorageTier: StorageTier;
  StorageUsage: ResolverTypeWrapper<StorageUsage>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  StripePrice: ResolverTypeWrapper<StripePrice>;
  Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>;
  SyncEmailAccountInput: SyncEmailAccountInput;
  Tag: ResolverTypeWrapper<Tag>;
  TestConnectionResult: ResolverTypeWrapper<TestConnectionResult>;
  TestEmailAccountConnectionInput: TestEmailAccountConnectionInput;
  TestSmtpConnectionInput: TestSmtpConnectionInput;
  ThemePreference: ThemePreference;
  UnsubscribeInput: UnsubscribeInput;
  UpdateContactInput: UpdateContactInput;
  UpdateEmailAccountInput: UpdateEmailAccountInput;
  UpdateMailRuleInput: UpdateMailRuleInput;
  UpdateSmtpProfileInput: UpdateSmtpProfileInput;
  UpdateTagInput: UpdateTagInput;
  UpdateUserPreferencesInput: UpdateUserPreferencesInput;
  User: ResolverTypeWrapper<User>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AddEmailToContactInput: AddEmailToContactInput;
  AddTagsToEmailsInput: AddTagsToEmailsInput;
  Attachment: Attachment;
  AttachmentInput: AttachmentInput;
  AuthenticationMethod: AuthenticationMethod;
  BaseEntityProps: ResolversInterfaceTypes<ResolversParentTypes>['BaseEntityProps'];
  BillingInfo: BillingInfo;
  BillingSubscription: BillingSubscription;
  Boolean: Scalars['Boolean']['output'];
  BulkUpdateEmailsInput: BulkUpdateEmailsInput;
  ComposeEmailInput: ComposeEmailInput;
  Contact: Contact;
  ContactEmail: ContactEmail;
  ContactEmailInput: ContactEmailInput;
  CreateContactInput: CreateContactInput;
  CreateEmailAccountInput: CreateEmailAccountInput;
  CreateMailRuleInput: CreateMailRuleInput;
  CreateSmtpProfileInput: CreateSmtpProfileInput;
  CreateTagInput: CreateTagInput;
  Date: Scalars['Date']['output'];
  Email: Email;
  EmailAccount: EmailAccount;
  EmailSource: EmailSource;
  Float: Scalars['Float']['output'];
  ForwardEmailInput: ForwardEmailInput;
  GetEmailInput: GetEmailInput;
  GetEmailsInput: GetEmailsInput;
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  MailRule: MailRule;
  MailboxUpdate: MailboxUpdate;
  Mutation: Record<PropertyKey, never>;
  NukeOldEmailsInput: NukeOldEmailsInput;
  PushToken: PushToken;
  PushTokenResult: PushTokenResult;
  Query: Record<PropertyKey, never>;
  RegisterPushTokenInput: RegisterPushTokenInput;
  RemoveTagsFromEmailsInput: RemoveTagsFromEmailsInput;
  RuleActions: RuleActions;
  RuleActionsInput: RuleActionsInput;
  RuleConditions: RuleConditions;
  RuleConditionsInput: RuleConditionsInput;
  RunRuleResult: RunRuleResult;
  SaveDraftInput: SaveDraftInput;
  SmtpProfile: SmtpProfile;
  StorageUsage: StorageUsage;
  String: Scalars['String']['output'];
  StripePrice: StripePrice;
  Subscription: Record<PropertyKey, never>;
  SyncEmailAccountInput: SyncEmailAccountInput;
  Tag: Tag;
  TestConnectionResult: TestConnectionResult;
  TestEmailAccountConnectionInput: TestEmailAccountConnectionInput;
  TestSmtpConnectionInput: TestSmtpConnectionInput;
  UnsubscribeInput: UnsubscribeInput;
  UpdateContactInput: UpdateContactInput;
  UpdateEmailAccountInput: UpdateEmailAccountInput;
  UpdateMailRuleInput: UpdateMailRuleInput;
  UpdateSmtpProfileInput: UpdateSmtpProfileInput;
  UpdateTagInput: UpdateTagInput;
  UpdateUserPreferencesInput: UpdateUserPreferencesInput;
  User: User;
}>;

export type AttachmentResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Attachment'] = ResolversParentTypes['Attachment']> = ResolversObject<{
  attachmentType?: Resolver<ResolversTypes['AttachmentType'], ParentType, ContextType>;
  contentDisposition?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  contentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  emailId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  extension?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  filename?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isSafe?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  mimeType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  size?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  storageKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
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
  __resolveType: TypeResolveFn<'Attachment' | 'AuthenticationMethod' | 'BillingSubscription' | 'Contact' | 'ContactEmail' | 'Email' | 'EmailAccount' | 'MailRule' | 'PushToken' | 'SmtpProfile' | 'Tag' | 'User', ParentType, ContextType>;
}>;

export type BillingInfoResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['BillingInfo'] = ResolversParentTypes['BillingInfo']> = ResolversObject<{
  accountUsagePercent?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  hasStripeCustomer?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isAccountLimitExceeded?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isStorageLimitExceeded?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isStripeConfigured?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  prices?: Resolver<Array<ResolversTypes['StripePrice']>, ParentType, ContextType>;
  storageUsagePercent?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  subscription?: Resolver<ResolversTypes['BillingSubscription'], ParentType, ContextType>;
  usage?: Resolver<ResolversTypes['StorageUsage'], ParentType, ContextType>;
}>;

export type BillingSubscriptionResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['BillingSubscription'] = ResolversParentTypes['BillingSubscription']> = ResolversObject<{
  accountLimit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  accountTier?: Resolver<ResolversTypes['AccountTier'], ParentType, ContextType>;
  cancelAtPeriodEnd?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  currentPeriodEnd?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isValid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['BillingSubscriptionStatus'], ParentType, ContextType>;
  storageLimitBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  storageTier?: Resolver<ResolversTypes['StorageTier'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
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
  attachmentCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  attachments?: Resolver<Array<ResolversTypes['Attachment']>, ParentType, ContextType>;
  bccAddresses?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  ccAddresses?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  emailAccount?: Resolver<Maybe<ResolversTypes['EmailAccount']>, ParentType, ContextType>;
  emailAccountId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  folder?: Resolver<ResolversTypes['EmailFolder'], ParentType, ContextType>;
  fromAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fromName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasAttachments?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
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
  tags?: Resolver<Array<ResolversTypes['Tag']>, ParentType, ContextType>;
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
  historicalSyncLastAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  historicalSyncProgress?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  historicalSyncStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  host?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isDefault?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isHistoricalSyncing?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isSyncing?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isUpdateSyncing?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastSyncedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  port?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  providerId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  syncExpiresAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  syncProgress?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  syncStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updateSyncLastAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  updateSyncProgress?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  updateSyncStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  useSsl?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmailSourceResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['EmailSource'] = ResolversParentTypes['EmailSource']> = ResolversObject<{
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  fromAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fromName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type MailRuleResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['MailRule'] = ResolversParentTypes['MailRule']> = ResolversObject<{
  actions?: Resolver<ResolversTypes['RuleActions'], ParentType, ContextType>;
  conditions?: Resolver<ResolversTypes['RuleConditions'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  emailAccount?: Resolver<Maybe<ResolversTypes['EmailAccount']>, ParentType, ContextType>;
  emailAccountId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stopProcessing?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MailboxUpdateResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['MailboxUpdate'] = ResolversParentTypes['MailboxUpdate']> = ResolversObject<{
  emailAccountId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  emails?: Resolver<Maybe<Array<ResolversTypes['Email']>>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['MailboxUpdateType'], ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  addEmailToContact?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<MutationAddEmailToContactArgs, 'input'>>;
  addTagsToEmails?: Resolver<Array<ResolversTypes['Email']>, ParentType, ContextType, RequireFields<MutationAddTagsToEmailsArgs, 'input'>>;
  bulkDeleteEmails?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationBulkDeleteEmailsArgs, 'ids'>>;
  bulkUpdateEmails?: Resolver<Array<ResolversTypes['Email']>, ParentType, ContextType, RequireFields<MutationBulkUpdateEmailsArgs, 'input'>>;
  createBillingPortalSession?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createCheckoutSession?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationCreateCheckoutSessionArgs, 'accountTier' | 'storageTier'>>;
  createContact?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<MutationCreateContactArgs, 'input'>>;
  createContactFromEmail?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<MutationCreateContactFromEmailArgs, 'emailId'>>;
  createEmailAccount?: Resolver<ResolversTypes['EmailAccount'], ParentType, ContextType, RequireFields<MutationCreateEmailAccountArgs, 'input'>>;
  createMailRule?: Resolver<ResolversTypes['MailRule'], ParentType, ContextType, RequireFields<MutationCreateMailRuleArgs, 'input'>>;
  createSmtpProfile?: Resolver<ResolversTypes['SmtpProfile'], ParentType, ContextType, RequireFields<MutationCreateSmtpProfileArgs, 'input'>>;
  createTag?: Resolver<ResolversTypes['Tag'], ParentType, ContextType, RequireFields<MutationCreateTagArgs, 'input'>>;
  deleteAuthenticationMethod?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteAuthenticationMethodArgs, 'id'>>;
  deleteContact?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteContactArgs, 'id'>>;
  deleteEmailAccount?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteEmailAccountArgs, 'id'>>;
  deleteMailRule?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteMailRuleArgs, 'id'>>;
  deleteSmtpProfile?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteSmtpProfileArgs, 'id'>>;
  deleteTag?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteTagArgs, 'id'>>;
  forwardEmail?: Resolver<ResolversTypes['Email'], ParentType, ContextType, RequireFields<MutationForwardEmailArgs, 'input'>>;
  getPushTokens?: Resolver<Array<ResolversTypes['PushToken']>, ParentType, ContextType>;
  nukeOldEmails?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationNukeOldEmailsArgs, 'input'>>;
  refreshStorageUsage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  registerPushToken?: Resolver<ResolversTypes['PushTokenResult'], ParentType, ContextType, RequireFields<MutationRegisterPushTokenArgs, 'input'>>;
  removeTagsFromEmails?: Resolver<Array<ResolversTypes['Email']>, ParentType, ContextType, RequireFields<MutationRemoveTagsFromEmailsArgs, 'input'>>;
  runMailRule?: Resolver<ResolversTypes['RunRuleResult'], ParentType, ContextType, RequireFields<MutationRunMailRuleArgs, 'id'>>;
  saveDraft?: Resolver<ResolversTypes['Email'], ParentType, ContextType, RequireFields<MutationSaveDraftArgs, 'input'>>;
  sendEmail?: Resolver<ResolversTypes['Email'], ParentType, ContextType, RequireFields<MutationSendEmailArgs, 'input'>>;
  syncAllAccounts?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  syncEmailAccount?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationSyncEmailAccountArgs, 'input'>>;
  testEmailAccountConnection?: Resolver<ResolversTypes['TestConnectionResult'], ParentType, ContextType, RequireFields<MutationTestEmailAccountConnectionArgs, 'input'>>;
  testSmtpConnection?: Resolver<ResolversTypes['TestConnectionResult'], ParentType, ContextType, RequireFields<MutationTestSmtpConnectionArgs, 'input'>>;
  unregisterPushToken?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUnregisterPushTokenArgs, 'token'>>;
  unsubscribe?: Resolver<ResolversTypes['Email'], ParentType, ContextType, RequireFields<MutationUnsubscribeArgs, 'input'>>;
  updateContact?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<MutationUpdateContactArgs, 'input'>>;
  updateEmailAccount?: Resolver<ResolversTypes['EmailAccount'], ParentType, ContextType, RequireFields<MutationUpdateEmailAccountArgs, 'input'>>;
  updateMailRule?: Resolver<ResolversTypes['MailRule'], ParentType, ContextType, RequireFields<MutationUpdateMailRuleArgs, 'input'>>;
  updateSmtpProfile?: Resolver<ResolversTypes['SmtpProfile'], ParentType, ContextType, RequireFields<MutationUpdateSmtpProfileArgs, 'input'>>;
  updateTag?: Resolver<ResolversTypes['Tag'], ParentType, ContextType, RequireFields<MutationUpdateTagArgs, 'input'>>;
  updateThemePreference?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUpdateThemePreferenceArgs, 'themePreference'>>;
  updateUserPreferences?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUpdateUserPreferencesArgs, 'input'>>;
}>;

export type PushTokenResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['PushToken'] = ResolversParentTypes['PushToken']> = ResolversObject<{
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  deviceName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastUsedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  platform?: Resolver<ResolversTypes['PushPlatform'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PushTokenResultResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['PushTokenResult'] = ResolversParentTypes['PushTokenResult']> = ResolversObject<{
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pushToken?: Resolver<Maybe<ResolversTypes['PushToken']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  fetchProfile?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  getAttachment?: Resolver<Maybe<ResolversTypes['Attachment']>, ParentType, ContextType, RequireFields<QueryGetAttachmentArgs, 'id'>>;
  getAttachmentDownloadUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<QueryGetAttachmentDownloadUrlArgs, 'id'>>;
  getAuthenticationMethods?: Resolver<Array<ResolversTypes['AuthenticationMethod']>, ParentType, ContextType>;
  getBillingInfo?: Resolver<ResolversTypes['BillingInfo'], ParentType, ContextType>;
  getContact?: Resolver<Maybe<ResolversTypes['Contact']>, ParentType, ContextType, RequireFields<QueryGetContactArgs, 'id'>>;
  getContacts?: Resolver<Array<ResolversTypes['Contact']>, ParentType, ContextType>;
  getEmail?: Resolver<Maybe<ResolversTypes['Email']>, ParentType, ContextType, RequireFields<QueryGetEmailArgs, 'input'>>;
  getEmailAccount?: Resolver<Maybe<ResolversTypes['EmailAccount']>, ParentType, ContextType, RequireFields<QueryGetEmailAccountArgs, 'id'>>;
  getEmailAccounts?: Resolver<Array<ResolversTypes['EmailAccount']>, ParentType, ContextType>;
  getEmailCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryGetEmailCountArgs, 'input'>>;
  getEmails?: Resolver<Array<ResolversTypes['Email']>, ParentType, ContextType, RequireFields<QueryGetEmailsArgs, 'input'>>;
  getEmailsByThread?: Resolver<Array<ResolversTypes['Email']>, ParentType, ContextType, RequireFields<QueryGetEmailsByThreadArgs, 'threadId'>>;
  getMailRule?: Resolver<Maybe<ResolversTypes['MailRule']>, ParentType, ContextType, RequireFields<QueryGetMailRuleArgs, 'id'>>;
  getMailRules?: Resolver<Array<ResolversTypes['MailRule']>, ParentType, ContextType>;
  getSmtpProfile?: Resolver<Maybe<ResolversTypes['SmtpProfile']>, ParentType, ContextType, RequireFields<QueryGetSmtpProfileArgs, 'id'>>;
  getSmtpProfiles?: Resolver<Array<ResolversTypes['SmtpProfile']>, ParentType, ContextType>;
  getStorageUsage?: Resolver<Maybe<ResolversTypes['StorageUsage']>, ParentType, ContextType>;
  getStorageUsageRealtime?: Resolver<Maybe<ResolversTypes['StorageUsage']>, ParentType, ContextType>;
  getTag?: Resolver<Maybe<ResolversTypes['Tag']>, ParentType, ContextType, RequireFields<QueryGetTagArgs, 'id'>>;
  getTags?: Resolver<Array<ResolversTypes['Tag']>, ParentType, ContextType>;
  getTopEmailSources?: Resolver<Array<ResolversTypes['EmailSource']>, ParentType, ContextType, Partial<QueryGetTopEmailSourcesArgs>>;
  previewMailRule?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<QueryPreviewMailRuleArgs, 'id'>>;
  searchContacts?: Resolver<Array<ResolversTypes['Contact']>, ParentType, ContextType, RequireFields<QuerySearchContactsArgs, 'query'>>;
}>;

export type RuleActionsResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['RuleActions'] = ResolversParentTypes['RuleActions']> = ResolversObject<{
  addTagIds?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  archive?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  delete?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  forwardTo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  markRead?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  star?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
}>;

export type RuleConditionsResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['RuleConditions'] = ResolversParentTypes['RuleConditions']> = ResolversObject<{
  bccContains?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bodyContains?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ccContains?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fromContains?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subjectContains?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  toContains?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type RunRuleResultResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['RunRuleResult'] = ResolversParentTypes['RunRuleResult']> = ResolversObject<{
  matchedCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  processedCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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

export type StorageUsageResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['StorageUsage'] = ResolversParentTypes['StorageUsage']> = ResolversObject<{
  accountCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  attachmentCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  emailCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lastRefreshedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  totalAttachmentSizeBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalBodySizeBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalStorageBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalStorageGB?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type StripePriceResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['StripePrice'] = ResolversParentTypes['StripePrice']> = ResolversObject<{
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  interval?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  unitAmount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type SubscriptionResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  mailboxUpdates?: SubscriptionResolver<ResolversTypes['MailboxUpdate'], "mailboxUpdates", ParentType, ContextType>;
}>;

export type TagResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Tag'] = ResolversParentTypes['Tag']> = ResolversObject<{
  color?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  emailCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TestConnectionResultResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['TestConnectionResult'] = ResolversParentTypes['TestConnectionResult']> = ResolversObject<{
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  authenticationMethods?: Resolver<Array<ResolversTypes['AuthenticationMethod']>, ParentType, ContextType>;
  blockExternalImages?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  emailAccounts?: Resolver<Array<ResolversTypes['EmailAccount']>, ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  inboxDensity?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  inboxGroupByDate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  navbarCollapsed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  notificationDetailLevel?: Resolver<ResolversTypes['NotificationDetailLevel'], ParentType, ContextType>;
  smtpProfiles?: Resolver<Array<ResolversTypes['SmtpProfile']>, ParentType, ContextType>;
  themePreference?: Resolver<ResolversTypes['ThemePreference'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = MyContext> = ResolversObject<{
  Attachment?: AttachmentResolvers<ContextType>;
  AuthenticationMethod?: AuthenticationMethodResolvers<ContextType>;
  BaseEntityProps?: BaseEntityPropsResolvers<ContextType>;
  BillingInfo?: BillingInfoResolvers<ContextType>;
  BillingSubscription?: BillingSubscriptionResolvers<ContextType>;
  Contact?: ContactResolvers<ContextType>;
  ContactEmail?: ContactEmailResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Email?: EmailResolvers<ContextType>;
  EmailAccount?: EmailAccountResolvers<ContextType>;
  EmailSource?: EmailSourceResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  MailRule?: MailRuleResolvers<ContextType>;
  MailboxUpdate?: MailboxUpdateResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PushToken?: PushTokenResolvers<ContextType>;
  PushTokenResult?: PushTokenResultResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RuleActions?: RuleActionsResolvers<ContextType>;
  RuleConditions?: RuleConditionsResolvers<ContextType>;
  RunRuleResult?: RunRuleResultResolvers<ContextType>;
  SmtpProfile?: SmtpProfileResolvers<ContextType>;
  StorageUsage?: StorageUsageResolvers<ContextType>;
  StripePrice?: StripePriceResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Tag?: TagResolvers<ContextType>;
  TestConnectionResult?: TestConnectionResultResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
}>;

