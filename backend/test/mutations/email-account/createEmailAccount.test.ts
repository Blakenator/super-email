/**
 * Tests for createEmailAccount mutation
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods and helper functions with sinon.
 *
 * Helper functions (secrets, stripe, usage-calculator) are ESM exports
 * and cannot be stubbed with sinon directly. For those, we use esmock
 * to provide mock implementations when loading the resolver module.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('createEmailAccount mutation', () => {
  let createEmailAccount: any;
  let storeImapCredentialsStub: sinon.SinonStub;
  let getOrCreateSubscriptionStub: sinon.SinonStub;
  let recalculateUserUsageStub: sinon.SinonStub;
  let emailAccountMock: Record<string, sinon.SinonStub>;
  let imapAccountSettingsMock: Record<string, sinon.SinonStub>;
  let sendProfileMock: Record<string, sinon.SinonStub>;

  beforeEach(async () => {
    storeImapCredentialsStub = sinon.stub().resolves();
    getOrCreateSubscriptionStub = sinon.stub().resolves({ accountTier: 'free' });
    recalculateUserUsageStub = sinon.stub().resolves();

    emailAccountMock = {
      count: sinon.stub().resolves(0),
      update: sinon.stub().resolves([0]),
      create: sinon.stub().resolves({ id: 'acc-default', userId: 'user-123' }),
      findByPk: sinon.stub().resolves({ id: 'acc-default', userId: 'user-123' }),
    };

    imapAccountSettingsMock = {
      create: sinon.stub().resolves({}),
    };

    sendProfileMock = {};

    const mod = await esmock(
      '../../../mutations/email-account/createEmailAccount.js',
      {
        '../../../db/models/index.js': {
          EmailAccount: emailAccountMock,
          ImapAccountSettings: imapAccountSettingsMock,
          SendProfile: sendProfileMock,
        },
        '../../../helpers/secrets.js': {
          storeImapCredentials: storeImapCredentialsStub,
        },
        '../../../helpers/stripe.js': {
          getOrCreateSubscription: getOrCreateSubscriptionStub,
        },
        '../../../helpers/usage-calculator.js': {
          recalculateUserUsage: recalculateUserUsageStub,
        },
      },
    );
    createEmailAccount = mod.createEmailAccount;
  });

  afterEach(() => {
    sinon.restore();
  });

  const validInput = {
    type: 'IMAP',
    name: 'Test Gmail',
    email: 'test@gmail.com',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapUsername: 'test@gmail.com',
    imapPassword: 'app-password-123',
    imapAccountType: 'IMAP',
    imapUseSsl: true,
  };

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();

    try {
      await createEmailAccount(null, { input: validInput }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should create email account and IMAP settings with valid input', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccount = { id: 'acc-1', userId: 'user-123' };

    emailAccountMock.count.resolves(0);
    emailAccountMock.create.resolves(mockAccount);
    emailAccountMock.findByPk.resolves(mockAccount);

    const result = await createEmailAccount(null, { input: validInput }, context);

    expect(emailAccountMock.create.calledOnce).to.be.true;
    const createArgs = emailAccountMock.create.firstCall.args[0] as any;
    expect(createArgs.userId).to.equal('user-123');
    expect(createArgs.name).to.equal('Test Gmail');
    expect(createArgs.email).to.equal('test@gmail.com');
    expect(createArgs.type).to.equal('IMAP');

    expect(imapAccountSettingsMock.create.calledOnce).to.be.true;
    const settingsArgs = imapAccountSettingsMock.create.firstCall.args[0] as any;
    expect(settingsArgs.emailAccountId).to.equal('acc-1');
    expect(settingsArgs.host).to.equal('imap.gmail.com');
    expect(settingsArgs.port).to.equal(993);
  });

  it('should set first account as default automatically', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccount = { id: 'acc-2', userId: 'user-123' };

    emailAccountMock.count.resolves(0);
    emailAccountMock.create.resolves(mockAccount);
    emailAccountMock.findByPk.resolves(mockAccount);

    await createEmailAccount(null, { input: validInput }, context);

    const createArgs = emailAccountMock.create.firstCall.args[0] as any;
    expect(createArgs.isDefault).to.be.true;

    expect(emailAccountMock.update.calledOnce).to.be.true;
  });

  it('should not force default for additional accounts unless specified', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccount = { id: 'acc-3', userId: 'user-123' };

    emailAccountMock.count.resolves(1);
    emailAccountMock.create.resolves(mockAccount);
    emailAccountMock.findByPk.resolves(mockAccount);
    getOrCreateSubscriptionStub.resolves({ accountTier: 'pro' });

    const input = { ...validInput, isDefault: false };
    await createEmailAccount(null, { input }, context);

    const createArgs = emailAccountMock.create.firstCall.args[0] as any;
    expect(createArgs.isDefault).to.be.false;
    expect(emailAccountMock.update.called).to.be.false;
  });

  it('should enforce account limits', async () => {
    const context = createMockContext({ userId: 'user-123' });

    emailAccountMock.count.resolves(3);

    try {
      await createEmailAccount(null, { input: validInput }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.include('Account limit reached');
    }
  });

  it('should store IMAP credentials in secrets', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccount = { id: 'acc-4', userId: 'user-123' };

    emailAccountMock.count.resolves(0);
    emailAccountMock.create.resolves(mockAccount);
    emailAccountMock.findByPk.resolves(mockAccount);

    await createEmailAccount(null, { input: validInput }, context);

    expect(storeImapCredentialsStub.calledOnce).to.be.true;
    expect(storeImapCredentialsStub.firstCall.args[0]).to.equal('acc-4');
    expect(storeImapCredentialsStub.firstCall.args[1]).to.deep.equal({
      username: 'test@gmail.com',
      password: 'app-password-123',
    });
  });

  it('should recalculate usage after creation', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccount = { id: 'acc-5', userId: 'user-123' };

    emailAccountMock.count.resolves(0);
    emailAccountMock.create.resolves(mockAccount);
    emailAccountMock.findByPk.resolves(mockAccount);

    await createEmailAccount(null, { input: validInput }, context);

    expect(recalculateUserUsageStub.calledOnce).to.be.true;
    expect(recalculateUserUsageStub.firstCall.args[0]).to.equal('user-123');
  });

  it('should set defaultSendProfileId when provided', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockAccount = { id: 'acc-6', userId: 'user-123' };

    emailAccountMock.count.resolves(0);
    emailAccountMock.create.resolves(mockAccount);
    emailAccountMock.findByPk.resolves(mockAccount);

    const input = { ...validInput, defaultSendProfileId: 'sp-123' };
    await createEmailAccount(null, { input }, context);

    const createArgs = emailAccountMock.create.firstCall.args[0] as any;
    expect(createArgs.defaultSendProfileId).to.equal('sp-123');
  });

  it('should throw when IMAP fields are missing for IMAP type', async () => {
    const context = createMockContext({ userId: 'user-123' });
    emailAccountMock.count.resolves(0);

    const input = {
      type: 'IMAP',
      name: 'Missing IMAP Fields',
      email: 'test@gmail.com',
    };

    try {
      await createEmailAccount(null, { input }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.include('required for IMAP');
    }
  });
});
