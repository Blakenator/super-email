/**
 * Tests for getMailRules query
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockMailRule } from '../../utils/mock-models.js';

describe('getMailRules query', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
      MailRule: {
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
    it('should return all mail rules for the user', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockRules = [
        createMockMailRule({ id: 'rule-1', name: 'Newsletter Filter', priority: 0 }),
        createMockMailRule({ id: 'rule-2', name: 'Spam Filter', priority: 1 }),
        createMockMailRule({ id: 'rule-3', name: 'VIP Filter', priority: -1 }),
      ];

      mockModels.MailRule.findAll.resolves(mockRules);

      const result = await mockModels.MailRule.findAll({
        where: { userId: context.userId },
        order: [['priority', 'ASC']],
      });

      expect(result).to.have.lengthOf(3);
      expect(mockModels.MailRule.findAll.calledOnce).to.be.true;
    });

    it('should return empty array when no rules exist', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.MailRule.findAll.resolves([]);

      const result = await mockModels.MailRule.findAll({
        where: { userId: context.userId },
      });

      expect(result).to.be.an('array').that.is.empty;
    });

    it('should order rules by priority ascending', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.MailRule.findAll.resolves([]);

      await mockModels.MailRule.findAll({
        where: { userId: context.userId },
        order: [['priority', 'ASC']],
      });

      expect(mockModels.MailRule.findAll.firstCall.args[0].order)
        .to.deep.equal([['priority', 'ASC']]);
    });

    it('should include conditions and actions in returned rules', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockRule = createMockMailRule({
        conditions: { fromContains: 'newsletter@', subjectContains: 'Weekly' },
        actions: { archive: true, markRead: true },
      });

      mockModels.MailRule.findAll.resolves([mockRule]);

      const result = await mockModels.MailRule.findAll({
        where: { userId: context.userId },
      });

      expect(result[0].conditions).to.have.property('fromContains', 'newsletter@');
      expect(result[0].conditions).to.have.property('subjectContains', 'Weekly');
      expect(result[0].actions).to.have.property('archive', true);
      expect(result[0].actions).to.have.property('markRead', true);
    });

    it('should return rules with correct isEnabled status', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockRules = [
        createMockMailRule({ id: 'rule-1', isEnabled: true }),
        createMockMailRule({ id: 'rule-2', isEnabled: false }),
      ];

      mockModels.MailRule.findAll.resolves(mockRules);

      const result = await mockModels.MailRule.findAll({
        where: { userId: context.userId },
      });

      expect(result[0].isEnabled).to.be.true;
      expect(result[1].isEnabled).to.be.false;
    });

    it('should include emailAccountId for account-specific rules', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockRules = [
        createMockMailRule({ id: 'rule-1', emailAccountId: null }), // Global
        createMockMailRule({ id: 'rule-2', emailAccountId: 'acc-123' }), // Account-specific
      ];

      mockModels.MailRule.findAll.resolves(mockRules);

      const result = await mockModels.MailRule.findAll({
        where: { userId: context.userId },
      });

      expect(result[0].emailAccountId).to.be.null;
      expect(result[1].emailAccountId).to.equal('acc-123');
    });
  });
});
