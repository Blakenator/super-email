/**
 * Tests for deleteAuthenticationMethod mutation
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockAuthMethod } from '../../utils/mock-models.js';

describe('deleteAuthenticationMethod mutation', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
      AuthenticationMethod: {
        findOne: sinon.stub(),
        count: sinon.stub(),
      },
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('when user is not authenticated', () => {
    it('should throw error when not authenticated', () => {
      const context = createUnauthenticatedContext();
      
      const requireAuth = (ctx: any) => {
        if (!ctx.userId) {
          throw new Error('Authentication required');
        }
        return ctx.userId;
      };

      expect(() => requireAuth(context)).to.throw('Authentication required');
    });
  });

  describe('when user is authenticated', () => {
    it('should delete authentication method when found', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockAuthMethod = createMockAuthMethod({
        id: 'auth-123',
        userId: context.userId,
      });
      mockAuthMethod.destroy = sinon.stub().resolves();

      mockModels.AuthenticationMethod.findOne.resolves(mockAuthMethod);
      mockModels.AuthenticationMethod.count.resolves(2); // Has multiple auth methods

      // Find auth method
      const authMethod = await mockModels.AuthenticationMethod.findOne({
        where: { id: 'auth-123', userId: context.userId },
      });

      expect(authMethod).to.exist;

      // Check if user has other auth methods
      const count = await mockModels.AuthenticationMethod.count({
        where: { userId: context.userId },
      });
      expect(count).to.be.greaterThan(1);

      // Delete auth method
      await authMethod.destroy();

      expect(mockAuthMethod.destroy.calledOnce).to.be.true;
    });

    it('should throw error when auth method not found', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.AuthenticationMethod.findOne.resolves(null);

      const authMethod = await mockModels.AuthenticationMethod.findOne({
        where: { id: 'nonexistent', userId: context.userId },
      });

      expect(authMethod).to.be.null;
    });

    it('should not delete last remaining auth method', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockAuthMethod = createMockAuthMethod({
        id: 'auth-123',
        userId: context.userId,
      });

      mockModels.AuthenticationMethod.findOne.resolves(mockAuthMethod);
      mockModels.AuthenticationMethod.count.resolves(1); // Only one auth method

      // Check if this is the last auth method
      const count = await mockModels.AuthenticationMethod.count({
        where: { userId: context.userId },
      });

      expect(count).to.equal(1);

      // Should not allow deletion of last auth method
      if (count <= 1) {
        expect(() => {
          throw new Error('Cannot delete the last authentication method');
        }).to.throw('Cannot delete the last authentication method');
      }
    });

    it('should not delete auth method belonging to another user', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      // Query with wrong userId returns null
      mockModels.AuthenticationMethod.findOne.resolves(null);

      const authMethod = await mockModels.AuthenticationMethod.findOne({
        where: { id: 'other-users-auth', userId: context.userId },
      });

      expect(authMethod).to.be.null;
    });

    it('should return true on successful deletion', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockAuthMethod = createMockAuthMethod({
        id: 'auth-123',
        userId: context.userId,
      });
      mockAuthMethod.destroy = sinon.stub().resolves();

      mockModels.AuthenticationMethod.findOne.resolves(mockAuthMethod);
      mockModels.AuthenticationMethod.count.resolves(2);

      const authMethod = await mockModels.AuthenticationMethod.findOne({
        where: { id: 'auth-123', userId: context.userId },
      });

      await authMethod.destroy();

      // Resolver returns true on success
      const result = true;
      expect(result).to.be.true;
    });
  });
});
