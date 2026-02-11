/**
 * Tests for createMailRule mutation
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods with sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { MailRule, EmailAccount } from '../../../db/models/index.js';
import { createMailRule } from '../../../mutations/mail-rule/createMailRule.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('createMailRule mutation', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();

    try {
      await (createMailRule as any)(null, { input: { name: 'Test' } }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should create mail rule with valid input', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = {
      name: 'Newsletter Filter',
      description: 'Archive newsletters',
      conditions: { fromContains: 'newsletter@' },
      actions: { archive: true, markRead: true },
      isEnabled: true,
      priority: 5,
      stopProcessing: false,
    };

    const mockRule = { id: 'rule-1', ...input, userId: 'user-123' };
    const mockRuleWithAccount = { ...mockRule, EmailAccount: null };

    const createStub = sinon.stub(MailRule, 'create').resolves(mockRule as any);
    sinon.stub(MailRule, 'findByPk').resolves(mockRuleWithAccount as any);

    const result = await (createMailRule as any)(null, { input }, context);

    expect(createStub.calledOnce).to.be.true;
    const createArgs = createStub.firstCall.args[0] as any;
    expect(createArgs.userId).to.equal('user-123');
    expect(createArgs.name).to.equal('Newsletter Filter');
    expect(createArgs.conditions).to.deep.equal({ fromContains: 'newsletter@' });
    expect(createArgs.actions).to.deep.equal({ archive: true, markRead: true });
    expect(createArgs.isEnabled).to.equal(true);
    expect(createArgs.priority).to.equal(5);
    expect(createArgs.stopProcessing).to.equal(false);

    expect(result).to.equal(mockRuleWithAccount);
  });

  it('should validate emailAccountId belongs to user', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = {
      name: 'Account Rule',
      emailAccountId: 'acc-123',
      conditions: { fromContains: 'test@' },
      actions: { star: true },
    };

    // Account not found for this user
    sinon.stub(EmailAccount, 'findOne').resolves(null);

    try {
      await (createMailRule as any)(null, { input }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Email account not found');
    }
  });

  it('should allow creation when emailAccountId belongs to user', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = {
      name: 'Account Rule',
      emailAccountId: 'acc-123',
      conditions: { fromContains: 'test@' },
      actions: { star: true },
    };

    const mockAccount = { id: 'acc-123', userId: 'user-123' };
    sinon.stub(EmailAccount, 'findOne').resolves(mockAccount as any);

    const mockRule = { id: 'rule-2', ...input, userId: 'user-123' };
    const createStub = sinon.stub(MailRule, 'create').resolves(mockRule as any);
    sinon.stub(MailRule, 'findByPk').resolves(mockRule as any);

    await (createMailRule as any)(null, { input }, context);

    expect(createStub.calledOnce).to.be.true;
    expect(createStub.firstCall.args[0]).to.have.property('emailAccountId', 'acc-123');
  });

  it('should set default values for optional fields', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = {
      name: 'Minimal Rule',
      conditions: { fromContains: 'spam@' },
      actions: { delete: true },
    };

    const mockRule = { id: 'rule-3' };

    const createStub = sinon.stub(MailRule, 'create').resolves(mockRule as any);
    sinon.stub(MailRule, 'findByPk').resolves(mockRule as any);

    await (createMailRule as any)(null, { input }, context);

    const createArgs = createStub.firstCall.args[0] as any;
    expect(createArgs.isEnabled).to.equal(true); // default: !== false
    expect(createArgs.priority).to.equal(0); // default: ?? 0
    expect(createArgs.stopProcessing).to.equal(false); // default: ?? false
    expect(createArgs.emailAccountId).to.be.null; // default: || null
    expect(createArgs.description).to.be.null; // default: || null
  });

  it('should return result from findByPk with EmailAccount include', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = {
      name: 'Test',
      conditions: { fromContains: 'test@' },
      actions: { star: true },
    };

    const mockRule = { id: 'rule-4' };
    const mockRuleWithIncludes = { id: 'rule-4', EmailAccount: null };

    sinon.stub(MailRule, 'create').resolves(mockRule as any);
    const findByPkStub = sinon.stub(MailRule, 'findByPk').resolves(mockRuleWithIncludes as any);

    const result = await (createMailRule as any)(null, { input }, context);

    expect(findByPkStub.calledOnce).to.be.true;
    expect(findByPkStub.firstCall.args[0]).to.equal('rule-4');
    expect(findByPkStub.firstCall.args[1]).to.deep.include({ include: [EmailAccount] });
    expect(result).to.equal(mockRuleWithIncludes);
  });
});
