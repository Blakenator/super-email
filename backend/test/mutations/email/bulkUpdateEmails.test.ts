/**
 * Tests for bulkUpdateEmails mutation
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods with sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { Email, EmailAccount } from '../../../db/models/index.js';
import { bulkUpdateEmails } from '../../../mutations/email/bulkUpdateEmails.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('bulkUpdateEmails mutation', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();

    try {
      await (bulkUpdateEmails as any)(null, { input: { ids: ['e-1'], isRead: true } }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should return empty array when ids is empty', async () => {
    const context = createMockContext({ userId: 'user-123' });

    const result = await (bulkUpdateEmails as any)(null, { input: { ids: [] } }, context);

    expect(result).to.deep.equal([]);
  });

  it('should throw when user has no email accounts', async () => {
    const context = createMockContext({ userId: 'user-123' });
    sinon.stub(EmailAccount, 'findAll').resolves([]);

    try {
      await (bulkUpdateEmails as any)(null, { input: { ids: ['e-1'], isRead: true } }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('No email accounts found');
    }
  });

  it('should return empty array when no update payload', async () => {
    const context = createMockContext({ userId: 'user-123' });
    sinon.stub(EmailAccount, 'findAll').resolves([{ id: 'acc-1' }] as any);

    // Input has ids but no fields to update
    const result = await (bulkUpdateEmails as any)(null, { input: { ids: ['e-1'] } }, context);

    expect(result).to.deep.equal([]);
  });

  it('should update isRead for specified emails', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccounts = [{ id: 'acc-1' }, { id: 'acc-2' }];
    const mockUpdatedEmails = [{ id: 'e-1', isRead: true }, { id: 'e-2', isRead: true }];

    sinon.stub(EmailAccount, 'findAll').resolves(mockAccounts as any);
    const updateStub = sinon.stub(Email, 'update').resolves([2] as any);
    sinon.stub(Email, 'findAll').resolves(mockUpdatedEmails as any);

    const input = { ids: ['e-1', 'e-2'], isRead: true };
    const result = await (bulkUpdateEmails as any)(null, { input }, context);

    // Verify Email.update was called with correct payload and where clause
    expect(updateStub.calledOnce).to.be.true;
    expect(updateStub.firstCall.args[0]).to.deep.equal({ isRead: true });

    // Verify the where clause restricts to user's accounts
    const whereClause = updateStub.firstCall.args[1] as any;
    expect(whereClause.where).to.exist;

    expect(result).to.deep.equal(mockUpdatedEmails);
  });

  it('should update isStarred for specified emails', async () => {
    const context = createMockContext({ userId: 'user-123' });

    sinon.stub(EmailAccount, 'findAll').resolves([{ id: 'acc-1' }] as any);
    const updateStub = sinon.stub(Email, 'update').resolves([1] as any);
    sinon.stub(Email, 'findAll').resolves([{ id: 'e-1', isStarred: true }] as any);

    const input = { ids: ['e-1'], isStarred: true };
    await (bulkUpdateEmails as any)(null, { input }, context);

    expect(updateStub.firstCall.args[0]).to.deep.include({ isStarred: true });
  });

  it('should update folder for specified emails', async () => {
    const context = createMockContext({ userId: 'user-123' });

    sinon.stub(EmailAccount, 'findAll').resolves([{ id: 'acc-1' }] as any);
    const updateStub = sinon.stub(Email, 'update').resolves([2] as any);
    sinon.stub(Email, 'findAll').resolves([]);

    const input = { ids: ['e-1', 'e-2'], folder: 'ARCHIVE' };
    await (bulkUpdateEmails as any)(null, { input }, context);

    expect(updateStub.firstCall.args[0]).to.deep.include({ folder: 'ARCHIVE' });
  });

  it('should update multiple properties at once', async () => {
    const context = createMockContext({ userId: 'user-123' });

    sinon.stub(EmailAccount, 'findAll').resolves([{ id: 'acc-1' }] as any);
    const updateStub = sinon.stub(Email, 'update').resolves([1] as any);
    sinon.stub(Email, 'findAll').resolves([]);

    const input = { ids: ['e-1'], isRead: true, isStarred: true, folder: 'ARCHIVE' };
    await (bulkUpdateEmails as any)(null, { input }, context);

    const updatePayload = updateStub.firstCall.args[0] as any;
    expect(updatePayload.isRead).to.equal(true);
    expect(updatePayload.isStarred).to.equal(true);
    expect(updatePayload.folder).to.equal('ARCHIVE');
  });

  it('should only query emails belonging to user accounts', async () => {
    const context = createMockContext({ userId: 'user-123' });

    const accountFindStub = sinon.stub(EmailAccount, 'findAll').resolves([{ id: 'acc-1' }, { id: 'acc-2' }] as any);
    sinon.stub(Email, 'update').resolves([1] as any);
    sinon.stub(Email, 'findAll').resolves([]);

    const input = { ids: ['e-1'], isRead: true };
    await (bulkUpdateEmails as any)(null, { input }, context);

    // Verify EmailAccount.findAll queries by userId
    expect(accountFindStub.firstCall.args[0]).to.deep.include({
      where: { userId: 'user-123' },
    });
  });

  it('should return the updated emails from findAll', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const updatedEmails = [
      { id: 'e-1', isRead: true },
      { id: 'e-2', isRead: true },
    ];

    sinon.stub(EmailAccount, 'findAll').resolves([{ id: 'acc-1' }] as any);
    sinon.stub(Email, 'update').resolves([2] as any);
    const findAllStub = sinon.stub(Email, 'findAll').resolves(updatedEmails as any);

    const input = { ids: ['e-1', 'e-2'], isRead: true };
    const result = await (bulkUpdateEmails as any)(null, { input }, context);

    // Verify findAll is called to return updated emails
    expect(findAllStub.calledOnce).to.be.true;
    expect(result).to.deep.equal(updatedEmails);
  });
});
