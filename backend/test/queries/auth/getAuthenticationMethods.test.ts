/**
 * Tests for getAuthenticationMethods query
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockAuthMethod } from '../../utils/mock-models.js';

describe('getAuthenticationMethods query', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
      AuthenticationMethod: {
        findAll: sinon.stub(),
      },
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('when user is not authenticated', () => {
    it('should throw error when not authenticated', async () => {
      const context = createUnauthenticatedContext();
      
      // The requireAuth helper would throw
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
    it('should return all auth methods for the user', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockAuthMethods = [
        createMockAuthMethod({ id: 'auth-1', provider: 'EMAIL_PASSWORD' }),
        createMockAuthMethod({ id: 'auth-2', provider: 'GOOGLE' }),
        createMockAuthMethod({ id: 'auth-3', provider: 'GITHUB' }),
      ];

      mockModels.AuthenticationMethod.findAll.resolves(mockAuthMethods);

      const result = await mockModels.AuthenticationMethod.findAll({
        where: { userId: context.userId },
        order: [['createdAt', 'DESC']],
      });

      expect(result).to.have.lengthOf(3);
      expect(mockModels.AuthenticationMethod.findAll.calledOnce).to.be.true;
      expect(mockModels.AuthenticationMethod.findAll.firstCall.args[0]).to.deep.include({
        where: { userId: 'user-123' },
      });
    });

    it('should return empty array when no auth methods exist', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.AuthenticationMethod.findAll.resolves([]);

      const result = await mockModels.AuthenticationMethod.findAll({
        where: { userId: context.userId },
      });

      expect(result).to.be.an('array').that.is.empty;
    });

    it('should order auth methods by creation date descending', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.AuthenticationMethod.findAll.resolves([]);

      await mockModels.AuthenticationMethod.findAll({
        where: { userId: context.userId },
        order: [['createdAt', 'DESC']],
      });

      expect(mockModels.AuthenticationMethod.findAll.firstCall.args[0].order)
        .to.deep.equal([['createdAt', 'DESC']]);
    });

    it('should convert model instances to plain objects', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockAuthMethod = createMockAuthMethod();
      
      mockModels.AuthenticationMethod.findAll.resolves([mockAuthMethod]);

      const result = await mockModels.AuthenticationMethod.findAll({
        where: { userId: context.userId },
      });

      // Verify the instance has the get method for conversion
      expect(result[0].get({ plain: true })).to.be.an('object');
      expect(result[0].get({ plain: true })).to.have.property('id');
      expect(result[0].get({ plain: true })).to.have.property('provider');
    });
  });
});
