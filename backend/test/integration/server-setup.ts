/**
 * Integration Test Server Setup
 * 
 * Uses the actual server factory with test-specific overrides.
 * The server is started once before all integration tests and stopped after.
 */

import path from 'node:path';
import { createServer, type ServerInstance, type ServerDependencies } from '../../server.js';
import { sequelize } from '../../db/database.js';
import type { BackendContext } from '../../types.js';

// Singleton server instance
let serverInstance: ServerInstance | null = null;

// Test user for authenticated requests (valid UUIDs)
export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_SUPABASE_USER_ID = '00000000-0000-0000-0000-000000000002';

/**
 * Mock verifyToken for tests - returns authenticated user by default
 */
export const mockVerifyToken = async (token: string) => {
  if (token === 'valid-token' || token === 'test-token') {
    return {
      userId: TEST_USER_ID,
      supabaseUserId: TEST_SUPABASE_USER_ID,
    };
  }
  if (token === 'invalid-token' || !token) {
    return null;
  }
  // For custom tokens that look like UUIDs, use them directly
  if (token.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return {
      userId: token,
      supabaseUserId: token,
    };
  }
  return null;
};

/**
 * Get test-specific server dependencies
 */
export function getTestDependencies(
  overrides: Partial<ServerDependencies> = {},
): Partial<ServerDependencies> {
  return {
    schemaPath: path.join(process.cwd(), '..', 'common', 'schema.graphql'),
    verifyToken: mockVerifyToken,
    skipWebSocket: true,  // Skip WebSocket for faster tests
    skipDbSync: false,    // We do want DB sync for integration tests
    enableLogging: false, // Quiet tests
    port: 4001,           // Different port to avoid conflicts
    ...overrides,
  };
}

/**
 * Get or create the test server (singleton)
 */
export async function getTestServer(): Promise<ServerInstance> {
  if (serverInstance) {
    return serverInstance;
  }

  serverInstance = await createServer(getTestDependencies());
  return serverInstance;
}

/**
 * Start the test server (call once before all tests)
 */
export async function startTestServer(): Promise<ServerInstance> {
  const server = await getTestServer();
  // Note: We don't call server.start() because we use executeOperation directly
  // If you need HTTP endpoints, call server.start() here
  return server;
}

/**
 * Stop the test server (call once after all tests)
 */
export async function stopTestServer(): Promise<void> {
  if (serverInstance) {
    await serverInstance.stop();
    serverInstance = null;
  }
}

/**
 * Execute a GraphQL operation against the test server
 */
export async function executeOperation<T = any>(
  query: string,
  variables?: Record<string, any>,
  context?: Partial<BackendContext>,
) {
  const server = await getTestServer();
  return server.executeOperation<T>(query, variables, context);
}

/**
 * Execute an authenticated GraphQL operation
 */
export async function executeAuthenticatedOperation<T = any>(
  query: string,
  variables?: Record<string, any>,
  userId: string = TEST_USER_ID,
) {
  return executeOperation<T>(query, variables, {
    userId,
    supabaseUserId: `supabase-${userId}`,
    token: 'test-token',
  });
}

/**
 * Execute an unauthenticated GraphQL operation
 */
export async function executeUnauthenticatedOperation<T = any>(
  query: string,
  variables?: Record<string, any>,
) {
  return executeOperation<T>(query, variables, {
    userId: undefined,
    supabaseUserId: undefined,
    token: '',
  });
}

/**
 * Clean up test data - call in afterEach or after tests
 * Uses TRUNCATE for speed, with CASCADE to handle foreign keys
 */
export async function cleanupTestData(): Promise<void> {
  try {
    // Use raw query with TRUNCATE CASCADE for speed
    // This is PostgreSQL-specific but much faster than individual deletes
    const tableNames = [
      'email_tags',
      'attachments',
      'emails',
      'tags',
      'mail_rules',
      'smtp_profiles',
      'contact_emails',
      'contacts',
      'email_accounts',
      'authentication_methods',
      'users',
    ];
    
    // For SQLite (used in tests), we need to use DELETE instead of TRUNCATE
    const dialect = sequelize.getDialect();
    
    if (dialect === 'sqlite') {
      // Disable foreign key checks temporarily for SQLite
      await sequelize.query('PRAGMA foreign_keys = OFF;');
      for (const table of tableNames) {
        try {
          await sequelize.query(`DELETE FROM "${table}";`);
        } catch (e) {
          // Table might not exist, ignore
        }
      }
      await sequelize.query('PRAGMA foreign_keys = ON;');
    } else {
      // PostgreSQL: Use TRUNCATE with CASCADE
      await sequelize.query(`TRUNCATE TABLE ${tableNames.join(', ')} CASCADE;`);
    }
  } catch (e) {
    // Fallback to sequential deletes if truncate fails
    const models = [
      'EmailTag', 'Attachment', 'Email', 'Tag', 'MailRule',
      'SmtpProfile', 'ContactEmail', 'Contact', 'EmailAccount',
      'AuthenticationMethod', 'User',
    ];
    for (const model of models) {
      try {
        await sequelize.models[model]?.destroy({ where: {}, force: true, truncate: true });
      } catch (err) {
        // Ignore
      }
    }
  }
}

/**
 * Create a test user in the database
 */
export async function createTestUser(
  userId: string = TEST_USER_ID,
  email: string = 'test@example.com',
) {
  const User = sequelize.models.User;
  const [user] = await User.findOrCreate({
    where: { id: userId },
    defaults: {
      id: userId,
      email,
    },
  });
  return user.get({ plain: true });
}
