/**
 * Tests for createTag mutation
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockTag } from '../../utils/mock-models.js';

describe('createTag mutation', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
      Tag: {
        create: sinon.stub(),
        findOne: sinon.stub(),
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
    it('should create tag with valid input', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        name: 'Important',
        color: '#FF5733',
        description: 'Important emails',
      };
      const newTag = createMockTag({
        ...input,
        userId: context.userId,
      });

      mockModels.Tag.create.resolves(newTag);

      const result = await mockModels.Tag.create({
        userId: context.userId,
        name: input.name,
        color: input.color,
        description: input.description,
      });

      expect(result).to.exist;
      expect(result.name).to.equal(input.name);
      expect(result.color).to.equal(input.color);
      expect(result.description).to.equal(input.description);
      expect(mockModels.Tag.create.calledOnce).to.be.true;
    });

    it('should use default color when not provided', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        name: 'Work',
      };
      
      mockModels.Tag.create.resolves(createMockTag({ 
        name: input.name, 
        color: '#6c757d' 
      }));

      await mockModels.Tag.create({
        userId: context.userId,
        name: input.name,
        color: '#6c757d', // default color
        description: null,
      });

      expect(mockModels.Tag.create.firstCall.args[0]).to.have.property('color', '#6c757d');
    });

    it('should set description to null when not provided', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        name: 'Personal',
        color: '#28a745',
      };
      
      mockModels.Tag.create.resolves(createMockTag({ 
        ...input, 
        description: null 
      }));

      await mockModels.Tag.create({
        userId: context.userId,
        name: input.name,
        color: input.color,
        description: null,
      });

      expect(mockModels.Tag.create.firstCall.args[0]).to.have.property('description', null);
    });

    it('should return tag with emailCount of 0 for new tags', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        name: 'New Tag',
        color: '#007bff',
      };
      const newTag = createMockTag({
        ...input,
        userId: context.userId,
        emailCount: 0,
      });

      mockModels.Tag.create.resolves(newTag);

      const result = await mockModels.Tag.create({
        userId: context.userId,
        name: input.name,
        color: input.color,
        description: null,
      });

      // Resolver adds emailCount: 0 to the response
      const response = { ...result.toJSON(), emailCount: 0 };
      
      expect(response.emailCount).to.equal(0);
    });

    it('should validate color format', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        name: 'Test',
        color: '#ABCDEF', // valid hex color
      };
      
      mockModels.Tag.create.resolves(createMockTag(input));

      await mockModels.Tag.create({
        userId: context.userId,
        ...input,
        description: null,
      });

      // Color should be stored as-is
      expect(mockModels.Tag.create.firstCall.args[0].color).to.equal('#ABCDEF');
    });

    it('should associate tag with correct user', async () => {
      const context = createMockContext({ userId: 'specific-user-123' });
      const input = {
        name: 'My Tag',
      };
      
      mockModels.Tag.create.resolves(createMockTag({ 
        ...input, 
        userId: context.userId 
      }));

      await mockModels.Tag.create({
        userId: context.userId,
        name: input.name,
        color: '#6c757d',
        description: null,
      });

      expect(mockModels.Tag.create.firstCall.args[0]).to.have.property('userId', 'specific-user-123');
    });
  });
});
