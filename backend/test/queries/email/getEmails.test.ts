/**
 * Tests for getEmails query
 *
 * Tests the REAL resolver by importing it via esmock to mock
 * the startAsyncEmailSync helper.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import { Email, EmailAccount } from '../../../db/models/index.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('getEmails query', () => {
  let getEmails: any;

  beforeEach(async () => {
    const mod = await esmock(
      '../../../queries/email/getEmails.js',
      {
        '../../../helpers/email.js': {
          startAsyncEmailSync: sinon.stub().resolves(),
        },
      },
    );
    getEmails = mod.getEmails;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();
    try {
      await getEmails(null, { input: {} }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should return empty array when no email accounts exist', async () => {
    const context = createMockContext({ userId: 'user-123' });
    sinon.stub(EmailAccount, 'findAll').resolves([]);

    const result = await getEmails(null, { input: {} }, context);

    expect(result).to.deep.equal([]);
  });

  it('should return emails for user accounts', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccounts = [{ id: 'acc-1', lastSyncedAt: new Date() }];
    const mockEmails = [{ id: 'e-1' }, { id: 'e-2' }];

    sinon.stub(EmailAccount, 'findAll').resolves(mockAccounts as any);
    sinon.stub(Email, 'findAll').resolves(mockEmails as any);

    const result = await getEmails(null, { input: { folder: 'INBOX' } }, context);

    expect(result).to.deep.equal(mockEmails);
  });

  it('should apply default limit of 50 and offset of 0', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccounts = [{ id: 'acc-1', lastSyncedAt: new Date() }];

    sinon.stub(EmailAccount, 'findAll').resolves(mockAccounts as any);
    const emailFindAllStub = sinon.stub(Email, 'findAll').resolves([]);

    await getEmails(null, { input: {} }, context);

    const queryArgs = emailFindAllStub.firstCall.args[0] as any;
    expect(queryArgs.limit).to.equal(50);
    expect(queryArgs.offset).to.equal(0);
  });

  it('should use provided limit and offset', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccounts = [{ id: 'acc-1', lastSyncedAt: new Date() }];

    sinon.stub(EmailAccount, 'findAll').resolves(mockAccounts as any);
    const emailFindAllStub = sinon.stub(Email, 'findAll').resolves([]);

    await getEmails(null, { input: { limit: 10, offset: 20 } }, context);

    const queryArgs = emailFindAllStub.firstCall.args[0] as any;
    expect(queryArgs.limit).to.equal(10);
    expect(queryArgs.offset).to.equal(20);
  });

  it('should order by receivedAt DESC, createdAt DESC, id ASC', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccounts = [{ id: 'acc-1', lastSyncedAt: new Date() }];

    sinon.stub(EmailAccount, 'findAll').resolves(mockAccounts as any);
    const emailFindAllStub = sinon.stub(Email, 'findAll').resolves([]);

    await getEmails(null, { input: {} }, context);

    const queryArgs = emailFindAllStub.firstCall.args[0] as any;
    expect(queryArgs.order).to.deep.equal([
      ['receivedAt', 'DESC'],
      ['createdAt', 'DESC'],
      ['id', 'ASC'],
    ]);
  });
});
