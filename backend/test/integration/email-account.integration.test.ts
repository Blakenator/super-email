/**
 * EmailAccount Integration Tests
 *
 * Tests the EmailAccount GraphQL queries and mutations against the actual server.
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

const createEmailAccountData = (overrides: Record<string, any> = {}) => ({
  name: 'Test Account',
  email: 'test@example.com',
  type: 'IMAP',
  isDefault: false,
  ...overrides,
});

const createImapSettingsData = (emailAccountId: string, overrides: Record<string, any> = {}) => ({
  emailAccountId,
  host: 'imap.example.com',
  port: 993,
  accountType: 'IMAP',
  useSsl: true,
  ...overrides,
});

describe('EmailAccount Integration Tests', function () {
  this.timeout(30000);

  before(async () => {
    await cleanupTestData();
    await createTestUser();
  });

  beforeEach(async () => {
    await sequelize.models.ImapAccountSettings?.destroy({ where: {}, force: true });
    await sequelize.models.EmailAccount?.destroy({ where: {}, force: true });
  });

  describe('Query: getEmailAccounts', () => {
    it('should return empty array when no accounts exist', async () => {
      const result = await executeAuthenticatedOperation(`
        query GetEmailAccounts {
          getEmailAccounts {
            id
            email
            name
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const singleResult = (result.body as any).singleResult;

      if (singleResult.errors) {
        console.log('GraphQL errors:', JSON.stringify(singleResult.errors, null, 2));
      }

      expect(singleResult.data.getEmailAccounts).to.be.an('array').that.is.empty;
    });

    it('should return created email accounts with imapSettings', async () => {
      const EmailAccount = sequelize.models.EmailAccount;
      const ImapAccountSettings = sequelize.models.ImapAccountSettings;
      const account = await EmailAccount.create(createEmailAccountData({
        userId: TEST_USER_ID,
        name: 'Work Gmail',
        email: 'work@example.com',
        providerId: 'google',
      }));
      const accountId = (account as any).id;
      await ImapAccountSettings.create(createImapSettingsData(accountId, {
        host: 'imap.gmail.com',
        port: 993,
      }));

      const result = await executeAuthenticatedOperation(`
        query GetEmailAccounts {
          getEmailAccounts {
            id
            email
            name
            type
            providerId
            imapSettings {
              host
              port
            }
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getEmailAccounts).to.have.lengthOf(1);
      expect(data.getEmailAccounts[0].id).to.equal(accountId);
      expect(data.getEmailAccounts[0].email).to.equal('work@example.com');
      expect(data.getEmailAccounts[0].name).to.equal('Work Gmail');
      expect(data.getEmailAccounts[0].type).to.equal('IMAP');
      expect(data.getEmailAccounts[0].imapSettings.host).to.equal('imap.gmail.com');
      expect(data.getEmailAccounts[0].imapSettings.port).to.equal(993);
    });

    it('should only return accounts for the authenticated user', async () => {
      const EmailAccount = sequelize.models.EmailAccount;
      const User = sequelize.models.User;

      await EmailAccount.create(createEmailAccountData({
        userId: TEST_USER_ID,
        email: 'user1@example.com',
        name: 'User 1 Account',
      }));

      const otherUserId = '00000000-0000-0000-0000-000000000099';
      await User.findOrCreate({
        where: { id: otherUserId },
        defaults: { id: otherUserId, email: 'other@example.com' },
      });
      await EmailAccount.create(createEmailAccountData({
        userId: otherUserId,
        email: 'user2@example.com',
        name: 'User 2 Account',
      }));

      const result = await executeAuthenticatedOperation(`
        query GetEmailAccounts {
          getEmailAccounts {
            id
            email
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getEmailAccounts).to.have.lengthOf(1);
      expect(data.getEmailAccounts[0].email).to.equal('user1@example.com');
    });

    it('should require authentication', async () => {
      const result = await executeUnauthenticatedOperation(`
        query GetEmailAccounts {
          getEmailAccounts {
            id
            email
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
      expect(errors[0].message.toLowerCase()).to.satisfy((msg: string) =>
        msg.includes('authenticated') || msg.includes('authentication')
      );
    });
  });

  describe('Query: getEmailAccount', () => {
    it('should return a specific email account', async () => {
      const EmailAccount = sequelize.models.EmailAccount;
      const account = await EmailAccount.create(createEmailAccountData({
        userId: TEST_USER_ID,
        email: 'specific@example.com',
        name: 'Specific Account',
      }));
      const accountId = (account as any).id;

      const result = await executeAuthenticatedOperation(`
        query GetEmailAccount($id: String!) {
          getEmailAccount(id: $id) {
            id
            email
            name
            type
          }
        }
      `, { id: accountId });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getEmailAccount).to.not.be.null;
      expect(data.getEmailAccount.email).to.equal('specific@example.com');
    });

    it('should return null for non-existent account', async () => {
      const result = await executeAuthenticatedOperation(`
        query GetEmailAccount($id: String!) {
          getEmailAccount(id: $id) {
            id
            email
          }
        }
      `, { id: '00000000-0000-0000-0000-999999999999' });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getEmailAccount).to.be.null;
    });

    it('should not return accounts belonging to other users', async () => {
      const EmailAccount = sequelize.models.EmailAccount;
      const User = sequelize.models.User;

      const otherUserId = '00000000-0000-0000-0000-000000000098';
      await User.findOrCreate({
        where: { id: otherUserId },
        defaults: { id: otherUserId, email: 'other2@example.com' },
      });
      const account = await EmailAccount.create(createEmailAccountData({
        userId: otherUserId,
        email: 'other2@example.com',
        name: 'Other User Account',
      }));
      const accountId = (account as any).id;

      const result = await executeAuthenticatedOperation(`
        query GetEmailAccount($id: String!) {
          getEmailAccount(id: $id) {
            id
            email
          }
        }
      `, { id: accountId });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getEmailAccount).to.be.null;
    });
  });

  describe('Mutation: deleteEmailAccount', () => {
    it('should delete an email account', async () => {
      const EmailAccount = sequelize.models.EmailAccount;
      const account = await EmailAccount.create(createEmailAccountData({
        userId: TEST_USER_ID,
        email: 'delete@example.com',
        name: 'To Delete',
      }));
      const accountId = (account as any).id;

      const result = await executeAuthenticatedOperation(`
        mutation DeleteEmailAccount($id: String!) {
          deleteEmailAccount(id: $id)
        }
      `, { id: accountId });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.deleteEmailAccount).to.be.true;

      const deletedAccount = await EmailAccount.findByPk(accountId);
      expect(deletedAccount).to.be.null;
    });

    it('should throw error for non-existent account', async () => {
      const result = await executeAuthenticatedOperation(`
        mutation DeleteEmailAccount($id: String!) {
          deleteEmailAccount(id: $id)
        }
      `, { id: '00000000-0000-0000-0000-999999999999' });

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
      expect(errors[0].message).to.include('not found');
    });
  });
});
