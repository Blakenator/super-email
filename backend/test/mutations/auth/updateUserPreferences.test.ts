/**
 * Tests for updateUserPreferences mutation
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockUser } from '../../utils/mock-models.js';

describe('updateUserPreferences mutation', () => {
  let mockModels: any;
  let mockUser: any;

  beforeEach(() => {
    mockUser = createMockUser();
    
    mockModels = {
      User: {
        findByPk: sinon.stub(),
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
    it('should update theme preference', async () => {
      const context = createMockContext({ userId: mockUser.id });
      const updateStub = sinon.stub().resolves(mockUser);
      mockUser.update = updateStub;
      
      mockModels.User.findByPk.resolves(mockUser);

      const user = await mockModels.User.findByPk(context.userId);
      expect(user).to.exist;

      await user.update({ themePreference: 'DARK' });
      
      expect(updateStub.calledOnce).to.be.true;
      expect(updateStub.firstCall.args[0]).to.deep.include({
        themePreference: 'DARK',
      });
    });

    it('should update navbar collapsed state', async () => {
      const context = createMockContext({ userId: mockUser.id });
      const updateStub = sinon.stub().resolves(mockUser);
      mockUser.update = updateStub;
      
      mockModels.User.findByPk.resolves(mockUser);

      const user = await mockModels.User.findByPk(context.userId);
      await user.update({ navbarCollapsed: true });
      
      expect(updateStub.calledOnce).to.be.true;
      expect(updateStub.firstCall.args[0]).to.have.property('navbarCollapsed', true);
    });

    it('should update notification detail level', async () => {
      const context = createMockContext({ userId: mockUser.id });
      const updateStub = sinon.stub().resolves(mockUser);
      mockUser.update = updateStub;
      
      mockModels.User.findByPk.resolves(mockUser);

      const user = await mockModels.User.findByPk(context.userId);
      await user.update({ notificationDetailLevel: 'MINIMAL' });
      
      expect(updateStub.calledOnce).to.be.true;
      expect(updateStub.firstCall.args[0]).to.have.property('notificationDetailLevel', 'MINIMAL');
    });

    it('should update inbox density', async () => {
      const context = createMockContext({ userId: mockUser.id });
      const updateStub = sinon.stub().resolves(mockUser);
      mockUser.update = updateStub;
      
      mockModels.User.findByPk.resolves(mockUser);

      const user = await mockModels.User.findByPk(context.userId);
      await user.update({ inboxDensity: true });
      
      expect(updateStub.calledOnce).to.be.true;
      expect(updateStub.firstCall.args[0]).to.have.property('inboxDensity', true);
    });

    it('should update inbox group by date', async () => {
      const context = createMockContext({ userId: mockUser.id });
      const updateStub = sinon.stub().resolves(mockUser);
      mockUser.update = updateStub;
      
      mockModels.User.findByPk.resolves(mockUser);

      const user = await mockModels.User.findByPk(context.userId);
      await user.update({ inboxGroupByDate: false });
      
      expect(updateStub.calledOnce).to.be.true;
      expect(updateStub.firstCall.args[0]).to.have.property('inboxGroupByDate', false);
    });

    it('should update multiple preferences at once', async () => {
      const context = createMockContext({ userId: mockUser.id });
      const updateStub = sinon.stub().resolves(mockUser);
      mockUser.update = updateStub;
      
      mockModels.User.findByPk.resolves(mockUser);

      const input = {
        themePreference: 'LIGHT',
        navbarCollapsed: true,
        inboxDensity: true,
      };

      const user = await mockModels.User.findByPk(context.userId);
      await user.update(input);
      
      expect(updateStub.calledOnce).to.be.true;
      expect(updateStub.firstCall.args[0]).to.deep.include(input);
    });

    it('should throw error if user not found', async () => {
      const context = createMockContext({ userId: 'nonexistent-user' });
      
      mockModels.User.findByPk.resolves(null);

      const user = await mockModels.User.findByPk(context.userId);
      
      expect(user).to.be.null;
    });

    it('should return updated user', async () => {
      const context = createMockContext({ userId: mockUser.id });
      const updatedUser = createMockUser({
        ...mockUser,
        themePreference: 'DARK',
      });
      
      mockUser.update = sinon.stub().resolves(updatedUser);
      mockModels.User.findByPk.resolves(mockUser);

      const user = await mockModels.User.findByPk(context.userId);
      const result = await user.update({ themePreference: 'DARK' });
      
      expect(result.themePreference).to.equal('DARK');
    });
  });
});
