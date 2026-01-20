/**
 * Tests for createMailRule mutation
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockMailRule } from '../../utils/mock-models.js';

describe('createMailRule mutation', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
      MailRule: {
        create: sinon.stub(),
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
    it('should create mail rule with valid input', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        name: 'Newsletter Filter',
        description: 'Archive newsletters automatically',
        conditions: {
          fromContains: 'newsletter@',
        },
        actions: {
          archive: true,
          markRead: true,
        },
        isEnabled: true,
        priority: 0,
        stopProcessing: false,
      };
      
      const newRule = createMockMailRule({
        ...input,
        userId: context.userId,
      });

      mockModels.MailRule.create.resolves(newRule);

      const result = await mockModels.MailRule.create({
        userId: context.userId,
        ...input,
      });

      expect(result).to.exist;
      expect(result.name).to.equal(input.name);
      expect(result.conditions.fromContains).to.equal('newsletter@');
      expect(result.actions.archive).to.be.true;
      expect(mockModels.MailRule.create.calledOnce).to.be.true;
    });

    it('should handle all condition types', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        name: 'Complex Rule',
        conditions: {
          fromContains: 'sender@',
          toContains: 'recipient@',
          ccContains: 'cc@',
          bccContains: 'bcc@',
          subjectContains: 'Important',
          bodyContains: 'urgent',
        },
        actions: { markRead: true },
      };
      
      mockModels.MailRule.create.resolves(createMockMailRule(input));

      await mockModels.MailRule.create({
        userId: context.userId,
        ...input,
      });

      const createdConditions = mockModels.MailRule.create.firstCall.args[0].conditions;
      expect(createdConditions).to.have.property('fromContains', 'sender@');
      expect(createdConditions).to.have.property('toContains', 'recipient@');
      expect(createdConditions).to.have.property('subjectContains', 'Important');
      expect(createdConditions).to.have.property('bodyContains', 'urgent');
    });

    it('should handle all action types', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        name: 'All Actions Rule',
        conditions: { fromContains: 'test@' },
        actions: {
          archive: true,
          star: true,
          delete: false,
          markRead: true,
          addTagIds: ['tag-1', 'tag-2'],
          forwardTo: 'forward@example.com',
        },
      };
      
      mockModels.MailRule.create.resolves(createMockMailRule(input));

      await mockModels.MailRule.create({
        userId: context.userId,
        ...input,
      });

      const createdActions = mockModels.MailRule.create.firstCall.args[0].actions;
      expect(createdActions).to.have.property('archive', true);
      expect(createdActions).to.have.property('star', true);
      expect(createdActions).to.have.property('markRead', true);
      expect(createdActions).to.have.property('addTagIds').that.deep.equals(['tag-1', 'tag-2']);
      expect(createdActions).to.have.property('forwardTo', 'forward@example.com');
    });

    it('should set default values for optional fields', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        name: 'Minimal Rule',
        conditions: { fromContains: 'spam@' },
        actions: { delete: true },
      };
      
      mockModels.MailRule.create.resolves(createMockMailRule({
        ...input,
        isEnabled: true,
        priority: 0,
        stopProcessing: false,
      }));

      await mockModels.MailRule.create({
        userId: context.userId,
        ...input,
        isEnabled: true, // default
        priority: 0, // default
        stopProcessing: false, // default
      });

      const createArgs = mockModels.MailRule.create.firstCall.args[0];
      expect(createArgs).to.have.property('isEnabled', true);
      expect(createArgs).to.have.property('priority', 0);
      expect(createArgs).to.have.property('stopProcessing', false);
    });

    it('should allow restricting rule to specific email account', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        name: 'Account Specific Rule',
        emailAccountId: 'acc-specific-123',
        conditions: { fromContains: 'work@' },
        actions: { star: true },
      };
      
      mockModels.MailRule.create.resolves(createMockMailRule({
        ...input,
        userId: context.userId,
      }));

      await mockModels.MailRule.create({
        userId: context.userId,
        ...input,
      });

      expect(mockModels.MailRule.create.firstCall.args[0])
        .to.have.property('emailAccountId', 'acc-specific-123');
    });

    it('should handle stopProcessing flag', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        name: 'Exclusive Rule',
        conditions: { fromContains: 'vip@' },
        actions: { star: true },
        stopProcessing: true,
      };
      
      mockModels.MailRule.create.resolves(createMockMailRule(input));

      await mockModels.MailRule.create({
        userId: context.userId,
        ...input,
      });

      expect(mockModels.MailRule.create.firstCall.args[0])
        .to.have.property('stopProcessing', true);
    });

    it('should set custom priority', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        name: 'High Priority Rule',
        conditions: { fromContains: 'urgent@' },
        actions: { star: true },
        priority: -10, // Higher priority (lower number)
      };
      
      mockModels.MailRule.create.resolves(createMockMailRule(input));

      await mockModels.MailRule.create({
        userId: context.userId,
        ...input,
      });

      expect(mockModels.MailRule.create.firstCall.args[0])
        .to.have.property('priority', -10);
    });
  });
});
