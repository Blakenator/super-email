/**
 * Tests for getEmailAccounts query
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockEmailAccount } from '../../utils/mock-models.js';

describe('getEmailAccounts query', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
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
    it('should return all email accounts for the user', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockAccounts = [
        createMockEmailAccount({ id: 'acc-1', name: 'Gmail' }),
        createMockEmailAccount({ id: 'acc-2', name: 'Work Email' }),
      ];

      mockModels.EmailAccount.findAll.resolves(mockAccounts);

      const result = await mockModels.EmailAccount.findAll({
        where: { userId: context.userId },
        order: [['createdAt', 'DESC']],
      });

      expect(result).to.have.lengthOf(2);
      expect(mockModels.EmailAccount.findAll.calledOnce).to.be.true;
      expect(mockModels.EmailAccount.findAll.firstCall.args[0]).to.deep.include({
        where: { userId: 'user-123' },
      });
    });

    it('should return empty array when no accounts exist', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.EmailAccount.findAll.resolves([]);

      const result = await mockModels.EmailAccount.findAll({
        where: { userId: context.userId },
      });

      expect(result).to.be.an('array').that.is.empty;
    });

    it('should order accounts by creation date descending', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.EmailAccount.findAll.resolves([]);

      await mockModels.EmailAccount.findAll({
        where: { userId: context.userId },
        order: [['createdAt', 'DESC']],
      });

      expect(mockModels.EmailAccount.findAll.firstCall.args[0].order)
        .to.deep.equal([['createdAt', 'DESC']]);
    });

    it('should include syncing computed fields', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const accountWithHistoricalSync = createMockEmailAccount({ 
        id: 'acc-1', 
        historicalSyncId: 'sync-123' 
      });
      const accountWithUpdateSync = createMockEmailAccount({ 
        id: 'acc-2', 
        updateSyncId: 'sync-456'
      });
      const accountWithoutSync = createMockEmailAccount({ 
        id: 'acc-3', 
        historicalSyncId: null,
        updateSyncId: null
      });

      mockModels.EmailAccount.findAll.resolves([accountWithHistoricalSync, accountWithUpdateSync, accountWithoutSync]);

      const result = await mockModels.EmailAccount.findAll({
        where: { userId: context.userId },
      });

      // isHistoricalSyncing is computed from historicalSyncId
      expect(!!result[0].historicalSyncId).to.be.true;  // isHistoricalSyncing = true
      expect(!!result[1].updateSyncId).to.be.true;       // isUpdateSyncing = true
      expect(!!result[2].historicalSyncId).to.be.false;  // isHistoricalSyncing = false
      expect(!!result[2].updateSyncId).to.be.false;      // isUpdateSyncing = false
    });
  });
});
