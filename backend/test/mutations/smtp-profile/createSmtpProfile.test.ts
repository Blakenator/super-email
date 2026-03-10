/**
 * Tests for createSendProfile mutation
 *
 * Tests the REAL resolver by importing it via esmock to mock
 * helper module dependencies while keeping model stubs via sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('createSendProfile mutation', () => {
  let createSendProfile: any;
  let storeSmtpCredentialsStub: sinon.SinonStub;
  let sendProfileMock: Record<string, sinon.SinonStub>;
  let smtpSettingsMock: Record<string, sinon.SinonStub>;

  beforeEach(async () => {
    storeSmtpCredentialsStub = sinon.stub().resolves();

    sendProfileMock = {
      update: sinon.stub().resolves([0]),
      create: sinon.stub().resolves({ id: 'sp-default', userId: 'user-123' }),
      findByPk: sinon.stub().resolves({ id: 'sp-default', userId: 'user-123' }),
    };

    smtpSettingsMock = {
      create: sinon.stub().resolves({}),
    };

    const mod = await esmock(
      '../../../mutations/send-profile/createSendProfile.js',
      {
        '../../../db/models/index.js': {
          SendProfile: sendProfileMock,
          SmtpAccountSettings: smtpSettingsMock,
        },
        '../../../db/models/send-profile.model.js': {
          SendProfileType: { SMTP: 'SMTP', CUSTOM_DOMAIN: 'CUSTOM_DOMAIN' },
        },
        '../../../helpers/secrets.js': {
          storeSmtpCredentials: storeSmtpCredentialsStub,
        },
      },
    );
    createSendProfile = mod.createSendProfile;
  });

  afterEach(() => {
    sinon.restore();
  });

  const validInput = {
    type: 'SMTP',
    name: 'Test SMTP',
    email: 'test@gmail.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'test@gmail.com',
    smtpPassword: 'app-password-123',
    smtpUseSsl: true,
    isDefault: false,
  };

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();

    try {
      await createSendProfile(null, { input: validInput }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should create send profile and SMTP settings with valid input', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockProfile = { id: 'sp-1', ...validInput, userId: 'user-123' };

    sendProfileMock.create.resolves(mockProfile);
    sendProfileMock.findByPk.resolves(mockProfile);

    const result = await createSendProfile(null, { input: validInput }, context);

    expect(sendProfileMock.create.calledOnce).to.be.true;
    const profileArgs = sendProfileMock.create.firstCall.args[0] as any;
    expect(profileArgs.userId).to.equal('user-123');
    expect(profileArgs.name).to.equal('Test SMTP');
    expect(profileArgs.email).to.equal('test@gmail.com');
    expect(profileArgs.type).to.equal('SMTP');

    expect(smtpSettingsMock.create.calledOnce).to.be.true;
    const settingsArgs = smtpSettingsMock.create.firstCall.args[0] as any;
    expect(settingsArgs.sendProfileId).to.equal('sp-1');
    expect(settingsArgs.host).to.equal('smtp.gmail.com');
    expect(settingsArgs.port).to.equal(587);

    expect(result).to.equal(mockProfile);
  });

  it('should unset previous defaults when isDefault is true', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = { ...validInput, isDefault: true };
    const mockProfile = { id: 'sp-2', ...input, userId: 'user-123' };

    sendProfileMock.create.resolves(mockProfile);
    sendProfileMock.findByPk.resolves(mockProfile);

    await createSendProfile(null, { input }, context);

    expect(sendProfileMock.update.calledOnce).to.be.true;
    expect(sendProfileMock.update.firstCall.args[0]).to.deep.equal({ isDefault: false });
    expect(sendProfileMock.update.firstCall.args[1]).to.deep.include({
      where: { userId: 'user-123', isDefault: true },
    });
  });

  it('should NOT unset defaults when isDefault is false', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = { ...validInput, isDefault: false };
    const mockProfile = { id: 'sp-3', ...input, userId: 'user-123' };

    sendProfileMock.create.resolves(mockProfile);
    sendProfileMock.findByPk.resolves(mockProfile);

    await createSendProfile(null, { input }, context);

    expect(sendProfileMock.update.called).to.be.false;
  });

  it('should store credentials in secrets manager', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockProfile = { id: 'sp-4', ...validInput, userId: 'user-123' };

    sendProfileMock.create.resolves(mockProfile);
    sendProfileMock.findByPk.resolves(mockProfile);

    await createSendProfile(null, { input: validInput }, context);

    expect(storeSmtpCredentialsStub.calledOnce).to.be.true;
    expect(storeSmtpCredentialsStub.firstCall.args[0]).to.equal('sp-4');
    expect(storeSmtpCredentialsStub.firstCall.args[1]).to.deep.equal({
      username: 'test@gmail.com',
      password: 'app-password-123',
    });
  });

  it('should throw when SMTP fields are missing for SMTP type', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = {
      type: 'SMTP',
      name: 'Missing SMTP Fields',
      email: 'test@gmail.com',
      isDefault: false,
    };

    try {
      await createSendProfile(null, { input }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.include('required for SMTP');
    }
  });

  it('should default isDefault to false via nullish coalescing', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = { ...validInput, isDefault: undefined };
    const mockProfile = { id: 'sp-5', userId: 'user-123' };

    sendProfileMock.create.resolves(mockProfile);
    sendProfileMock.findByPk.resolves(mockProfile);

    await createSendProfile(null, { input }, context);

    const createArgs = sendProfileMock.create.firstCall.args[0] as any;
    expect(createArgs.isDefault).to.equal(false);
  });
});
