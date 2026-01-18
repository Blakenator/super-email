/**
 * SmtpProfile Integration Tests
 * 
 * Tests the SmtpProfile GraphQL queries and mutations against the actual server.
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

// Helper to create a valid SMTP profile
const createSmtpProfileData = (overrides: Record<string, any> = {}) => ({
  name: 'Test SMTP',
  host: 'smtp.example.com',
  port: 587,
  username: 'user@example.com',
  password: 'password123',
  email: 'user@example.com',
  useSsl: true,
  ...overrides,
});

describe('SmtpProfile Integration Tests', function () {
  this.timeout(30000);

  before(async () => {
    await cleanupTestData();
    await createTestUser();
  });

  beforeEach(async () => {
    // Clean up SMTP profiles between tests
    await sequelize.models.SmtpProfile?.destroy({ where: {}, force: true });
  });

  describe('Query: getSmtpProfiles', () => {
    it('should return empty array when no profiles exist', async () => {
      const result = await executeAuthenticatedOperation(`
        query GetSmtpProfiles {
          getSmtpProfiles {
            id
            name
            host
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getSmtpProfiles).to.be.an('array').that.is.empty;
    });

    it('should return created SMTP profiles', async () => {
      const SmtpProfile = sequelize.models.SmtpProfile;
      await SmtpProfile.create(createSmtpProfileData({
        userId: TEST_USER_ID,
        name: 'Work SMTP',
        host: 'smtp.work.com',
      }));

      const result = await executeAuthenticatedOperation(`
        query GetSmtpProfiles {
          getSmtpProfiles {
            id
            name
            host
            port
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getSmtpProfiles).to.have.lengthOf(1);
      expect(data.getSmtpProfiles[0].name).to.equal('Work SMTP');
      expect(data.getSmtpProfiles[0].host).to.equal('smtp.work.com');
    });

    it('should require authentication', async () => {
      const result = await executeUnauthenticatedOperation(`
        query GetSmtpProfiles {
          getSmtpProfiles {
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

  describe('Query: getSmtpProfile', () => {
    it('should return a specific SMTP profile', async () => {
      const SmtpProfile = sequelize.models.SmtpProfile;
      const profile = await SmtpProfile.create(createSmtpProfileData({
        userId: TEST_USER_ID,
        name: 'Specific SMTP',
      }));
      const profileId = (profile as any).id;

      const result = await executeAuthenticatedOperation(`
        query GetSmtpProfile($id: String!) {
          getSmtpProfile(id: $id) {
            id
            name
            host
            port
          }
        }
      `, { id: profileId });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getSmtpProfile).to.not.be.null;
      expect(data.getSmtpProfile.name).to.equal('Specific SMTP');
    });

    it('should return null for non-existent profile', async () => {
      const result = await executeAuthenticatedOperation(`
        query GetSmtpProfile($id: String!) {
          getSmtpProfile(id: $id) {
            id
            name
          }
        }
      `, { id: '00000000-0000-0000-0000-999999999999' });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getSmtpProfile).to.be.null;
    });
  });

  describe('Mutation: deleteSmtpProfile', () => {
    it('should delete an existing SMTP profile', async () => {
      const SmtpProfile = sequelize.models.SmtpProfile;
      const profile = await SmtpProfile.create(createSmtpProfileData({
        userId: TEST_USER_ID,
        name: 'To Delete',
      }));
      const profileId = (profile as any).id;

      const result = await executeAuthenticatedOperation(`
        mutation DeleteSmtpProfile($id: String!) {
          deleteSmtpProfile(id: $id)
        }
      `, { id: profileId });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.deleteSmtpProfile).to.be.true;

      // Verify it's deleted
      const deleted = await SmtpProfile.findByPk(profileId);
      expect(deleted).to.be.null;
    });

    it('should throw error for non-existent profile', async () => {
      const result = await executeAuthenticatedOperation(`
        mutation DeleteSmtpProfile($id: String!) {
          deleteSmtpProfile(id: $id)
        }
      `, { id: '00000000-0000-0000-0000-999999999999' });

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
    });
  });
});
