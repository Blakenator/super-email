/**
 * Custom Email Parser Unit Tests
 *
 * Tests the archiveRawEmail function in local (development) mode.
 * parseAndStoreCustomEmail requires DB models so it's covered
 * in integration tests.
 */

import { expect } from 'chai';
import fs from 'fs/promises';
import path from 'path';

describe('custom-email-parser helpers', function () {
  const testDir = path.join(process.cwd(), 'data', 'raw-emails');

  after(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('archiveRawEmail (local)', () => {
    it('should archive raw email to local filesystem', async () => {
      process.env.NODE_ENV = 'test';
      const { archiveRawEmail } = await import('../../helpers/custom-email-parser.js');

      const rawEmail = Buffer.from('From: test@example.com\r\nSubject: Test\r\n\r\nBody');
      const accountId = 'test-account-' + Date.now();
      const messageId = '<test-msg-123@example.com>';

      const storageKey = await archiveRawEmail(rawEmail, accountId, messageId);

      expect(storageKey).to.be.a('string');
      expect(storageKey).to.include(accountId);
      expect(storageKey).to.include('test-msg-123@example.com');
      expect(storageKey).to.match(/\.eml$/);

      const localPath = path.join(process.cwd(), 'data', 'raw-emails', storageKey);
      const contents = await fs.readFile(localPath);
      expect(contents.toString()).to.equal(rawEmail.toString());
    });

    it('should sanitize special characters from message ID', async () => {
      const { archiveRawEmail } = await import('../../helpers/custom-email-parser.js');

      const rawEmail = Buffer.from('Subject: Test\r\n\r\nBody');
      const accountId = 'test-sanitize';
      const messageId = '<weird/chars=here@example.com>';

      const storageKey = await archiveRawEmail(rawEmail, accountId, messageId);

      expect(storageKey).not.to.include('<');
      expect(storageKey).not.to.include('>');
      // The storageKey is accountId/filename, so check only the filename part
      const filename = storageKey.split('/').pop()!;
      expect(filename).not.to.include('/');
      expect(filename).to.include('weird_chars_here@example.com');
    });

    it('should create the directory structure if it does not exist', async () => {
      const { archiveRawEmail } = await import('../../helpers/custom-email-parser.js');

      const rawEmail = Buffer.from('Subject: Dir Test\r\n\r\nBody');
      const accountId = 'new-account-' + Date.now();
      const messageId = '<dir-test@example.com>';

      const storageKey = await archiveRawEmail(rawEmail, accountId, messageId);

      const localPath = path.join(process.cwd(), 'data', 'raw-emails', storageKey);
      const stat = await fs.stat(localPath);
      expect(stat.isFile()).to.be.true;
    });
  });
});
