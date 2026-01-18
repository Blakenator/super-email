/**
 * Mock factories for Supabase client
 * Used for testing authentication-related code
 */

import sinon from 'sinon';

// ============================================================================
// Supabase Auth Mocks
// ============================================================================

export interface MockSupabaseUserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface MockSupabaseOptions {
  user?: MockSupabaseUserData | null;
  authError?: Error | null;
}

/**
 * Create a mock Supabase user object
 */
export function createMockSupabaseUser(overrides: Partial<MockSupabaseUserData> = {}): MockSupabaseUserData {
  return {
    id: 'supabase-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  };
}

/**
 * Create a mock Supabase client
 */
export function createMockSupabaseClient(options: MockSupabaseOptions = {}) {
  const {
    user = createMockSupabaseUser(),
    authError = null,
  } = options;

  const mockGetUser = sinon.stub().resolves({
    data: {
      user: user ? {
        id: user.id,
        email: user.email,
        user_metadata: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
      } : null,
    },
    error: authError,
  });

  return {
    auth: {
      getUser: mockGetUser,
      signInWithPassword: sinon.stub().resolves({
        data: { user, session: { access_token: 'mock-token' } },
        error: authError,
      }),
      signOut: sinon.stub().resolves({ error: null }),
      onAuthStateChange: sinon.stub().returns({
        data: { subscription: { unsubscribe: sinon.stub() } },
      }),
    },
    from: sinon.stub().returns({
      select: sinon.stub().returnsThis(),
      insert: sinon.stub().returnsThis(),
      update: sinon.stub().returnsThis(),
      delete: sinon.stub().returnsThis(),
      eq: sinon.stub().returnsThis(),
      single: sinon.stub().resolves({ data: null, error: null }),
    }),
  };
}

/**
 * Create mock auth helper functions
 */
export function createMockAuthHelpers(options: { userId?: string; authenticated?: boolean } = {}) {
  const { userId = 'test-user-id', authenticated = true } = options;

  return {
    verifyToken: sinon.stub().resolves(
      authenticated ? { userId, supabaseUserId: 'supabase-123' } : null
    ),
    getUserFromToken: sinon.stub().resolves(
      authenticated ? {
        id: 'supabase-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      } : null
    ),
    requireAuth: authenticated
      ? sinon.stub().returns(userId)
      : sinon.stub().throws(new Error('Authentication required')),
    getUserIdFromContext: sinon.stub().returns(authenticated ? userId : null),
  };
}
