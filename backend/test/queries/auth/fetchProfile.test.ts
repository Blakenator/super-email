/**
 * Tests for fetchProfile query
 *
 * Tests the REAL resolver by importing it via esmock to mock
 * the getUserFromToken helper (which requires Supabase).
 */

import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import { User, AuthenticationMethod } from '../../../db/models/index.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('fetchProfile query', () => {
  let fetchProfile: any;
  let getUserFromTokenStub: sinon.SinonStub;

  beforeEach(async () => {
    getUserFromTokenStub = sinon.stub();

    const mod = await esmock(
      '../../../queries/auth/fetchProfile.js',
      {
        '../../../helpers/auth.js': {
          getUserFromToken: getUserFromTokenStub,
        },
      },
    );
    fetchProfile = mod.fetchProfile;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return null when no token provided', async () => {
    const context = createUnauthenticatedContext();

    const result = await fetchProfile(null, {}, context);

    expect(result).to.be.null;
    expect(getUserFromTokenStub.called).to.be.false;
  });

  it('should return null when getUserFromToken returns null', async () => {
    const context = createMockContext({ userId: 'user-123' });
    getUserFromTokenStub.resolves(null);

    const result = await fetchProfile(null, {}, context);

    expect(result).to.be.null;
  });

  it('should return existing user when auth method found', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockAuthMethod = { userId: 'user-123', update: sinon.stub().resolves() };

    getUserFromTokenStub.resolves({ id: 'supabase-123', email: 'test@example.com' });
    sinon.stub(AuthenticationMethod, 'findOne').resolves(mockAuthMethod as any);
    sinon.stub(User, 'findByPk').resolves(mockUser as any);

    const result = await fetchProfile(null, {}, context);

    expect(result).to.equal(mockUser);
    expect(mockAuthMethod.update.calledOnce).to.be.true; // lastUsedAt updated
  });

  it('should create new user and auth method for new Supabase user', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockUser = { id: 'new-user', email: 'new@example.com' };

    getUserFromTokenStub.resolves({ id: 'new-supabase', email: 'new@example.com', firstName: 'New', lastName: 'User' });
    sinon.stub(AuthenticationMethod, 'findOne').resolves(null); // No auth method
    sinon.stub(User, 'findOne').resolves(null); // No existing user
    sinon.stub(User, 'create').resolves(mockUser as any);
    sinon.stub(AuthenticationMethod, 'create').resolves({} as any);

    const result = await fetchProfile(null, {}, context);

    expect(result).to.equal(mockUser);
    expect((User.create as sinon.SinonStub).calledOnce).to.be.true;
    expect((AuthenticationMethod.create as sinon.SinonStub).calledOnce).to.be.true;
  });

  it('should link auth method to existing user with same email', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockUser = { id: 'existing-user', email: 'existing@example.com' };

    getUserFromTokenStub.resolves({ id: 'new-supabase', email: 'existing@example.com' });
    sinon.stub(AuthenticationMethod, 'findOne').resolves(null);
    sinon.stub(User, 'findOne').resolves(mockUser as any); // User with same email exists
    const authCreateStub = sinon.stub(AuthenticationMethod, 'create').resolves({} as any);

    const result = await fetchProfile(null, {}, context);

    expect(result).to.equal(mockUser);
    expect(authCreateStub.calledOnce).to.be.true;
    expect(authCreateStub.firstCall.args[0]).to.deep.include({
      userId: 'existing-user',
      providerUserId: 'new-supabase',
    });
  });
});
