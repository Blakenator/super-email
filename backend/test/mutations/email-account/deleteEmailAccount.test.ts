/**
 * Tests for deleteEmailAccount mutation
 *
 * Tests the REAL resolver by importing it via esmock to mock
 * helper module dependencies while keeping model stubs via sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import { EmailAccount, Email } from '../../../db/models/index.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('deleteEmailAccount mutation', () => {
  let deleteEmailAccount: any;
  let deleteImapCredentialsStub: sinon.SinonStub;
  let recalculateUserUsageStub: sinon.SinonStub;

  beforeEach(async () => {
    deleteImapCredentialsStub = sinon.stub().resolves();
    recalculateUserUsageStub = sinon.stub().resolves();

    const mod = await esmock(
      '../../../mutations/email-account/deleteEmailAccount.js',
      {
        '../../../helpers/secrets.js': {
          deleteImapCredentials: deleteImapCredentialsStub,
        },
        '../../../helpers/usage-calculator.js': {
          recalculateUserUsage: recalculateUserUsageStub,
        },
      },
    );
    deleteEmailAccount = mod.deleteEmailAccount;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();

    try {
      await deleteEmailAccount(null, { id: 'acc-1' }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should throw when account not found', async () => {
    const context = createMockContext({ userId: 'user-123' });
    sinon.stub(EmailAccount, 'findOne').resolves(null);

    try {
      await deleteEmailAccount(null, { id: 'nonexistent' }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Email account not found');
    }
  });

  it('should delete account and all associated data in correct order', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const callOrder: string[] = [];

    const mockAccount = {
      id: 'acc-123',
      email: 'test@example.com',
      userId: 'user-123',
      destroy: sinon.stub().callsFake(async () => { callOrder.push('account.destroy'); }),
    };

    sinon.stub(EmailAccount, 'findOne').resolves(mockAccount as any);
    sinon.stub(Email, 'destroy').callsFake(async () => { callOrder.push('Email.destroy'); return 0; });
    deleteImapCredentialsStub.callsFake(async () => { callOrder.push('deleteCredentials'); });
    recalculateUserUsageStub.callsFake(async () => { callOrder.push('recalculateUsage'); });

    const result = await deleteEmailAccount(null, { id: 'acc-123' }, context);

    expect(callOrder).to.deep.equal([
      'Email.destroy',
      'deleteCredentials',
      'account.destroy',
      'recalculateUsage',
    ]);

    expect(result).to.be.true;
  });

  it('should find account by id and userId', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccount = {
      id: 'acc-123',
      email: 'test@example.com',
      userId: 'user-123',
      destroy: sinon.stub().resolves(),
    };

    const findOneStub = sinon.stub(EmailAccount, 'findOne').resolves(mockAccount as any);
    sinon.stub(Email, 'destroy').resolves(0);

    await deleteEmailAccount(null, { id: 'acc-123' }, context);

    expect(findOneStub.firstCall.args[0]).to.deep.include({
      where: { id: 'acc-123', userId: 'user-123' },
    });
  });

  it('should delete emails by emailAccountId', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccount = {
      id: 'acc-123',
      email: 'test@example.com',
      userId: 'user-123',
      destroy: sinon.stub().resolves(),
    };

    sinon.stub(EmailAccount, 'findOne').resolves(mockAccount as any);
    const emailDestroyStub = sinon.stub(Email, 'destroy').resolves(0);

    await deleteEmailAccount(null, { id: 'acc-123' }, context);

    expect(emailDestroyStub.firstCall.args[0]).to.deep.include({
      where: { emailAccountId: 'acc-123' },
    });
  });

  it('should delete IMAP credentials for the account', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccount = {
      id: 'acc-123',
      email: 'test@example.com',
      userId: 'user-123',
      destroy: sinon.stub().resolves(),
    };

    sinon.stub(EmailAccount, 'findOne').resolves(mockAccount as any);
    sinon.stub(Email, 'destroy').resolves(0);

    await deleteEmailAccount(null, { id: 'acc-123' }, context);

    expect(deleteImapCredentialsStub.calledOnce).to.be.true;
    expect(deleteImapCredentialsStub.firstCall.args[0]).to.equal('acc-123');
  });

  it('should recalculate user usage after deletion', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccount = {
      id: 'acc-123',
      email: 'test@example.com',
      userId: 'user-123',
      destroy: sinon.stub().resolves(),
    };

    sinon.stub(EmailAccount, 'findOne').resolves(mockAccount as any);
    sinon.stub(Email, 'destroy').resolves(0);

    await deleteEmailAccount(null, { id: 'acc-123' }, context);

    expect(recalculateUserUsageStub.calledOnce).to.be.true;
    expect(recalculateUserUsageStub.firstCall.args[0]).to.equal('user-123');
  });
});
