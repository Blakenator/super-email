/**
 * Tests for getAuthenticationMethods query
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods with sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { AuthenticationMethod } from '../../../db/models/index.js';
import { getAuthenticationMethods } from '../../../queries/auth/getAuthenticationMethods.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('getAuthenticationMethods query', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();
    try {
      await (getAuthenticationMethods as any)(null, {}, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should return auth methods for the user', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockMethods = [
      { id: 'auth-1', provider: 'EMAIL_PASSWORD' },
      { id: 'auth-2', provider: 'GOOGLE' },
    ];

    sinon.stub(AuthenticationMethod, 'findAll').resolves(mockMethods as any);

    const result = await (getAuthenticationMethods as any)(null, {}, context);

    expect(result).to.deep.equal(mockMethods);
  });

  it('should query with correct where and order', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const findAllStub = sinon.stub(AuthenticationMethod, 'findAll').resolves([]);

    await (getAuthenticationMethods as any)(null, {}, context);

    const queryArgs = findAllStub.firstCall.args[0] as any;
    expect(queryArgs.where).to.deep.include({ userId: 'user-123' });
    expect(queryArgs.order).to.deep.equal([['createdAt', 'DESC']]);
  });

  it('should return empty array when no methods exist', async () => {
    const context = createMockContext({ userId: 'user-123' });
    sinon.stub(AuthenticationMethod, 'findAll').resolves([]);

    const result = await (getAuthenticationMethods as any)(null, {}, context);

    expect(result).to.be.an('array').that.is.empty;
  });
});
