/**
 * Test setup file - runs before all tests
 * Sets up global mocks and test utilities
 */

import sinon from 'sinon';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Global setup/teardown
export const mochaHooks = {
  beforeEach() {
    // Reset all sinon mocks before each test
    sinon.restore();
  },
  afterEach() {
    // Cleanup after each test
    sinon.restore();
  },
};
