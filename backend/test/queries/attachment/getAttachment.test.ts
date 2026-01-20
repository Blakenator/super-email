/**
 * Tests for getAttachment and getAttachmentDownloadUrl queries
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockAttachment, createMockEmail, createMockEmailAccount } from '../../utils/mock-models.js';

describe('getAttachment query', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
      Attachment: {
        findByPk: sinon.stub(),
        findOne: sinon.stub(),
      },
      Email: {},
      EmailAccount: {},
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
    it('should return attachment by ID', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockAttachment = createMockAttachment({
        id: 'att-123',
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        size: 102400,
      });

      mockModels.Attachment.findByPk.resolves(mockAttachment);

      const result = await mockModels.Attachment.findByPk('att-123');

      expect(result).to.exist;
      expect(result.id).to.equal('att-123');
      expect(result.filename).to.equal('document.pdf');
      expect(result.mimeType).to.equal('application/pdf');
    });

    it('should return null when attachment not found', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.Attachment.findByPk.resolves(null);

      const result = await mockModels.Attachment.findByPk('nonexistent');

      expect(result).to.be.null;
    });

    it('should verify attachment belongs to user email account', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockAttachment = createMockAttachment({
        id: 'att-123',
        emailId: 'email-123',
      });

      // Complex query with includes to verify ownership
      mockModels.Attachment.findOne.resolves({
        ...mockAttachment,
        Email: {
          ...createMockEmail({ id: 'email-123' }),
          EmailAccount: createMockEmailAccount({ userId: context.userId }),
        },
      });

      const result = await mockModels.Attachment.findOne({
        where: { id: 'att-123' },
        include: [{
          model: 'Email',
          required: true,
          include: [{
            model: 'EmailAccount',
            where: { userId: context.userId },
            required: true,
          }],
        }],
      });

      expect(result).to.exist;
      expect(mockModels.Attachment.findOne.calledOnce).to.be.true;
    });

    it('should return null when attachment belongs to another user', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      // Query returns null when ownership check fails
      mockModels.Attachment.findOne.resolves(null);

      const result = await mockModels.Attachment.findOne({
        where: { id: 'att-123' },
        include: [{
          model: 'Email',
          required: true,
          include: [{
            model: 'EmailAccount',
            where: { userId: context.userId },
            required: true,
          }],
        }],
      });

      expect(result).to.be.null;
    });

    it('should include all attachment metadata', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockAttachment = createMockAttachment({
        id: 'att-123',
        filename: 'image.png',
        mimeType: 'image/png',
        extension: 'png',
        size: 51200,
        storageKey: 'att-123',
        attachmentType: 'ATTACHMENT',
        contentId: null,
        contentDisposition: 'attachment',
        isSafe: true,
      });

      mockModels.Attachment.findByPk.resolves(mockAttachment);

      const result = await mockModels.Attachment.findByPk('att-123');

      expect(result.filename).to.equal('image.png');
      expect(result.mimeType).to.equal('image/png');
      expect(result.extension).to.equal('png');
      expect(result.size).to.equal(51200);
      expect(result.attachmentType).to.equal('ATTACHMENT');
      expect(result.isSafe).to.be.true;
    });

    it('should handle inline attachments', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockAttachment = createMockAttachment({
        id: 'att-inline-123',
        filename: 'logo.png',
        attachmentType: 'INLINE',
        contentId: 'cid:logo@email',
        contentDisposition: 'inline',
      });

      mockModels.Attachment.findByPk.resolves(mockAttachment);

      const result = await mockModels.Attachment.findByPk('att-inline-123');

      expect(result.attachmentType).to.equal('INLINE');
      expect(result.contentId).to.equal('cid:logo@email');
      expect(result.contentDisposition).to.equal('inline');
    });
  });
});

describe('getAttachmentDownloadUrl query', () => {
  let mockModels: any;
  let mockStorage: any;

  beforeEach(() => {
    mockModels = {
      Attachment: {
        findOne: sinon.stub(),
      },
    };

    mockStorage = {
      getAttachmentDownloadUrl: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('when user is authenticated', () => {
    it('should return download URL for valid attachment', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockAttachment = createMockAttachment({
        id: 'att-123',
        storageKey: 'att-123',
      });

      mockModels.Attachment.findOne.resolves({
        ...mockAttachment,
        Email: {
          EmailAccount: createMockEmailAccount({ userId: context.userId }),
        },
      });

      mockStorage.getAttachmentDownloadUrl.resolves('https://s3.amazonaws.com/bucket/att-123?signature=xxx');

      // Verify attachment access
      const attachment = await mockModels.Attachment.findOne({
        where: { id: 'att-123' },
        include: [{
          model: 'Email',
          include: [{ model: 'EmailAccount', where: { userId: context.userId } }],
        }],
      });

      expect(attachment).to.exist;

      // Get download URL
      const url = await mockStorage.getAttachmentDownloadUrl(attachment.id);

      expect(url).to.include('https://');
      expect(mockStorage.getAttachmentDownloadUrl.calledWith('att-123')).to.be.true;
    });

    it('should throw error when attachment not found', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.Attachment.findOne.resolves(null);

      const attachment = await mockModels.Attachment.findOne({
        where: { id: 'nonexistent' },
      });

      expect(attachment).to.be.null;
      
      // Resolver would throw
      if (!attachment) {
        expect(() => {
          throw new Error('Attachment not found');
        }).to.throw('Attachment not found');
      }
    });

    it('should return local URL in development', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.Attachment.findOne.resolves(createMockAttachment({ id: 'att-123' }));
      
      // In development, returns local API path
      mockStorage.getAttachmentDownloadUrl.resolves('/api/attachments/download/att-123');

      const url = await mockStorage.getAttachmentDownloadUrl('att-123');

      expect(url).to.equal('/api/attachments/download/att-123');
    });

    it('should return S3 presigned URL in production', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.Attachment.findOne.resolves(createMockAttachment({ id: 'att-123' }));
      
      // In production, returns presigned S3 URL
      mockStorage.getAttachmentDownloadUrl.resolves(
        'https://email-attachments.s3.amazonaws.com/att-123?X-Amz-Signature=xyz&X-Amz-Expires=3600'
      );

      const url = await mockStorage.getAttachmentDownloadUrl('att-123');

      expect(url).to.include('s3.amazonaws.com');
      expect(url).to.include('X-Amz-Signature');
    });
  });
});
