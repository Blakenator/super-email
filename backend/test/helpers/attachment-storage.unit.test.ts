/**
 * Attachment Storage Unit Tests
 * 
 * Tests the pure/semi-pure functions in attachment-storage.
 * Note: Most functions require file system or S3, so tests are limited.
 */

import { expect } from 'chai';
import path from 'path';

describe('attachment-storage helpers', function () {
  describe('getLocalAttachmentPath', () => {
    it('should return correct path for storageKey with account prefix', async () => {
      const { getLocalAttachmentPath } = await import('../../helpers/attachment-storage.js');
      
      const storageKey = 'account-uuid/attachment-uuid';
      const result = getLocalAttachmentPath(storageKey);
      
      expect(result).to.include(storageKey);
      expect(result).to.include('attachments');
    });
  });

  describe('getAttachmentDownloadUrl (development mode)', () => {
    it('should return local API path in development', async () => {
      const { getAttachmentDownloadUrl } = await import('../../helpers/attachment-storage.js');
      
      const storageKey = 'account-uuid/attachment-uuid';
      const result = await getAttachmentDownloadUrl(storageKey);
      
      expect(result).to.equal(`/api/attachments/download/${storageKey}`);
    });
  });
});
