/**
 * Tests for getContacts query
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods with sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { Contact, ContactEmail } from '../../../db/models/index.js';
import { getContacts } from '../../../queries/contact/getContacts.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('getContacts query', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();
    try {
      await (getContacts as any)(null, {}, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should return contacts for the user', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockContacts = [
      { id: 'c-1', name: 'Alice' },
      { id: 'c-2', name: 'Bob' },
    ];

    sinon.stub(Contact, 'findAll').resolves(mockContacts as any);

    const result = await (getContacts as any)(null, {}, context);

    expect(result).to.deep.equal(mockContacts);
  });

  it('should query with correct includes and ordering', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const findAllStub = sinon.stub(Contact, 'findAll').resolves([]);

    await (getContacts as any)(null, {}, context);

    expect(findAllStub.calledOnce).to.be.true;
    const queryArgs = findAllStub.firstCall.args[0] as any;
    expect(queryArgs.where).to.deep.include({ userId: 'user-123' });
    expect(queryArgs.include).to.deep.equal([ContactEmail]);
    expect(queryArgs.order).to.deep.equal([['name', 'ASC'], ['email', 'ASC']]);
  });

  it('should return empty array when no contacts exist', async () => {
    const context = createMockContext({ userId: 'user-123' });
    sinon.stub(Contact, 'findAll').resolves([]);

    const result = await (getContacts as any)(null, {}, context);

    expect(result).to.be.an('array').that.is.empty;
  });
});
