/**
 * Tests for updateUserPreferences mutation
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods with sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { User, ThemePreference, NotificationDetailLevel } from '../../../db/models/index.js';
import { updateUserPreferences } from '../../../mutations/auth/updateUserPreferences.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('updateUserPreferences mutation', () => {
  afterEach(() => {
    sinon.restore();
  });

  function createMockUser(overrides: Record<string, any> = {}) {
    const data: Record<string, any> = {
      id: 'user-123',
      themePreference: ThemePreference.AUTO,
      navbarCollapsed: false,
      notificationDetailLevel: NotificationDetailLevel.FULL,
      inboxDensity: false,
      inboxGroupByDate: true,
      blockExternalImages: false,
      ...overrides,
    };
    return {
      ...data,
      update: sinon.stub().callsFake(async (updates: any) => {
        Object.assign(data, updates);
      }),
      reload: sinon.stub().resolves(),
    };
  }

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();

    try {
      await (updateUserPreferences as any)(null, { input: {} }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should throw when user not found', async () => {
    const context = createMockContext({ userId: 'nonexistent' });
    sinon.stub(User, 'findByPk').resolves(null);

    try {
      await (updateUserPreferences as any)(null, { input: { themePreference: 'DARK' } }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('User not found');
    }
  });

  it('should update theme preference', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockUser = createMockUser();
    sinon.stub(User, 'findByPk').resolves(mockUser as any);

    await (updateUserPreferences as any)(null, { input: { themePreference: 'DARK' } }, context);

    expect(mockUser.update.calledOnce).to.be.true;
    expect(mockUser.update.firstCall.args[0]).to.deep.include({
      themePreference: 'DARK',
    });
    expect(mockUser.reload.calledOnce).to.be.true;
  });

  it('should reject invalid theme preference', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockUser = createMockUser();
    sinon.stub(User, 'findByPk').resolves(mockUser as any);

    try {
      await (updateUserPreferences as any)(null, { input: { themePreference: 'INVALID' } }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Invalid theme preference');
    }
  });

  it('should update navbar collapsed state', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockUser = createMockUser();
    sinon.stub(User, 'findByPk').resolves(mockUser as any);

    await (updateUserPreferences as any)(null, { input: { navbarCollapsed: true } }, context);

    expect(mockUser.update.firstCall.args[0]).to.have.property('navbarCollapsed', true);
  });

  it('should reject invalid notification detail level', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockUser = createMockUser();
    sinon.stub(User, 'findByPk').resolves(mockUser as any);

    try {
      await (updateUserPreferences as any)(null, { input: { notificationDetailLevel: 'INVALID' } }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Invalid notification detail level');
    }
  });

  it('should update multiple preferences at once', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockUser = createMockUser();
    sinon.stub(User, 'findByPk').resolves(mockUser as any);

    const input = {
      themePreference: 'LIGHT',
      navbarCollapsed: true,
      inboxDensity: true,
      inboxGroupByDate: false,
      blockExternalImages: true,
    };

    await (updateUserPreferences as any)(null, { input }, context);

    expect(mockUser.update.calledOnce).to.be.true;
    const updateArgs = mockUser.update.firstCall.args[0];
    expect(updateArgs.themePreference).to.equal('LIGHT');
    expect(updateArgs.navbarCollapsed).to.equal(true);
    expect(updateArgs.inboxDensity).to.equal(true);
    expect(updateArgs.inboxGroupByDate).to.equal(false);
    expect(updateArgs.blockExternalImages).to.equal(true);
  });

  it('should NOT call update when no fields are provided', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockUser = createMockUser();
    sinon.stub(User, 'findByPk').resolves(mockUser as any);

    await (updateUserPreferences as any)(null, { input: {} }, context);

    // No updates, so update should not be called
    expect(mockUser.update.called).to.be.false;
    expect(mockUser.reload.called).to.be.false;
  });

  it('should skip null values in input', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockUser = createMockUser();
    sinon.stub(User, 'findByPk').resolves(mockUser as any);

    await (updateUserPreferences as any)(null, { input: { themePreference: null, navbarCollapsed: true } }, context);

    expect(mockUser.update.calledOnce).to.be.true;
    const updateArgs = mockUser.update.firstCall.args[0];
    // themePreference should be skipped (null)
    expect(updateArgs).to.not.have.property('themePreference');
    expect(updateArgs.navbarCollapsed).to.equal(true);
  });

  it('should return the user after update', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const mockUser = createMockUser();
    sinon.stub(User, 'findByPk').resolves(mockUser as any);

    const result = await (updateUserPreferences as any)(null, { input: { navbarCollapsed: true } }, context);

    expect(result).to.equal(mockUser);
  });
});
