/**
 * Tag Integration Tests
 * 
 * Tests the Tag GraphQL queries and mutations against the actual server.
 */

import { expect } from 'chai';
import {
  executeAuthenticatedOperation,
  executeUnauthenticatedOperation,
  createTestUser,
  cleanupTestData,
  TEST_USER_ID,
} from './server-setup.js';

describe('Tag Integration Tests', function () {
  this.timeout(30000);

  before(async () => {
    // Create test user once for all tests
    await cleanupTestData();
    await createTestUser();
  });

  beforeEach(async () => {
    // Only clean up tags between tests, not everything
    const { sequelize } = await import('../../db/database.js');
    await sequelize.models.Tag?.destroy({ where: {}, force: true });
  });

  describe('Query: getTags', () => {
    it('should return empty array when no tags exist', async () => {
      const result = await executeAuthenticatedOperation(`
        query GetTags {
          getTags {
            id
            name
            color
            emailCount
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getTags).to.be.an('array').that.is.empty;
    });

    it('should return created tags', async () => {
      // First create a tag
      await executeAuthenticatedOperation(`
        mutation CreateTag($input: CreateTagInput!) {
          createTag(input: $input) {
            id
            name
            color
          }
        }
      `, {
        input: { name: 'Important', color: '#ff0000' },
      });

      // Then query for tags
      const result = await executeAuthenticatedOperation(`
        query GetTags {
          getTags {
            id
            name
            color
            emailCount
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getTags).to.have.lengthOf(1);
      expect(data.getTags[0].name).to.equal('Important');
      expect(data.getTags[0].color).to.equal('#ff0000');
      expect(data.getTags[0].emailCount).to.equal(0);
    });

    it('should require authentication', async () => {
      const result = await executeUnauthenticatedOperation(`
        query GetTags {
          getTags {
            id
            name
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
      // Check for any auth-related error message
      expect(errors[0].message.toLowerCase()).to.satisfy((msg: string) => 
        msg.includes('authenticated') || msg.includes('authentication')
      );
    });
  });

  describe('Mutation: createTag', () => {
    it('should create a new tag', async () => {
      const result = await executeAuthenticatedOperation(`
        mutation CreateTag($input: CreateTagInput!) {
          createTag(input: $input) {
            id
            name
            color
          }
        }
      `, {
        input: { name: 'Work', color: '#0000ff' },
      });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.createTag).to.have.property('id');
      expect(data.createTag.name).to.equal('Work');
      expect(data.createTag.color).to.equal('#0000ff');
    });

    it('should use default color if not provided', async () => {
      const result = await executeAuthenticatedOperation(`
        mutation CreateTag($input: CreateTagInput!) {
          createTag(input: $input) {
            id
            name
            color
          }
        }
      `, {
        input: { name: 'Personal' },
      });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.createTag.name).to.equal('Personal');
      // Default color should be set
      expect(data.createTag.color).to.be.a('string');
    });

    it('should require authentication', async () => {
      const result = await executeUnauthenticatedOperation(`
        mutation CreateTag($input: CreateTagInput!) {
          createTag(input: $input) {
            id
            name
          }
        }
      `, {
        input: { name: 'Test' },
      });

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
    });
  });

  describe('Mutation: updateTag', () => {
    it('should update an existing tag', async () => {
      // Create a tag first
      const createResult = await executeAuthenticatedOperation(`
        mutation CreateTag($input: CreateTagInput!) {
          createTag(input: $input) {
            id
            name
            color
          }
        }
      `, {
        input: { name: 'Old Name', color: '#000000' },
      });

      const tagId = (createResult.body as any).singleResult.data.createTag.id;

      // Update the tag - note: updateTag takes input with id inside
      const result = await executeAuthenticatedOperation(`
        mutation UpdateTag($input: UpdateTagInput!) {
          updateTag(input: $input) {
            id
            name
            color
          }
        }
      `, {
        input: { id: tagId, name: 'New Name', color: '#ffffff' },
      });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.updateTag.name).to.equal('New Name');
      expect(data.updateTag.color).to.equal('#ffffff');
    });
  });

  describe('Mutation: deleteTag', () => {
    it('should delete an existing tag', async () => {
      // Create a tag first
      const createResult = await executeAuthenticatedOperation(`
        mutation CreateTag($input: CreateTagInput!) {
          createTag(input: $input) {
            id
          }
        }
      `, {
        input: { name: 'To Delete' },
      });

      const tagId = (createResult.body as any).singleResult.data.createTag.id;

      // Delete the tag
      const result = await executeAuthenticatedOperation(`
        mutation DeleteTag($id: String!) {
          deleteTag(id: $id)
        }
      `, { id: tagId });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.deleteTag).to.be.true;

      // Verify tag is deleted
      const getResult = await executeAuthenticatedOperation(`
        query GetTags {
          getTags {
            id
          }
        }
      `);
      const tags = (getResult.body as any).singleResult.data.getTags;
      expect(tags).to.be.an('array').that.is.empty;
    });

    it('should throw error for non-existent tag', async () => {
      const result = await executeAuthenticatedOperation(`
        mutation DeleteTag($id: String!) {
          deleteTag(id: $id)
        }
      `, { id: '00000000-0000-0000-0000-999999999999' });

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
      expect(errors[0].message).to.include('not found');
    });
  });
});
