/**
 * SendProfile Integration Tests
 *
 * Tests the SendProfile GraphQL queries and mutations against the actual server.
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

const createSendProfileData = (overrides: Record<string, any> = {}) => ({
  name: 'Test Send Profile',
  email: 'user@example.com',
  type: 'SMTP',
  userId: TEST_USER_ID,
  ...overrides,
});

const createSmtpSettingsData = (overrides: Record<string, any> = {}) => ({
  host: 'smtp.example.com',
  port: 587,
  useSsl: true,
  ...overrides,
});

describe('SendProfile Integration Tests', function () {
  this.timeout(30000);

  before(async () => {
    await cleanupTestData();
    await createTestUser();
  });

  beforeEach(async () => {
    await sequelize.models.SmtpAccountSettings?.destroy({ where: {}, force: true });
    await sequelize.models.SendProfile?.destroy({ where: {}, force: true });
  });

  describe('Query: getSendProfiles', () => {
    it('should return empty array when no profiles exist', async () => {
      const result = await executeAuthenticatedOperation(`
        query GetSendProfiles {
          getSendProfiles {
            id
            name
            email
            type
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getSendProfiles).to.be.an('array').that.is.empty;
    });

    it('should return created send profiles', async () => {
      const SendProfile = sequelize.models.SendProfile;
      const SmtpAccountSettings = sequelize.models.SmtpAccountSettings;
      const profile = await SendProfile.create(createSendProfileData({
        name: 'Work SMTP',
      }));
      const profileId = (profile as any).id;
      await SmtpAccountSettings.create({
        sendProfileId: profileId,
        ...createSmtpSettingsData({ host: 'smtp.work.com' }),
      });

      const result = await executeAuthenticatedOperation(`
        query GetSendProfiles {
          getSendProfiles {
            id
            name
            email
            type
            smtpSettings {
              host
              port
            }
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getSendProfiles).to.have.lengthOf(1);
      expect(data.getSendProfiles[0].name).to.equal('Work SMTP');
      expect(data.getSendProfiles[0].type).to.equal('SMTP');
      expect(data.getSendProfiles[0].smtpSettings.host).to.equal('smtp.work.com');
    });

    it('should require authentication', async () => {
      const result = await executeUnauthenticatedOperation(`
        query GetSendProfiles {
          getSendProfiles {
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

  describe('Query: getSendProfile', () => {
    it('should return a specific send profile', async () => {
      const SendProfile = sequelize.models.SendProfile;
      const profile = await SendProfile.create(createSendProfileData({
        name: 'Specific Profile',
      }));
      const profileId = (profile as any).id;

      const result = await executeAuthenticatedOperation(`
        query GetSendProfile($id: String!) {
          getSendProfile(id: $id) {
            id
            name
            email
            type
          }
        }
      `, { id: profileId });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getSendProfile).to.not.be.null;
      expect(data.getSendProfile.name).to.equal('Specific Profile');
    });

    it('should return null for non-existent profile', async () => {
      const result = await executeAuthenticatedOperation(`
        query GetSendProfile($id: String!) {
          getSendProfile(id: $id) {
            id
            name
          }
        }
      `, { id: '00000000-0000-0000-0000-999999999999' });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getSendProfile).to.be.null;
    });
  });

  describe('Mutation: deleteSendProfile', () => {
    it('should delete an existing send profile', async () => {
      const SendProfile = sequelize.models.SendProfile;
      const profile = await SendProfile.create(createSendProfileData({
        name: 'To Delete',
      }));
      const profileId = (profile as any).id;

      const result = await executeAuthenticatedOperation(`
        mutation DeleteSendProfile($id: String!) {
          deleteSendProfile(id: $id)
        }
      `, { id: profileId });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.deleteSendProfile).to.be.true;

      const deleted = await SendProfile.findByPk(profileId);
      expect(deleted).to.be.null;
    });

    it('should throw error for non-existent profile', async () => {
      const result = await executeAuthenticatedOperation(`
        mutation DeleteSendProfile($id: String!) {
          deleteSendProfile(id: $id)
        }
      `, { id: '00000000-0000-0000-0000-999999999999' });

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
    });
  });
});
