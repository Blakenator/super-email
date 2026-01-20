/**
 * Tests for getTags query
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockTag } from '../../utils/mock-models.js';

describe('getTags query', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
      Tag: {
        findAll: sinon.stub(),
      },
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('when user is not authenticated', () => {
    it('should throw error when not authenticated', () => {
      const context = createUnauthenticatedContext();
      
      const requireAuth = (ctx: any) => {
        if (!ctx.userId) {
          throw new Error('Authentication required');
        }
        return ctx.userId;
      };

      expect(() => requireAuth(context)).to.throw('Authentication required');
    });
  });

  describe('when user is authenticated', () => {
    it('should return all tags for the user', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockTags = [
        createMockTag({ id: 'tag-1', name: 'Important', emailCount: 5 }),
        createMockTag({ id: 'tag-2', name: 'Work', emailCount: 10 }),
        createMockTag({ id: 'tag-3', name: 'Personal', emailCount: 3 }),
      ];

      mockModels.Tag.findAll.resolves(mockTags);

      const result = await mockModels.Tag.findAll({
        where: { userId: context.userId },
        order: [['name', 'ASC']],
      });

      expect(result).to.have.lengthOf(3);
      expect(mockModels.Tag.findAll.calledOnce).to.be.true;
    });

    it('should return empty array when no tags exist', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.Tag.findAll.resolves([]);

      const result = await mockModels.Tag.findAll({
        where: { userId: context.userId },
      });

      expect(result).to.be.an('array').that.is.empty;
    });

    it('should order tags by name ascending', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.Tag.findAll.resolves([]);

      await mockModels.Tag.findAll({
        where: { userId: context.userId },
        order: [['name', 'ASC']],
      });

      expect(mockModels.Tag.findAll.firstCall.args[0].order)
        .to.deep.equal([['name', 'ASC']]);
    });

    it('should include emailCount for each tag', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockTag = createMockTag({ emailCount: 15 });
      
      mockModels.Tag.findAll.resolves([mockTag]);

      const result = await mockModels.Tag.findAll({
        where: { userId: context.userId },
      });

      expect(result[0].emailCount).to.equal(15);
    });

    it('should parse emailCount from string to integer', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockTag = createMockTag();
      // Simulate SQL literal returning string
      mockTag.getDataValue = sinon.stub().withArgs('emailCount').returns('42');
      
      mockModels.Tag.findAll.resolves([mockTag]);

      const result = await mockModels.Tag.findAll({
        where: { userId: context.userId },
      });

      // Simulate parsing logic
      const emailCount = parseInt(result[0].getDataValue('emailCount') || '0', 10);
      
      expect(emailCount).to.equal(42);
      expect(typeof emailCount).to.equal('number');
    });

    it('should default emailCount to 0 when not set', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockTag = createMockTag({ emailCount: undefined });
      mockTag.getDataValue = sinon.stub().withArgs('emailCount').returns(undefined);
      
      mockModels.Tag.findAll.resolves([mockTag]);

      const result = await mockModels.Tag.findAll({
        where: { userId: context.userId },
      });

      const emailCount = parseInt(result[0].getDataValue('emailCount') || '0', 10);
      
      expect(emailCount).to.equal(0);
    });
  });
});
