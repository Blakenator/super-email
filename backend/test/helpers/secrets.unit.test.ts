/**
 * Secrets Helper Unit Tests
 * 
 * Tests the local secrets storage functions.
 * Note: AWS Secrets Manager functions are tested via integration tests.
 */

import { expect } from 'chai';
import fs from 'fs/promises';
import path from 'path';

describe('secrets helpers', function () {
  const testSecretsDir = path.join(process.cwd(), 'data');
  const testSecretsFile = path.join(testSecretsDir, 'secrets.json');

  // Backup and restore secrets file around tests
  let originalSecrets: string | null = null;

  before(async () => {
    try {
      originalSecrets = await fs.readFile(testSecretsFile, 'utf-8');
    } catch (e) {
      originalSecrets = null;
    }
  });

  after(async () => {
    if (originalSecrets !== null) {
      await fs.writeFile(testSecretsFile, originalSecrets, 'utf-8');
    }
  });

  describe('storeImapCredentials (local)', () => {
    it('should store IMAP credentials locally', async () => {
      const { storeImapCredentials, getImapCredentials } = await import('../../helpers/secrets.js');
      
      const testAccountId = 'test-account-unit-' + Date.now();
      const credentials = {
        username: 'test@example.com',
        password: 'testpassword123',
      };

      await storeImapCredentials(testAccountId, credentials);

      // Verify the credentials were stored by retrieving them
      const retrieved = await getImapCredentials(testAccountId);
      expect(retrieved).to.deep.equal(credentials);
    });
  });

  describe('getImapCredentials (local)', () => {
    it('should retrieve stored IMAP credentials', async () => {
      const { storeImapCredentials, getImapCredentials } = await import('../../helpers/secrets.js');
      
      const testAccountId = 'test-account-get-' + Date.now();
      const credentials = {
        username: 'retrieve@example.com',
        password: 'retrievepass',
      };

      await storeImapCredentials(testAccountId, credentials);
      const retrieved = await getImapCredentials(testAccountId);

      expect(retrieved).to.deep.equal(credentials);
    });

    it('should return null for non-existent credentials', async () => {
      const { getImapCredentials } = await import('../../helpers/secrets.js');
      
      const result = await getImapCredentials('non-existent-account-id');
      expect(result).to.be.null;
    });
  });

  describe('deleteImapCredentials (local)', () => {
    it('should delete stored IMAP credentials', async () => {
      const { storeImapCredentials, deleteImapCredentials, getImapCredentials } = await import('../../helpers/secrets.js');
      
      const testAccountId = 'test-account-delete-' + Date.now();
      const credentials = {
        username: 'delete@example.com',
        password: 'deletepass',
      };

      // Store, then delete
      await storeImapCredentials(testAccountId, credentials);
      await deleteImapCredentials(testAccountId);

      // Verify deleted
      const retrieved = await getImapCredentials(testAccountId);
      expect(retrieved).to.be.null;
    });
  });

  describe('storeSmtpCredentials (local)', () => {
    it('should store SMTP credentials locally', async () => {
      const { storeSmtpCredentials, getSmtpCredentials } = await import('../../helpers/secrets.js');
      
      const testProfileId = 'test-smtp-' + Date.now();
      const credentials = {
        username: 'smtp@example.com',
        password: 'smtppass',
      };

      await storeSmtpCredentials(testProfileId, credentials);

      // Verify stored by retrieving
      const retrieved = await getSmtpCredentials(testProfileId);
      expect(retrieved).to.deep.equal(credentials);
    });
  });

  describe('getSmtpCredentials (local)', () => {
    it('should retrieve stored SMTP credentials', async () => {
      const { storeSmtpCredentials, getSmtpCredentials } = await import('../../helpers/secrets.js');
      
      const testProfileId = 'test-smtp-get-' + Date.now();
      const credentials = {
        username: 'smtp-get@example.com',
        password: 'smtpgetpass',
      };

      await storeSmtpCredentials(testProfileId, credentials);
      const retrieved = await getSmtpCredentials(testProfileId);

      expect(retrieved).to.deep.equal(credentials);
    });
  });
});
