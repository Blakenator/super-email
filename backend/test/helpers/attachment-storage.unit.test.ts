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
    it('should return correct path for attachment ID', async () => {
      // Only import in dev mode (tests always run in non-production)
      const { getLocalAttachmentPath } = await import('../../helpers/attachment-storage.js');
      
      const attachmentId = 'test-uuid-12345';
      const result = getLocalAttachmentPath(attachmentId);
      
      // Should be a path ending with the attachment ID
      expect(result).to.include(attachmentId);
      expect(path.basename(result)).to.equal(attachmentId);
    });

    it('should use the configured attachments directory', async () => {
      const { getLocalAttachmentPath } = await import('../../helpers/attachment-storage.js');
      
      const attachmentId = 'another-uuid';
      const result = getLocalAttachmentPath(attachmentId);
      
      // Should contain the data/attachments directory
      expect(result).to.include('attachments');
    });
  });

  describe('getAttachmentDownloadUrl (development mode)', () => {
    it('should return local API path in development', async () => {
      const { getAttachmentDownloadUrl } = await import('../../helpers/attachment-storage.js');
      
      const attachmentId = 'test-attachment-id';
      const result = await getAttachmentDownloadUrl(attachmentId);
      
      // In development, should return local API path
      expect(result).to.equal(`/api/attachments/download/${attachmentId}`);
    });
  });
});
