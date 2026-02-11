/**
 * Tests for createTag mutation
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods with sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { Tag } from '../../../db/models/index.js';
import { createTag } from '../../../mutations/tag/createTag.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('createTag mutation', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();

    try {
      await (createTag as any)(null, { input: { name: 'Test' } }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should create a tag with the correct arguments', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = {
      name: 'Important',
      color: '#FF5733',
      description: 'Important emails',
    };

    const mockTag = {
      id: 'tag-1',
      userId: 'user-123',
      name: input.name,
      color: input.color,
      description: input.description,
      toJSON() {
        return { id: this.id, userId: this.userId, name: this.name, color: this.color, description: this.description };
      },
    };

    const createStub = sinon.stub(Tag, 'create').resolves(mockTag as any);

    const result = await (createTag as any)(null, { input }, context);

    // Verify Tag.create was called with the correct data
    expect(createStub.calledOnce).to.be.true;
    const createArgs = createStub.firstCall.args[0] as any;
    expect(createArgs.userId).to.equal('user-123');
    expect(createArgs.name).to.equal('Important');
    expect(createArgs.color).to.equal('#FF5733');
    expect(createArgs.description).to.equal('Important emails');

    // Verify the return value includes emailCount: 0
    expect(result).to.deep.include({
      id: 'tag-1',
      name: 'Important',
      color: '#FF5733',
      emailCount: 0,
    });
  });

  it('should use default color when not provided', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = { name: 'Work' };

    const mockTag = {
      id: 'tag-2',
      userId: 'user-123',
      name: 'Work',
      color: '#6c757d',
      description: null,
      toJSON() {
        return { id: this.id, userId: this.userId, name: this.name, color: this.color, description: this.description };
      },
    };

    const createStub = sinon.stub(Tag, 'create').resolves(mockTag as any);

    await (createTag as any)(null, { input }, context);

    // Verify default color was applied by the resolver
    const createArgs = createStub.firstCall.args[0] as any;
    expect(createArgs.color).to.equal('#6c757d');
  });

  it('should set description to null when not provided', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = { name: 'Personal', color: '#28a745' };

    const mockTag = {
      id: 'tag-3',
      userId: 'user-123',
      name: 'Personal',
      color: '#28a745',
      description: null,
      toJSON() {
        return { id: this.id, userId: this.userId, name: this.name, color: this.color, description: this.description };
      },
    };

    const createStub = sinon.stub(Tag, 'create').resolves(mockTag as any);

    await (createTag as any)(null, { input }, context);

    const createArgs = createStub.firstCall.args[0] as any;
    expect(createArgs.description).to.be.null;
  });

  it('should always return emailCount of 0 for new tags', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = { name: 'New Tag', color: '#007bff' };

    const mockTag = {
      id: 'tag-4',
      userId: 'user-123',
      name: 'New Tag',
      color: '#007bff',
      description: null,
      toJSON() {
        return { id: this.id, userId: this.userId, name: this.name, color: this.color, description: this.description };
      },
    };

    sinon.stub(Tag, 'create').resolves(mockTag as any);

    const result = await (createTag as any)(null, { input }, context);

    expect(result.emailCount).to.equal(0);
  });
});
