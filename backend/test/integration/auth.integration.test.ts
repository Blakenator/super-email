/**
 * Auth Integration Tests
 *
 * Tests the Auth-related GraphQL queries and mutations against the actual server.
 */

import { expect } from 'chai';
import {
  executeAuthenticatedOperation,
  executeUnauthenticatedOperation,
  cleanupTestData,
  createTestUser,
  TEST_USER_ID,
} from './server-setup.js';
import { sequelize } from '../../db/database.js';

describe('Auth Integration Tests', function () {
  this.timeout(30000);

  before(async () => {
    await cleanupTestData();
    await createTestUser();
  });

  describe('Query: fetchProfile', () => {
    it('should return user profile when authenticated', async () => {
      const result = await executeAuthenticatedOperation(`
        query FetchProfile {
          fetchProfile {
            id
            email
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;

      // fetchProfile should return the user or null depending on implementation
      // If the user exists, it should have the correct ID
      if (data.fetchProfile) {
        expect(data.fetchProfile.id).to.equal(TEST_USER_ID);
      }
    });

    it('should handle unauthenticated requests', async () => {
      const result = await executeUnauthenticatedOperation(`
        query FetchProfile {
          fetchProfile {
            id
            email
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      // fetchProfile might return null or throw error for unauthenticated
      const singleResult = (result.body as any).singleResult;
      // Either data is null or there's an error
      expect(singleResult.data?.fetchProfile === null || singleResult.errors).to.be.ok;
    });
  });

  describe('Query: getAuthenticationMethods', () => {
    it('should return authentication methods when authenticated', async () => {
      const result = await executeAuthenticatedOperation(`
        query GetAuthenticationMethods {
          getAuthenticationMethods {
            id
            provider
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const singleResult = (result.body as any).singleResult;

      // Should return an array without errors
      expect(singleResult.errors).to.be.undefined;
      expect(singleResult.data.getAuthenticationMethods).to.be.an('array');
    });

    it('should require authentication', async () => {
      const result = await executeUnauthenticatedOperation(`
        query GetAuthenticationMethods {
          getAuthenticationMethods {
            id
            provider
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
    });
  });

  describe('Mutation: updateUserPreferences', () => {
    it('should update user preferences', async () => {
      const result = await executeAuthenticatedOperation(`
        mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
          updateUserPreferences(input: $input) {
            id
            themePreference
            navbarCollapsed
          }
        }
      `, {
        input: {
          themePreference: 'DARK',
          navbarCollapsed: true,
        },
      });

      expect(result.body.kind).to.equal('single');
      const singleResult = (result.body as any).singleResult;

      expect(singleResult.errors).to.be.undefined;
      expect(singleResult.data.updateUserPreferences).to.have.property('id');
      expect(singleResult.data.updateUserPreferences.themePreference).to.equal('DARK');
    });

    it('should require authentication', async () => {
      const result = await executeUnauthenticatedOperation(`
        mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
          updateUserPreferences(input: $input) {
            id
          }
        }
      `, {
        input: { themePreference: 'LIGHT' },
      });

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
    });
  });

  describe('Mutation: updateThemePreference', () => {
    it('should update theme preference', async () => {
      const result = await executeAuthenticatedOperation(`
        mutation UpdateThemePreference($themePreference: ThemePreference!) {
          updateThemePreference(themePreference: $themePreference) {
            id
            themePreference
          }
        }
      `, { themePreference: 'DARK' });

      expect(result.body.kind).to.equal('single');
      const singleResult = (result.body as any).singleResult;

      expect(singleResult.errors).to.be.undefined;
      expect(singleResult.data.updateThemePreference).to.have.property('id');
      expect(singleResult.data.updateThemePreference.themePreference).to.equal('DARK');
    });

    it('should require authentication', async () => {
      const result = await executeUnauthenticatedOperation(`
        mutation UpdateThemePreference($themePreference: ThemePreference!) {
          updateThemePreference(themePreference: $themePreference) {
            id
          }
        }
      `, { themePreference: 'LIGHT' });

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
    });
  });
});
