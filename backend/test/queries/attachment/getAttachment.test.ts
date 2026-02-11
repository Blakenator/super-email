/**
 * Tests for getAttachment query
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods with sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { Attachment } from '../../../db/models/attachment.model.js';
import { getAttachment } from '../../../queries/attachment/getAttachment.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('getAttachment query', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();
    try {
      await (getAttachment as any)(null, { id: 'att-1' }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should return attachment when found', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAttachment = { id: 'att-1', filename: 'doc.pdf', mimeType: 'application/pdf' };

    sinon.stub(Attachment, 'findOne').resolves(mockAttachment as any);

    const result = await (getAttachment as any)(null, { id: 'att-1' }, context);

    expect(result).to.equal(mockAttachment);
  });

  it('should throw when attachment not found', async () => {
    const context = createMockContext({ userId: 'user-123' });
    sinon.stub(Attachment, 'findOne').resolves(null);

    try {
      await (getAttachment as any)(null, { id: 'nonexistent' }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Attachment not found');
    }
  });

  it('should query with nested includes for ownership verification', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const findOneStub = sinon.stub(Attachment, 'findOne').resolves({ id: 'att-1' } as any);

    await (getAttachment as any)(null, { id: 'att-1' }, context);

    const queryArgs = findOneStub.firstCall.args[0] as any;
    expect(queryArgs.where).to.deep.include({ id: 'att-1' });
    // Should include Email -> EmailAccount ownership chain
    expect(queryArgs.include).to.be.an('array');
    expect(queryArgs.include[0].include[0].where).to.deep.include({ userId: 'user-123' });
  });
});
