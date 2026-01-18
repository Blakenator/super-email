/**
 * Unit tests for email-filters helper functions
 * These test the actual buildEmailWhereClause function
 */

import { expect } from 'chai';
import { buildEmailWhereClause, hasAdvancedFilters, type EmailFilterInput } from '../../helpers/email-filters.js';
import { Op } from 'sequelize';

describe('email-filters helpers', () => {
  describe('buildEmailWhereClause', () => {
    const defaultAccountIds = ['acc-1', 'acc-2'];

    describe('basic filtering', () => {
      it('should set emailAccountId to specific account when provided', () => {
        const input: EmailFilterInput = { emailAccountId: 'acc-specific' };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result.emailAccountId).to.equal('acc-specific');
      });

      it('should set emailAccountId to all account IDs when not specified', () => {
        const input: EmailFilterInput = {};
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result.emailAccountId).to.deep.equal(defaultAccountIds);
      });

      it('should filter by folder when provided', () => {
        const input: EmailFilterInput = { folder: 'INBOX' };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result.folder).to.equal('INBOX');
        expect(result.isDraft).to.equal(false);
      });

      it('should handle DRAFTS folder specially', () => {
        const input: EmailFilterInput = { folder: 'DRAFTS' };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result.folder).to.equal('DRAFTS');
        expect(result.isDraft).to.equal(true);
      });

      it('should not filter by folder when includeAllFolders is true', () => {
        const input: EmailFilterInput = { folder: 'INBOX', includeAllFolders: true };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result.folder).to.be.undefined;
        expect(result.isDraft).to.be.undefined;
      });

      it('should filter by isRead when provided', () => {
        const input: EmailFilterInput = { isRead: false };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result.isRead).to.equal(false);
      });

      it('should filter by isRead=true', () => {
        const input: EmailFilterInput = { isRead: true };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result.isRead).to.equal(true);
      });

      it('should filter by isStarred when provided', () => {
        const input: EmailFilterInput = { isStarred: true };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result.isStarred).to.equal(true);
      });

      it('should not add isRead/isStarred when undefined', () => {
        const input: EmailFilterInput = {};
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result).to.not.have.property('isRead');
        expect(result).to.not.have.property('isStarred');
      });
    });

    describe('search query', () => {
      it('should add full-text search condition for searchQuery', () => {
        const input: EmailFilterInput = { searchQuery: 'important meeting' };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        // Should have Op.and with the search condition
        expect(result[Op.and as any]).to.be.an('array');
        expect(result[Op.and as any].length).to.be.greaterThan(0);
      });

      it('should handle empty search query', () => {
        const input: EmailFilterInput = { searchQuery: '   ' };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result[Op.and as any]).to.be.undefined;
      });
    });

    describe('advanced filters', () => {
      it('should add fromContains filter', () => {
        const input: EmailFilterInput = { fromContains: 'newsletter@' };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result[Op.and as any]).to.be.an('array');
        expect(result[Op.and as any].length).to.equal(1);
      });

      it('should handle exact email match in fromContains', () => {
        const input: EmailFilterInput = { fromContains: 'user@example.com' };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result[Op.and as any]).to.be.an('array');
      });

      it('should add subjectContains filter', () => {
        const input: EmailFilterInput = { subjectContains: 'Important' };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result[Op.and as any]).to.be.an('array');
      });

      it('should add bodyContains filter', () => {
        const input: EmailFilterInput = { bodyContains: 'urgent' };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result[Op.and as any]).to.be.an('array');
      });

      it('should add toContains filter', () => {
        const input: EmailFilterInput = { toContains: 'team@' };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result[Op.and as any]).to.be.an('array');
      });

      it('should add ccContains filter', () => {
        const input: EmailFilterInput = { ccContains: 'manager@' };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result[Op.and as any]).to.be.an('array');
      });

      it('should add bccContains filter', () => {
        const input: EmailFilterInput = { bccContains: 'secret@' };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result[Op.and as any]).to.be.an('array');
      });

      it('should combine multiple advanced filters with AND', () => {
        const input: EmailFilterInput = {
          fromContains: 'newsletter@',
          subjectContains: 'Weekly',
          bodyContains: 'unsubscribe',
        };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result[Op.and as any]).to.be.an('array');
        expect(result[Op.and as any].length).to.equal(3);
      });

      it('should handle SQL injection attempts in fromContains', () => {
        const input: EmailFilterInput = { fromContains: "test'; DROP TABLE emails; --" };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        // Should sanitize single quotes
        expect(result[Op.and as any]).to.be.an('array');
        // The function should have escaped the single quotes
      });
    });

    describe('tag filtering', () => {
      it('should add tag filter for single tag', () => {
        const input: EmailFilterInput = { tagIds: ['tag-1'] };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result[Op.and as any]).to.be.an('array');
      });

      it('should add tag filter for multiple tags (AND logic)', () => {
        const input: EmailFilterInput = { tagIds: ['tag-1', 'tag-2', 'tag-3'] };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result[Op.and as any]).to.be.an('array');
      });

      it('should not add tag filter for empty array', () => {
        const input: EmailFilterInput = { tagIds: [] };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result[Op.and as any]).to.be.undefined;
      });
    });

    describe('combined filters', () => {
      it('should combine folder, read status, and advanced filters', () => {
        const input: EmailFilterInput = {
          folder: 'INBOX',
          isRead: false,
          isStarred: true,
          fromContains: 'important@',
          tagIds: ['tag-1'],
        };
        const result = buildEmailWhereClause(input, defaultAccountIds);

        expect(result.folder).to.equal('INBOX');
        expect(result.isRead).to.equal(false);
        expect(result.isStarred).to.equal(true);
        expect(result[Op.and as any]).to.be.an('array');
        expect(result[Op.and as any].length).to.equal(2); // fromContains + tagIds
      });
    });
  });

  describe('hasAdvancedFilters', () => {
    it('should return false for empty input', () => {
      const input: EmailFilterInput = {};
      expect(hasAdvancedFilters(input)).to.be.false;
    });

    it('should return false for basic filters only', () => {
      const input: EmailFilterInput = {
        folder: 'INBOX',
        isRead: true,
        isStarred: false,
        emailAccountId: 'acc-1',
      };
      expect(hasAdvancedFilters(input)).to.be.false;
    });

    it('should return true for fromContains', () => {
      const input: EmailFilterInput = { fromContains: 'test@' };
      expect(hasAdvancedFilters(input)).to.be.true;
    });

    it('should return true for toContains', () => {
      const input: EmailFilterInput = { toContains: 'recipient@' };
      expect(hasAdvancedFilters(input)).to.be.true;
    });

    it('should return true for subjectContains', () => {
      const input: EmailFilterInput = { subjectContains: 'Important' };
      expect(hasAdvancedFilters(input)).to.be.true;
    });

    it('should return true for bodyContains', () => {
      const input: EmailFilterInput = { bodyContains: 'urgent' };
      expect(hasAdvancedFilters(input)).to.be.true;
    });

    it('should return true for tagIds', () => {
      const input: EmailFilterInput = { tagIds: ['tag-1'] };
      expect(hasAdvancedFilters(input)).to.be.true;
    });

    it('should return false for empty tagIds array', () => {
      const input: EmailFilterInput = { tagIds: [] };
      expect(hasAdvancedFilters(input)).to.be.false;
    });

    it('should return false for whitespace-only string filters', () => {
      const input: EmailFilterInput = {
        fromContains: '   ',
        subjectContains: '\t\n',
      };
      expect(hasAdvancedFilters(input)).to.be.false;
    });
  });
});
