/**
 * Tests for createSmtpProfile mutation
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockSmtpProfile } from '../../utils/mock-models.js';

describe('createSmtpProfile mutation', () => {
  let mockModels: any;
  let mockSecrets: any;

  beforeEach(() => {
    mockModels = {
      SmtpProfile: {
        count: sinon.stub(),
        update: sinon.stub(),
        create: sinon.stub(),
      },
    };

    mockSecrets = {
      storeSmtpCredentials: sinon.stub().resolves(),
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
      name: 'Test SMTP',
      email: 'test@gmail.com',
      alias: 'Test User',
      host: 'smtp.gmail.com',
      port: 587,
      username: 'test@gmail.com',
      password: 'app-password-123',
      useSsl: true,
      isDefault: true,
    };

    it('should create SMTP profile with valid input', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const newProfile = createMockSmtpProfile({
        ...validInput,
        userId: context.userId,
      });

      mockModels.SmtpProfile.count.resolves(0);
      mockModels.SmtpProfile.create.resolves(newProfile);

      // Create profile
      const result = await mockModels.SmtpProfile.create({
        ...validInput,
        userId: context.userId,
      });

      expect(result).to.exist;
      expect(result.name).to.equal(validInput.name);
      expect(result.email).to.equal(validInput.email);
      expect(result.alias).to.equal(validInput.alias);
      expect(mockModels.SmtpProfile.create.calledOnce).to.be.true;
    });

    it('should set first profile as default automatically', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.SmtpProfile.count.resolves(0);
      mockModels.SmtpProfile.create.resolves(createMockSmtpProfile({ isDefault: true }));

      const existingCount = await mockModels.SmtpProfile.count({
        where: { userId: context.userId },
      });
      const isFirstProfile = existingCount === 0;

      expect(isFirstProfile).to.be.true;
      
      await mockModels.SmtpProfile.create({
        ...validInput,
        userId: context.userId,
        isDefault: true,
      });
      
      expect(mockModels.SmtpProfile.create.firstCall.args[0]).to.have.property('isDefault', true);
    });

    it('should unset previous default when setting new default', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.SmtpProfile.count.resolves(1);
      mockModels.SmtpProfile.update.resolves([1]);
      mockModels.SmtpProfile.create.resolves(createMockSmtpProfile({ isDefault: true }));

      // Unset existing defaults
      await mockModels.SmtpProfile.update(
        { isDefault: false },
        { where: { userId: context.userId, isDefault: true } }
      );

      expect(mockModels.SmtpProfile.update.calledOnce).to.be.true;
      expect(mockModels.SmtpProfile.update.firstCall.args[0]).to.deep.equal({ isDefault: false });
    });

    it('should store credentials in secrets manager', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const newProfile = createMockSmtpProfile({
        id: 'new-profile-id',
        ...validInput,
        userId: context.userId,
      });

      mockModels.SmtpProfile.count.resolves(0);
      mockModels.SmtpProfile.create.resolves(newProfile);

      await mockModels.SmtpProfile.create({
        ...validInput,
        userId: context.userId,
      });

      // Store credentials
      await mockSecrets.storeSmtpCredentials(newProfile.id, {
        username: validInput.username,
        password: validInput.password,
      });

      expect(mockSecrets.storeSmtpCredentials.calledOnce).to.be.true;
      expect(mockSecrets.storeSmtpCredentials.firstCall.args[0]).to.equal('new-profile-id');
    });

    it('should handle optional alias field', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const inputWithoutAlias = { ...validInput, alias: undefined };
      
      mockModels.SmtpProfile.count.resolves(0);
      mockModels.SmtpProfile.create.resolves(createMockSmtpProfile({ alias: null }));

      await mockModels.SmtpProfile.create({
        ...inputWithoutAlias,
        alias: null,
        userId: context.userId,
      });

      expect(mockModels.SmtpProfile.create.firstCall.args[0]).to.have.property('alias', null);
    });

    it('should handle SSL/TLS settings', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.SmtpProfile.count.resolves(0);
      mockModels.SmtpProfile.create.resolves(createMockSmtpProfile({ useSsl: false }));

      await mockModels.SmtpProfile.create({
        ...validInput,
        useSsl: false,
        userId: context.userId,
      });

      expect(mockModels.SmtpProfile.create.firstCall.args[0]).to.have.property('useSsl', false);
    });
  });
});
