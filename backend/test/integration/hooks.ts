/**
 * Mocha Root Hooks for Integration Tests
 * 
 * These hooks run once before/after ALL integration tests across all files.
 * The server is started once and reused for all tests.
 */

import { startTestServer, stopTestServer, cleanupTestData } from './server-setup.js';

export const mochaHooks = {
  async beforeAll() {
    // Start the test server once for all integration tests
    await startTestServer();
    console.log('    ✓ Integration test server ready');
  },

  async afterAll() {
    // Clean up test data and stop the server
    await cleanupTestData();
    await stopTestServer();
    console.log('    ✓ Integration test server stopped');
  },
};
