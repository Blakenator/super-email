/**
 * Mock context factory for GraphQL resolver tests
 */

import type { BackendContext } from '../../types.js';
import sinon from 'sinon';

export interface MockContextOptions {
  userId?: string;
  supabaseUserId?: string;
  token?: string;
  authenticated?: boolean;
}

/**
 * Create a mock BackendContext for testing resolvers
 */
export function createMockContext(options: MockContextOptions = {}): BackendContext {
  const {
    userId = options.authenticated !== false ? 'test-user-id' : undefined,
    supabaseUserId = options.authenticated !== false ? 'test-supabase-id' : undefined,
    token = options.authenticated !== false ? 'test-token' : '',
  } = options;

  return {
    userId,
    supabaseUserId,
    token,
    sequelize: createMockSequelize(),
  };
}

/**
 * Create an unauthenticated mock context
 */
export function createUnauthenticatedContext(): BackendContext {
  return createMockContext({ authenticated: false, userId: undefined, token: '' });
}

/**
 * Create a mock Sequelize instance
 */
function createMockSequelize(): any {
  return {
    transaction: sinon.stub().callsFake(async (callback: any) => {
      const mockTransaction = {
        commit: sinon.stub().resolves(),
        rollback: sinon.stub().resolves(),
      };
      if (callback) {
        return callback(mockTransaction);
      }
      return mockTransaction;
    }),
    query: sinon.stub().resolves([]),
    models: {},
  };
}
