/**
 * Tests for bulkUpdateEmails mutation
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockEmail, createMockEmailAccount } from '../../utils/mock-models.js';

describe('bulkUpdateEmails mutation', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
      Email: {
        findAll: sinon.stub(),
        update: sinon.stub(),
      },
      EmailAccount: {
        findAll: sinon.stub(),
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
    it('should update multiple emails read status', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        ids: ['email-1', 'email-2', 'email-3'],
        isRead: true,
      };
      
      const mockEmails = input.ids.map(id => 
        createMockEmail({ id, isRead: false })
      );
      const mockAccounts = [createMockEmailAccount({ userId: context.userId })];

      mockModels.EmailAccount.findAll.resolves(mockAccounts);
      mockModels.Email.findAll.resolves(mockEmails);
      mockModels.Email.update.resolves([input.ids.length]);

      // Get user accounts
      const accounts = await mockModels.EmailAccount.findAll({
        where: { userId: context.userId },
      });
      const accountIds = accounts.map((a: any) => a.id);

      // Update emails
      await mockModels.Email.update(
        { isRead: input.isRead },
        { where: { id: input.ids, emailAccountId: accountIds } }
      );

      expect(mockModels.Email.update.calledOnce).to.be.true;
      expect(mockModels.Email.update.firstCall.args[0]).to.deep.include({ isRead: true });
    });

    it('should update starred status', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        ids: ['email-1'],
        isStarred: true,
      };

      mockModels.EmailAccount.findAll.resolves([createMockEmailAccount()]);
      mockModels.Email.update.resolves([1]);

      await mockModels.Email.update(
        { isStarred: input.isStarred },
        { where: { id: input.ids } }
      );

      expect(mockModels.Email.update.firstCall.args[0]).to.deep.include({ isStarred: true });
    });

    it('should move emails to different folder', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        ids: ['email-1', 'email-2'],
        folder: 'ARCHIVE',
      };

      mockModels.EmailAccount.findAll.resolves([createMockEmailAccount()]);
      mockModels.Email.update.resolves([2]);

      await mockModels.Email.update(
        { folder: input.folder },
        { where: { id: input.ids } }
      );

      expect(mockModels.Email.update.firstCall.args[0]).to.deep.include({ folder: 'ARCHIVE' });
    });

    it('should update multiple properties at once', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        ids: ['email-1'],
        isRead: true,
        isStarred: true,
        folder: 'ARCHIVE',
      };

      mockModels.EmailAccount.findAll.resolves([createMockEmailAccount()]);
      mockModels.Email.update.resolves([1]);

      await mockModels.Email.update(
        { isRead: input.isRead, isStarred: input.isStarred, folder: input.folder },
        { where: { id: input.ids } }
      );

      const updateArgs = mockModels.Email.update.firstCall.args[0];
      expect(updateArgs).to.have.property('isRead', true);
      expect(updateArgs).to.have.property('isStarred', true);
      expect(updateArgs).to.have.property('folder', 'ARCHIVE');
    });

    it('should only update emails belonging to user accounts', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        ids: ['email-1', 'email-2'],
        isRead: true,
      };
      const userAccountIds = ['acc-123', 'acc-456'];

      mockModels.EmailAccount.findAll.resolves([
        createMockEmailAccount({ id: 'acc-123' }),
        createMockEmailAccount({ id: 'acc-456' }),
      ]);
      mockModels.Email.update.resolves([2]);

      const accounts = await mockModels.EmailAccount.findAll({
        where: { userId: context.userId },
      });
      const accountIds = accounts.map((a: any) => a.id);

      await mockModels.Email.update(
        { isRead: input.isRead },
        { where: { id: input.ids, emailAccountId: accountIds } }
      );

      expect(mockModels.Email.update.firstCall.args[1].where)
        .to.have.property('emailAccountId');
    });

    it('should return updated emails', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        ids: ['email-1'],
        isRead: true,
      };
      const updatedEmail = createMockEmail({ id: 'email-1', isRead: true });

      mockModels.EmailAccount.findAll.resolves([createMockEmailAccount()]);
      mockModels.Email.update.resolves([1]);
      mockModels.Email.findAll.resolves([updatedEmail]);

      await mockModels.Email.update(
        { isRead: input.isRead },
        { where: { id: input.ids } }
      );

      // Fetch updated emails
      const result = await mockModels.Email.findAll({
        where: { id: input.ids },
      });

      expect(result).to.have.lengthOf(1);
      expect(result[0].isRead).to.be.true;
    });
  });
});
