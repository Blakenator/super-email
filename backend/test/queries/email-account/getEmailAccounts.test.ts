/**
 * Tests for getEmailAccounts query
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods with sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { EmailAccount, SmtpProfile } from '../../../db/models/index.js';
import { getEmailAccounts } from '../../../queries/email-account/getEmailAccounts.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('getEmailAccounts query', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();
    try {
      await (getEmailAccounts as any)(null, {}, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should return email accounts for the user', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccounts = [
      { id: 'acc-1', name: 'Gmail' },
      { id: 'acc-2', name: 'Work' },
    ];

    sinon.stub(EmailAccount, 'findAll').resolves(mockAccounts as any);

    const result = await (getEmailAccounts as any)(null, {}, context);

    expect(result).to.deep.equal(mockAccounts);
  });

  it('should include defaultSmtpProfile and order by createdAt DESC', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const findAllStub = sinon.stub(EmailAccount, 'findAll').resolves([]);

    await (getEmailAccounts as any)(null, {}, context);

    expect(findAllStub.calledOnce).to.be.true;
    const queryArgs = findAllStub.firstCall.args[0] as any;
    expect(queryArgs.where).to.deep.include({ userId: 'user-123' });
    expect(queryArgs.order).to.deep.equal([['createdAt', 'DESC']]);
    // Should include defaultSmtpProfile association
    expect(queryArgs.include).to.be.an('array').with.lengthOf(1);
    expect(queryArgs.include[0]).to.deep.include({
      model: SmtpProfile,
      as: 'defaultSmtpProfile',
      required: false,
    });
  });

  it('should return empty array when no accounts exist', async () => {
    const context = createMockContext({ userId: 'user-123' });
    sinon.stub(EmailAccount, 'findAll').resolves([]);

    const result = await (getEmailAccounts as any)(null, {}, context);

    expect(result).to.be.an('array').that.is.empty;
  });
});
