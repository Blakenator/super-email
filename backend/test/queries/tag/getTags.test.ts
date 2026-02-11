/**
 * Tests for getTags query
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods with sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { Tag } from '../../../db/models/index.js';
import { getTags } from '../../../queries/tag/getTags.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('getTags query', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();
    try {
      await (getTags as any)(null, {}, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should return tags with parsed emailCount', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockTags = [
      { toJSON: () => ({ id: 'tag-1', name: 'Important' }), getDataValue: sinon.stub().returns('5') },
      { toJSON: () => ({ id: 'tag-2', name: 'Work' }), getDataValue: sinon.stub().returns('10') },
    ];

    sinon.stub(Tag, 'findAll').resolves(mockTags as any);

    const result = await (getTags as any)(null, {}, context);

    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.deep.include({ id: 'tag-1', name: 'Important', emailCount: 5 });
    expect(result[1]).to.deep.include({ id: 'tag-2', name: 'Work', emailCount: 10 });
  });

  it('should default emailCount to 0 when not set', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockTag = { toJSON: () => ({ id: 'tag-1', name: 'Empty' }), getDataValue: sinon.stub().returns(undefined) };

    sinon.stub(Tag, 'findAll').resolves([mockTag] as any);

    const result = await (getTags as any)(null, {}, context);

    expect(result[0].emailCount).to.equal(0);
  });

  it('should return empty array when no tags exist', async () => {
    const context = createMockContext({ userId: 'user-123' });
    sinon.stub(Tag, 'findAll').resolves([]);

    const result = await (getTags as any)(null, {}, context);

    expect(result).to.be.an('array').that.is.empty;
  });

  it('should query tags with correct where and order', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const findAllStub = sinon.stub(Tag, 'findAll').resolves([]);

    await (getTags as any)(null, {}, context);

    expect(findAllStub.calledOnce).to.be.true;
    const queryArgs = findAllStub.firstCall.args[0] as any;
    expect(queryArgs.where).to.deep.include({ userId: 'user-123' });
    expect(queryArgs.order).to.deep.equal([['name', 'ASC']]);
  });
});
