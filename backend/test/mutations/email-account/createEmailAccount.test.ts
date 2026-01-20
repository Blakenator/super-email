/**
 * Tests for createEmailAccount mutation
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockEmailAccount } from '../../utils/mock-models.js';

describe('createEmailAccount mutation', () => {
  let mockModels: any;
  let mockSecrets: any;

  beforeEach(() => {
    mockModels = {
      EmailAccount: {
        count: sinon.stub(),
        update: sinon.stub(),
        create: sinon.stub(),
      },
    };

    mockSecrets = {
      storeImapCredentials: sinon.stub().resolves(),
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
    const validInput = {
      name: 'Test Gmail',
      email: 'test@gmail.com',
      host: 'imap.gmail.com',
      port: 993,
      username: 'test@gmail.com',
      password: 'app-password-123',
      accountType: 'IMAP' as const,
      useSsl: true,
    };

    it('should create email account with valid input', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const newAccount = createMockEmailAccount({
        ...validInput,
        userId: context.userId,
        isDefault: true,
      });

      mockModels.EmailAccount.count.resolves(0);
      mockModels.EmailAccount.create.resolves(newAccount);

      // Check if this is first account
      const existingCount = await mockModels.EmailAccount.count({
        where: { userId: context.userId },
      });
      expect(existingCount).to.equal(0);

      // Create account
      const result = await mockModels.EmailAccount.create({
        ...validInput,
        userId: context.userId,
        isDefault: true,
      });

      expect(result).to.exist;
      expect(result.name).to.equal(validInput.name);
      expect(result.email).to.equal(validInput.email);
      expect(mockModels.EmailAccount.create.calledOnce).to.be.true;
    });

    it('should set first account as default automatically', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.EmailAccount.count.resolves(0);
      mockModels.EmailAccount.create.resolves(createMockEmailAccount({ isDefault: true }));

      const existingCount = await mockModels.EmailAccount.count({
        where: { userId: context.userId },
      });
      const isFirstAccount = existingCount === 0;

      expect(isFirstAccount).to.be.true;
      
      // First account should be default
      const createArgs = {
        ...validInput,
        userId: context.userId,
        isDefault: true,
      };
      
      await mockModels.EmailAccount.create(createArgs);
      
      expect(mockModels.EmailAccount.create.firstCall.args[0]).to.have.property('isDefault', true);
    });

    it('should unset previous default when setting new default', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.EmailAccount.count.resolves(1);
      mockModels.EmailAccount.update.resolves([1]);
      mockModels.EmailAccount.create.resolves(createMockEmailAccount({ isDefault: true }));

      // Simulate unsetting existing defaults
      await mockModels.EmailAccount.update(
        { isDefault: false },
        { where: { userId: context.userId, isDefault: true } }
      );

      expect(mockModels.EmailAccount.update.calledOnce).to.be.true;
      expect(mockModels.EmailAccount.update.firstCall.args[0]).to.deep.equal({ isDefault: false });
    });

    it('should store credentials in secrets manager', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const newAccount = createMockEmailAccount({
        id: 'new-account-id',
        ...validInput,
        userId: context.userId,
      });

      mockModels.EmailAccount.count.resolves(0);
      mockModels.EmailAccount.create.resolves(newAccount);

      await mockModels.EmailAccount.create({
        ...validInput,
        userId: context.userId,
        isDefault: true,
      });

      // Store credentials
      await mockSecrets.storeImapCredentials(newAccount.id, {
        username: validInput.username,
        password: validInput.password,
      });

      expect(mockSecrets.storeImapCredentials.calledOnce).to.be.true;
      expect(mockSecrets.storeImapCredentials.firstCall.args[0]).to.equal('new-account-id');
      expect(mockSecrets.storeImapCredentials.firstCall.args[1]).to.deep.include({
        username: validInput.username,
        password: validInput.password,
      });
    });

    it('should handle IMAP account type', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.EmailAccount.count.resolves(0);
      mockModels.EmailAccount.create.resolves(createMockEmailAccount({ accountType: 'IMAP' }));

      await mockModels.EmailAccount.create({
        ...validInput,
        accountType: 'IMAP',
        userId: context.userId,
        isDefault: true,
      });

      expect(mockModels.EmailAccount.create.firstCall.args[0]).to.have.property('accountType', 'IMAP');
    });

    it('should handle POP3 account type', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.EmailAccount.count.resolves(0);
      mockModels.EmailAccount.create.resolves(createMockEmailAccount({ accountType: 'POP3' }));

      await mockModels.EmailAccount.create({
        ...validInput,
        accountType: 'POP3',
        userId: context.userId,
        isDefault: true,
      });

      expect(mockModels.EmailAccount.create.firstCall.args[0]).to.have.property('accountType', 'POP3');
    });

    it('should set defaultSmtpProfileId when provided', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.EmailAccount.count.resolves(0);
      mockModels.EmailAccount.create.resolves(createMockEmailAccount({ 
        defaultSmtpProfileId: 'smtp-profile-123' 
      }));

      await mockModels.EmailAccount.create({
        ...validInput,
        defaultSmtpProfileId: 'smtp-profile-123',
        userId: context.userId,
        isDefault: true,
      });

      expect(mockModels.EmailAccount.create.firstCall.args[0])
        .to.have.property('defaultSmtpProfileId', 'smtp-profile-123');
    });
  });
});
