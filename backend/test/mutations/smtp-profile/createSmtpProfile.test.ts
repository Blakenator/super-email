/**
 * Tests for createSmtpProfile mutation
 *
 * Tests the REAL resolver by importing it via esmock to mock
 * helper module dependencies while keeping model stubs via sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import { SmtpProfile } from '../../../db/models/index.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('createSmtpProfile mutation', () => {
  let createSmtpProfile: any;
  let storeSmtpCredentialsStub: sinon.SinonStub;

  beforeEach(async () => {
    storeSmtpCredentialsStub = sinon.stub().resolves();

    const mod = await esmock(
      '../../../mutations/smtp-profile/createSmtpProfile.js',
      {
        '../../../helpers/secrets.js': {
          storeSmtpCredentials: storeSmtpCredentialsStub,
        },
      },
    );
    createSmtpProfile = mod.createSmtpProfile;
  });

  afterEach(() => {
    sinon.restore();
  });

  const validInput = {
    name: 'Test SMTP',
    email: 'test@gmail.com',
    host: 'smtp.gmail.com',
    port: 587,
    username: 'test@gmail.com',
    password: 'app-password-123',
    useSsl: true,
    isDefault: false,
  };

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();

    try {
      await createSmtpProfile(null, { input: validInput }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should create SMTP profile with valid input', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockProfile = { id: 'smtp-1', ...validInput, userId: 'user-123' };

    const createStub = sinon.stub(SmtpProfile, 'create').resolves(mockProfile as any);

    const result = await createSmtpProfile(null, { input: validInput }, context);

    expect(createStub.calledOnce).to.be.true;
    const createArgs = createStub.firstCall.args[0] as any;
    expect(createArgs.userId).to.equal('user-123');
    expect(createArgs.name).to.equal('Test SMTP');
    expect(createArgs.email).to.equal('test@gmail.com');
    expect(createArgs.host).to.equal('smtp.gmail.com');
    expect(createArgs.port).to.equal(587);
    expect(createArgs.useSsl).to.equal(true);
    expect(createArgs.isDefault).to.equal(false);
    expect(result).to.equal(mockProfile);
  });

  it('should unset previous defaults when isDefault is true', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = { ...validInput, isDefault: true };
    const mockProfile = { id: 'smtp-2', ...input, userId: 'user-123' };

    const updateStub = sinon.stub(SmtpProfile, 'update').resolves([1] as any);
    sinon.stub(SmtpProfile, 'create').resolves(mockProfile as any);

    await createSmtpProfile(null, { input }, context);

    expect(updateStub.calledOnce).to.be.true;
    expect(updateStub.firstCall.args[0]).to.deep.equal({ isDefault: false });
    expect(updateStub.firstCall.args[1]).to.deep.include({
      where: { userId: 'user-123', isDefault: true },
    });
  });

  it('should NOT unset defaults when isDefault is false', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = { ...validInput, isDefault: false };
    const mockProfile = { id: 'smtp-3', ...input, userId: 'user-123' };

    const updateStub = sinon.stub(SmtpProfile, 'update').resolves([0] as any);
    sinon.stub(SmtpProfile, 'create').resolves(mockProfile as any);

    await createSmtpProfile(null, { input }, context);

    expect(updateStub.called).to.be.false;
  });

  it('should store credentials in secrets manager', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockProfile = { id: 'smtp-4', ...validInput, userId: 'user-123' };

    sinon.stub(SmtpProfile, 'create').resolves(mockProfile as any);

    await createSmtpProfile(null, { input: validInput }, context);

    expect(storeSmtpCredentialsStub.calledOnce).to.be.true;
    expect(storeSmtpCredentialsStub.firstCall.args[0]).to.equal('smtp-4');
    expect(storeSmtpCredentialsStub.firstCall.args[1]).to.deep.equal({
      username: 'test@gmail.com',
      password: 'app-password-123',
    });
  });

  it('should default isDefault to false via nullish coalescing', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = { ...validInput, isDefault: undefined };
    const mockProfile = { id: 'smtp-5', userId: 'user-123' };

    const createStub = sinon.stub(SmtpProfile, 'create').resolves(mockProfile as any);

    await createSmtpProfile(null, { input }, context);

    const createArgs = createStub.firstCall.args[0] as any;
    expect(createArgs.isDefault).to.equal(false);
  });
});
