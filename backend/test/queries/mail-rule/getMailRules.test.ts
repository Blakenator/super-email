/**
 * Tests for getMailRules query
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods with sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { MailRule, EmailAccount } from '../../../db/models/index.js';
import { getMailRules } from '../../../queries/mail-rule/getMailRules.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('getMailRules query', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();
    try {
      await (getMailRules as any)(null, {}, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should return mail rules for the user', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockRules = [
      { id: 'rule-1', name: 'Newsletter', priority: -1 },
      { id: 'rule-2', name: 'Spam Filter', priority: 0 },
    ];

    sinon.stub(MailRule, 'findAll').resolves(mockRules as any);

    const result = await (getMailRules as any)(null, {}, context);

    expect(result).to.deep.equal(mockRules);
  });

  it('should include EmailAccount and order by priority ASC, name ASC', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const findAllStub = sinon.stub(MailRule, 'findAll').resolves([]);

    await (getMailRules as any)(null, {}, context);

    const queryArgs = findAllStub.firstCall.args[0] as any;
    expect(queryArgs.where).to.deep.include({ userId: 'user-123' });
    expect(queryArgs.include).to.deep.equal([EmailAccount]);
    expect(queryArgs.order).to.deep.equal([['priority', 'ASC'], ['name', 'ASC']]);
  });

  it('should return empty array when no rules exist', async () => {
    const context = createMockContext({ userId: 'user-123' });
    sinon.stub(MailRule, 'findAll').resolves([]);

    const result = await (getMailRules as any)(null, {}, context);

    expect(result).to.be.an('array').that.is.empty;
  });
});
