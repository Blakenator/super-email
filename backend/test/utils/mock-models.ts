/**
 * Mock factories for Sequelize models
 * Provides type-safe mock data for testing
 */

import sinon from 'sinon';

// ============================================================================
// Base mock instance factory
// ============================================================================

interface MockModelInstance<T> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  get: (options?: { plain: boolean }) => T;
  toJSON: () => T;
  update: sinon.SinonStub;
  destroy: sinon.SinonStub;
  save: sinon.SinonStub;
  reload: sinon.SinonStub;
  getDataValue: (key: string) => any;
}

function createMockInstance<T extends Record<string, any>>(data: T): T & MockModelInstance<T> {
  // Create the instance object first, then add methods that reference it
  const instance: any = {
    ...data,
    get: (options?: { plain: boolean }) => options?.plain ? data : data,
    toJSON: () => data,
    destroy: sinon.stub().resolves(),
    getDataValue: (key: string) => (data as any)[key],
  };
  
  // Add methods that need to reference the instance
  instance.update = sinon.stub().callsFake(async (updates: Partial<T>) => {
    Object.assign(instance, updates);
    Object.assign(data, updates);
    return instance;
  });
  instance.save = sinon.stub().resolves(instance);
  instance.reload = sinon.stub().resolves(instance);
  
  return instance as T & MockModelInstance<T>;
}

// ============================================================================
// User mocks
// ============================================================================

export interface MockUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  themePreference: 'LIGHT' | 'DARK' | 'AUTO';
  navbarCollapsed: boolean;
  notificationDetailLevel: 'MINIMAL' | 'FULL';
  inboxDensity: boolean;
  inboxGroupByDate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockUser(overrides: Partial<MockUserData> = {}): MockUserData & MockModelInstance<MockUserData> {
  const data: MockUserData = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    themePreference: 'AUTO',
    navbarCollapsed: false,
    notificationDetailLevel: 'FULL',
    inboxDensity: false,
    inboxGroupByDate: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return createMockInstance(data);
}

// ============================================================================
// AuthenticationMethod mocks
// ============================================================================

export interface MockAuthMethodData {
  id: string;
  userId: string;
  provider: 'EMAIL_PASSWORD' | 'GOOGLE' | 'GITHUB' | 'APPLE' | 'MICROSOFT';
  providerUserId: string;
  email: string;
  displayName: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockAuthMethod(overrides: Partial<MockAuthMethodData> = {}): MockAuthMethodData & MockModelInstance<MockAuthMethodData> {
  const data: MockAuthMethodData = {
    id: 'auth-method-123',
    userId: 'user-123',
    provider: 'EMAIL_PASSWORD',
    providerUserId: 'supabase-user-123',
    email: 'test@example.com',
    displayName: 'test@example.com (Email/Password)',
    lastUsedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return createMockInstance(data);
}

// ============================================================================
// EmailAccount mocks
// ============================================================================

export interface MockEmailAccountData {
  id: string;
  userId: string;
  name: string;
  email: string;
  host: string;
  port: number;
  username: string;
  password: string;
  accountType: 'IMAP' | 'POP3';
  useSsl: boolean;
  lastSyncedAt: Date | null;
  syncId: string | null;
  syncProgress: number | null;
  syncStatus: string | null;
  syncExpiresAt: Date | null;
  defaultSmtpProfileId: string | null;
  providerId: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockEmailAccount(overrides: Partial<MockEmailAccountData> = {}): MockEmailAccountData & MockModelInstance<MockEmailAccountData> {
  const data: MockEmailAccountData = {
    id: 'email-account-123',
    userId: 'user-123',
    name: 'Test Gmail',
    email: 'test@gmail.com',
    host: 'imap.gmail.com',
    port: 993,
    username: 'test@gmail.com',
    password: 'encrypted-password',
    accountType: 'IMAP',
    useSsl: true,
    lastSyncedAt: null,
    syncId: null,
    syncProgress: null,
    syncStatus: null,
    syncExpiresAt: null,
    defaultSmtpProfileId: null,
    providerId: null,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return createMockInstance(data);
}

// ============================================================================
// SmtpProfile mocks
// ============================================================================

export interface MockSmtpProfileData {
  id: string;
  userId: string;
  name: string;
  email: string;
  alias: string | null;
  host: string;
  port: number;
  username: string;
  password: string;
  useSsl: boolean;
  isDefault: boolean;
  providerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockSmtpProfile(overrides: Partial<MockSmtpProfileData> = {}): MockSmtpProfileData & MockModelInstance<MockSmtpProfileData> {
  const data: MockSmtpProfileData = {
    id: 'smtp-profile-123',
    userId: 'user-123',
    name: 'Test SMTP',
    email: 'test@gmail.com',
    alias: 'Test User',
    host: 'smtp.gmail.com',
    port: 587,
    username: 'test@gmail.com',
    password: 'encrypted-password',
    useSsl: true,
    isDefault: true,
    providerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return createMockInstance(data);
}

// ============================================================================
// Email mocks
// ============================================================================

export interface MockEmailData {
  id: string;
  emailAccountId: string;
  smtpProfileId: string | null;
  messageId: string;
  folder: 'INBOX' | 'SENT' | 'DRAFTS' | 'TRASH' | 'SPAM' | 'ARCHIVE';
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  ccAddresses: string[] | null;
  bccAddresses: string[] | null;
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  receivedAt: Date;
  isRead: boolean;
  isStarred: boolean;
  isDraft: boolean;
  inReplyTo: string | null;
  references: string[] | null;
  threadId: string | null;
  headers: Record<string, any> | null;
  isUnsubscribed: boolean;
  unsubscribeUrl: string | null;
  unsubscribeEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockEmail(overrides: Partial<MockEmailData> = {}): MockEmailData & MockModelInstance<MockEmailData> {
  const data: MockEmailData = {
    id: 'email-123',
    emailAccountId: 'email-account-123',
    smtpProfileId: null,
    messageId: '<test-123@example.com>',
    folder: 'INBOX',
    fromAddress: 'sender@example.com',
    fromName: 'Sender Name',
    toAddresses: ['test@example.com'],
    ccAddresses: null,
    bccAddresses: null,
    subject: 'Test Email Subject',
    textBody: 'This is the plain text body',
    htmlBody: '<p>This is the HTML body</p>',
    receivedAt: new Date(),
    isRead: false,
    isStarred: false,
    isDraft: false,
    inReplyTo: null,
    references: null,
    threadId: 'thread-123',
    headers: null,
    isUnsubscribed: false,
    unsubscribeUrl: null,
    unsubscribeEmail: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return createMockInstance(data);
}

// ============================================================================
// Tag mocks
// ============================================================================

export interface MockTagData {
  id: string;
  userId: string;
  name: string;
  color: string;
  description: string | null;
  emailCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockTag(overrides: Partial<MockTagData> = {}): MockTagData & MockModelInstance<MockTagData> {
  const data: MockTagData = {
    id: 'tag-123',
    userId: 'user-123',
    name: 'Important',
    color: '#FF5733',
    description: 'Important emails',
    emailCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return createMockInstance(data);
}

// ============================================================================
// Contact mocks
// ============================================================================

export interface MockContactData {
  id: string;
  userId: string;
  email: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  phone: string | null;
  notes: string | null;
  isAutoCreated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockContact(overrides: Partial<MockContactData> = {}): MockContactData & MockModelInstance<MockContactData> {
  const data: MockContactData = {
    id: 'contact-123',
    userId: 'user-123',
    email: 'contact@example.com',
    name: 'Contact Name',
    firstName: 'Contact',
    lastName: 'Name',
    company: 'Example Corp',
    phone: '+1-555-1234',
    notes: 'Test contact',
    isAutoCreated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return createMockInstance(data);
}

export interface MockContactEmailData {
  id: string;
  contactId: string;
  email: string;
  isPrimary: boolean;
  label: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockContactEmail(overrides: Partial<MockContactEmailData> = {}): MockContactEmailData & MockModelInstance<MockContactEmailData> {
  const data: MockContactEmailData = {
    id: 'contact-email-123',
    contactId: 'contact-123',
    email: 'contact@example.com',
    isPrimary: true,
    label: 'Work',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return createMockInstance(data);
}

// ============================================================================
// MailRule mocks
// ============================================================================

export interface MockMailRuleData {
  id: string;
  userId: string;
  emailAccountId: string | null;
  name: string;
  description: string | null;
  conditions: {
    fromContains?: string;
    toContains?: string;
    ccContains?: string;
    bccContains?: string;
    subjectContains?: string;
    bodyContains?: string;
  };
  actions: {
    archive?: boolean;
    star?: boolean;
    delete?: boolean;
    markRead?: boolean;
    addTagIds?: string[];
    forwardTo?: string;
  };
  isEnabled: boolean;
  priority: number;
  stopProcessing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockMailRule(overrides: Partial<MockMailRuleData> = {}): MockMailRuleData & MockModelInstance<MockMailRuleData> {
  const data: MockMailRuleData = {
    id: 'mail-rule-123',
    userId: 'user-123',
    emailAccountId: null,
    name: 'Test Rule',
    description: 'A test mail rule',
    conditions: {
      fromContains: 'newsletter@',
    },
    actions: {
      archive: true,
      markRead: true,
    },
    isEnabled: true,
    priority: 0,
    stopProcessing: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return createMockInstance(data);
}

// ============================================================================
// Attachment mocks
// ============================================================================

export interface MockAttachmentData {
  id: string;
  emailId: string;
  filename: string;
  mimeType: string;
  extension: string | null;
  size: number;
  storageKey: string;
  attachmentType: 'INLINE' | 'ATTACHMENT';
  contentId: string | null;
  contentDisposition: string | null;
  isSafe: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockAttachment(overrides: Partial<MockAttachmentData> = {}): MockAttachmentData & MockModelInstance<MockAttachmentData> {
  const data: MockAttachmentData = {
    id: 'attachment-123',
    emailId: 'email-123',
    filename: 'document.pdf',
    mimeType: 'application/pdf',
    extension: 'pdf',
    size: 1024,
    storageKey: 'attachment-123',
    attachmentType: 'ATTACHMENT',
    contentId: null,
    contentDisposition: 'attachment',
    isSafe: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return createMockInstance(data);
}
