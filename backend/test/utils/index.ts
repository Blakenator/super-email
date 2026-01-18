/**
 * Test utilities index
 * Re-exports all mock factories and test helpers
 */

// Context mocks
export {
  createMockContext,
  createUnauthenticatedContext,
  type MockContextOptions,
} from './mock-context.js';

// Model mocks
export {
  createMockUser,
  createMockAuthMethod,
  createMockEmailAccount,
  createMockSmtpProfile,
  createMockEmail,
  createMockTag,
  createMockContact,
  createMockContactEmail,
  createMockMailRule,
  createMockAttachment,
  type MockUserData,
  type MockAuthMethodData,
  type MockEmailAccountData,
  type MockSmtpProfileData,
  type MockEmailData,
  type MockTagData,
  type MockContactData,
  type MockContactEmailData,
  type MockMailRuleData,
  type MockAttachmentData,
} from './mock-models.js';

// AWS mocks
export {
  createMockS3Client,
  createMockS3Operations,
  createMockSecretsManagerClient,
  createMockSecretsOperations,
  type MockS3ClientOptions,
  type MockSecretsManagerOptions,
} from './mock-aws.js';

// Supabase mocks
export {
  createMockSupabaseClient,
  createMockSupabaseUser,
  createMockAuthHelpers,
  type MockSupabaseUserData,
  type MockSupabaseOptions,
} from './mock-supabase.js';
