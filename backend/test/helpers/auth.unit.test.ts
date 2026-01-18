/**
 * Auth Helper Unit Tests
 * 
 * Tests the pure auth helper functions that don't require external services.
 */

import { expect } from 'chai';
import type { BackendContext } from '../../types.js';

// Import the pure functions directly
import { getUserIdFromContext, requireAuth } from '../../helpers/auth.js';

describe('auth helpers', function () {
  describe('getUserIdFromContext', () => {
    it('should return userId when present in context', () => {
      const context: BackendContext = {
        userId: 'user-123',
        supabaseUserId: 'supabase-123',
        token: 'test-token',
        sequelize: {} as any,
      };

      const result = getUserIdFromContext(context);
      expect(result).to.equal('user-123');
    });

    it('should return null when userId is undefined', () => {
      const context: BackendContext = {
        userId: undefined,
        supabaseUserId: undefined,
        token: '',
        sequelize: {} as any,
      };

      const result = getUserIdFromContext(context);
      expect(result).to.be.null;
    });

    it('should return null when userId is empty string', () => {
      const context: BackendContext = {
        userId: '',
        supabaseUserId: undefined,
        token: '',
        sequelize: {} as any,
      };

      // Empty string is falsy, so should return null
      const result = getUserIdFromContext(context);
      expect(result).to.be.null;
    });
  });

  describe('requireAuth', () => {
    it('should return userId when authenticated', () => {
      const context: BackendContext = {
        userId: 'user-456',
        supabaseUserId: 'supabase-456',
        token: 'test-token',
        sequelize: {} as any,
      };

      const result = requireAuth(context);
      expect(result).to.equal('user-456');
    });

    it('should throw error when not authenticated', () => {
      const context: BackendContext = {
        userId: undefined,
        supabaseUserId: undefined,
        token: '',
        sequelize: {} as any,
      };

      expect(() => requireAuth(context)).to.throw('Authentication required');
    });

    it('should throw error when userId is empty', () => {
      const context: BackendContext = {
        userId: '',
        supabaseUserId: 'supabase-789',
        token: 'token',
        sequelize: {} as any,
      };

      expect(() => requireAuth(context)).to.throw('Authentication required');
    });
  });
});
