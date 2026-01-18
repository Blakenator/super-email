/**
 * MailRule Integration Tests
 * 
 * Tests the MailRule GraphQL queries and mutations against the actual server.
 */

import { expect } from 'chai';
import {
  executeAuthenticatedOperation,
  executeUnauthenticatedOperation,
  cleanupTestData,
  createTestUser,
  TEST_USER_ID,
} from './server-setup.js';
import { sequelize } from '../../db/database.js';

describe('MailRule Integration Tests', function () {
  this.timeout(30000);

  before(async () => {
    await cleanupTestData();
    await createTestUser();
  });

  beforeEach(async () => {
    // Clean up mail rules between tests
    await sequelize.models.MailRule?.destroy({ where: {}, force: true });
  });

  describe('Query: getMailRules', () => {
    it('should return empty array when no rules exist', async () => {
      const result = await executeAuthenticatedOperation(`
        query GetMailRules {
          getMailRules {
            id
            name
            isEnabled
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getMailRules).to.be.an('array').that.is.empty;
    });

    it('should return created mail rules', async () => {
      const MailRule = sequelize.models.MailRule;
      await MailRule.create({
        userId: TEST_USER_ID,
        name: 'Auto-Archive',
        isEnabled: true,
        conditions: JSON.stringify({ fromContains: 'newsletter@' }),
        actions: JSON.stringify({ archive: true }),
      });

      const result = await executeAuthenticatedOperation(`
        query GetMailRules {
          getMailRules {
            id
            name
            isEnabled
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getMailRules).to.have.lengthOf(1);
      expect(data.getMailRules[0].name).to.equal('Auto-Archive');
      expect(data.getMailRules[0].isEnabled).to.be.true;
    });

    it('should require authentication', async () => {
      const result = await executeUnauthenticatedOperation(`
        query GetMailRules {
          getMailRules {
            id
            name
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
    });
  });

  describe('Query: getMailRule', () => {
    it('should return a specific mail rule', async () => {
      const MailRule = sequelize.models.MailRule;
      const rule = await MailRule.create({
        userId: TEST_USER_ID,
        name: 'Specific Rule',
        isEnabled: false,
        conditions: JSON.stringify({ subjectContains: 'test' }),
        actions: JSON.stringify({ markRead: true }),
      });
      const ruleId = (rule as any).id;

      const result = await executeAuthenticatedOperation(`
        query GetMailRule($id: String!) {
          getMailRule(id: $id) {
            id
            name
            isEnabled
          }
        }
      `, { id: ruleId });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getMailRule).to.not.be.null;
      expect(data.getMailRule.name).to.equal('Specific Rule');
      expect(data.getMailRule.isEnabled).to.be.false;
    });

    it('should return null for non-existent rule', async () => {
      const result = await executeAuthenticatedOperation(`
        query GetMailRule($id: String!) {
          getMailRule(id: $id) {
            id
            name
          }
        }
      `, { id: '00000000-0000-0000-0000-999999999999' });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getMailRule).to.be.null;
    });
  });

  describe('Mutation: deleteMailRule', () => {
    it('should delete an existing mail rule', async () => {
      const MailRule = sequelize.models.MailRule;
      const rule = await MailRule.create({
        userId: TEST_USER_ID,
        name: 'To Delete',
        isEnabled: true,
        conditions: JSON.stringify({}),
        actions: JSON.stringify({}),
      });
      const ruleId = (rule as any).id;

      const result = await executeAuthenticatedOperation(`
        mutation DeleteMailRule($id: String!) {
          deleteMailRule(id: $id)
        }
      `, { id: ruleId });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.deleteMailRule).to.be.true;

      // Verify it's deleted
      const deleted = await MailRule.findByPk(ruleId);
      expect(deleted).to.be.null;
    });

    it('should throw error for non-existent rule', async () => {
      const result = await executeAuthenticatedOperation(`
        mutation DeleteMailRule($id: String!) {
          deleteMailRule(id: $id)
        }
      `, { id: '00000000-0000-0000-0000-999999999999' });

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
    });
  });
});
