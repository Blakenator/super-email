/**
 * Tests for deleteAuthenticationMethod mutation
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods with sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { AuthenticationMethod } from '../../../db/models/index.js';
import { deleteAuthenticationMethod } from '../../../mutations/auth/deleteAuthenticationMethod.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('deleteAuthenticationMethod mutation', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();

    try {
      await (deleteAuthenticationMethod as any)(null, { id: 'auth-1' }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should throw when auth method not found', async () => {
    const context = createMockContext({ userId: 'user-123' });
    sinon.stub(AuthenticationMethod, 'findOne').resolves(null);

    try {
      await (deleteAuthenticationMethod as any)(null, { id: 'nonexistent' }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication method not found');
    }
  });

  it('should throw when trying to delete last auth method', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAuthMethod = { id: 'auth-1', userId: 'user-123', destroy: sinon.stub() };

    sinon.stub(AuthenticationMethod, 'findOne').resolves(mockAuthMethod as any);
    sinon.stub(AuthenticationMethod, 'count').resolves(1);

    try {
      await (deleteAuthenticationMethod as any)(null, { id: 'auth-1' }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Cannot delete the last authentication method. Add another method first.');
    }

    // Verify destroy was NOT called
    expect(mockAuthMethod.destroy.called).to.be.false;
  });

  it('should delete auth method when user has multiple methods', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAuthMethod = { id: 'auth-1', userId: 'user-123', destroy: sinon.stub().resolves() };

    const findOneStub = sinon.stub(AuthenticationMethod, 'findOne').resolves(mockAuthMethod as any);
    sinon.stub(AuthenticationMethod, 'count').resolves(2);

    const result = await (deleteAuthenticationMethod as any)(null, { id: 'auth-1' }, context);

    // Verify findOne was called with correct where clause
    expect(findOneStub.firstCall.args[0]).to.deep.include({
      where: { id: 'auth-1', userId: 'user-123' },
    });

    // Verify destroy was called
    expect(mockAuthMethod.destroy.calledOnce).to.be.true;

    // Verify returns true
    expect(result).to.be.true;
  });

  it('should count methods for the correct user', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAuthMethod = { id: 'auth-1', userId: 'user-123', destroy: sinon.stub().resolves() };

    sinon.stub(AuthenticationMethod, 'findOne').resolves(mockAuthMethod as any);
    const countStub = sinon.stub(AuthenticationMethod, 'count').resolves(3);

    await (deleteAuthenticationMethod as any)(null, { id: 'auth-1' }, context);

    expect(countStub.firstCall.args[0]).to.deep.include({
      where: { userId: 'user-123' },
    });
  });
});
