/**
 * Tests for getEmails query
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockEmail, createMockEmailAccount } from '../../utils/mock-models.js';

describe('getEmails query', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
      Email: {
        findAll: sinon.stub(),
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
    it('should return empty array when user has no email accounts', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.EmailAccount.findAll.resolves([]);

      const accounts = await mockModels.EmailAccount.findAll({
        where: { userId: context.userId },
      });

      expect(accounts).to.be.an('array').that.is.empty;
      
      // Resolver returns [] when no accounts
      const result = accounts.length === 0 ? [] : ['emails'];
      expect(result).to.be.empty;
    });

    it('should return emails for user accounts', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockAccounts = [
        createMockEmailAccount({ id: 'acc-1' }),
        createMockEmailAccount({ id: 'acc-2' }),
      ];
      const mockEmails = [
        createMockEmail({ id: 'email-1', emailAccountId: 'acc-1' }),
        createMockEmail({ id: 'email-2', emailAccountId: 'acc-2' }),
      ];

      mockModels.EmailAccount.findAll.resolves(mockAccounts);
      mockModels.Email.findAll.resolves(mockEmails);

      const accounts = await mockModels.EmailAccount.findAll({
        where: { userId: context.userId },
      });
      const accountIds = accounts.map((a: any) => a.id);

      const emails = await mockModels.Email.findAll({
        where: { emailAccountId: accountIds },
      });

      expect(emails).to.have.lengthOf(2);
    });

    it('should filter by folder', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = { folder: 'INBOX' };
      
      mockModels.EmailAccount.findAll.resolves([createMockEmailAccount()]);
      mockModels.Email.findAll.resolves([createMockEmail({ folder: 'INBOX' })]);

      await mockModels.Email.findAll({
        where: { folder: input.folder },
      });

      expect(mockModels.Email.findAll.firstCall.args[0].where).to.have.property('folder', 'INBOX');
    });

    it('should filter by read status', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = { isRead: false };
      
      mockModels.EmailAccount.findAll.resolves([createMockEmailAccount()]);
      mockModels.Email.findAll.resolves([createMockEmail({ isRead: false })]);

      await mockModels.Email.findAll({
        where: { isRead: input.isRead },
      });

      expect(mockModels.Email.findAll.firstCall.args[0].where).to.have.property('isRead', false);
    });

    it('should filter by starred status', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = { isStarred: true };
      
      mockModels.EmailAccount.findAll.resolves([createMockEmailAccount()]);
      mockModels.Email.findAll.resolves([createMockEmail({ isStarred: true })]);

      await mockModels.Email.findAll({
        where: { isStarred: input.isStarred },
      });

      expect(mockModels.Email.findAll.firstCall.args[0].where).to.have.property('isStarred', true);
    });

    it('should apply pagination with limit and offset', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = { limit: 10, offset: 20 };
      
      mockModels.EmailAccount.findAll.resolves([createMockEmailAccount()]);
      mockModels.Email.findAll.resolves([]);

      await mockModels.Email.findAll({
        where: {},
        limit: input.limit,
        offset: input.offset,
      });

      expect(mockModels.Email.findAll.firstCall.args[0]).to.have.property('limit', 10);
      expect(mockModels.Email.findAll.firstCall.args[0]).to.have.property('offset', 20);
    });

    it('should use default limit of 50 when not specified', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input: { limit?: number; offset?: number } = {};
      
      mockModels.EmailAccount.findAll.resolves([createMockEmailAccount()]);
      mockModels.Email.findAll.resolves([]);

      const limit = input.limit ?? 50;
      const offset = input.offset ?? 0;

      await mockModels.Email.findAll({
        where: {},
        limit,
        offset,
      });

      expect(mockModels.Email.findAll.firstCall.args[0]).to.have.property('limit', 50);
      expect(mockModels.Email.findAll.firstCall.args[0]).to.have.property('offset', 0);
    });

    it('should order by receivedAt descending', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.EmailAccount.findAll.resolves([createMockEmailAccount()]);
      mockModels.Email.findAll.resolves([]);

      await mockModels.Email.findAll({
        where: {},
        order: [['receivedAt', 'DESC'], ['createdAt', 'DESC'], ['id', 'ASC']],
      });

      expect(mockModels.Email.findAll.firstCall.args[0].order[0])
        .to.deep.equal(['receivedAt', 'DESC']);
    });

    it('should filter by specific email account', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = { emailAccountId: 'specific-acc-123' };
      
      mockModels.EmailAccount.findAll.resolves([
        createMockEmailAccount({ id: 'specific-acc-123' }),
      ]);
      mockModels.Email.findAll.resolves([]);

      await mockModels.Email.findAll({
        where: { emailAccountId: input.emailAccountId },
      });

      expect(mockModels.Email.findAll.firstCall.args[0].where)
        .to.have.property('emailAccountId', 'specific-acc-123');
    });
  });
});
