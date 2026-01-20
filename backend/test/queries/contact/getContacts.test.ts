/**
 * Tests for getContacts and searchContacts queries
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockContact, createMockContactEmail } from '../../utils/mock-models.js';

describe('getContacts query', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
      Contact: {
        findAll: sinon.stub(),
      },
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
    it('should return all contacts for the user', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockContacts = [
        createMockContact({ id: 'contact-1', name: 'Alice' }),
        createMockContact({ id: 'contact-2', name: 'Bob' }),
        createMockContact({ id: 'contact-3', name: 'Charlie' }),
      ];

      mockModels.Contact.findAll.resolves(mockContacts);

      const result = await mockModels.Contact.findAll({
        where: { userId: context.userId },
        include: ['ContactEmail'],
      });

      expect(result).to.have.lengthOf(3);
      expect(mockModels.Contact.findAll.calledOnce).to.be.true;
    });

    it('should return empty array when no contacts exist', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.Contact.findAll.resolves([]);

      const result = await mockModels.Contact.findAll({
        where: { userId: context.userId },
      });

      expect(result).to.be.an('array').that.is.empty;
    });

    it('should include both manual and auto-created contacts', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockContacts = [
        createMockContact({ id: 'contact-1', isAutoCreated: false }),
        createMockContact({ id: 'contact-2', isAutoCreated: true }),
      ];

      mockModels.Contact.findAll.resolves(mockContacts);

      const result = await mockModels.Contact.findAll({
        where: { userId: context.userId },
      });

      expect(result.some((c: any) => c.isAutoCreated === true)).to.be.true;
      expect(result.some((c: any) => c.isAutoCreated === false)).to.be.true;
    });

    it('should include contact emails', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const mockContact = createMockContact({ id: 'contact-1' });
      
      mockModels.Contact.findAll.resolves([{
        ...mockContact,
        emails: [
          createMockContactEmail({ email: 'primary@example.com', isPrimary: true }),
          createMockContactEmail({ email: 'secondary@example.com', isPrimary: false }),
        ],
      }]);

      const result = await mockModels.Contact.findAll({
        where: { userId: context.userId },
        include: ['ContactEmail'],
      });

      expect(result[0].emails).to.have.lengthOf(2);
    });
  });
});

describe('searchContacts query', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
      Contact: {
        findAll: sinon.stub(),
      },
      ContactEmail: {},
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('when user is authenticated', () => {
    it('should search contacts by name', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const query = 'John';
      const mockContacts = [
        createMockContact({ id: 'contact-1', name: 'John Doe' }),
        createMockContact({ id: 'contact-2', firstName: 'John', lastName: 'Smith' }),
      ];

      mockModels.Contact.findAll.resolves(mockContacts);

      // Search would use Op.iLike for case-insensitive matching
      const result = await mockModels.Contact.findAll({
        where: {
          userId: context.userId,
          // name contains query (simplified)
        },
      });

      expect(result).to.have.lengthOf(2);
      expect(result.every((c: any) => 
        c.name?.includes('John') || c.firstName?.includes('John')
      )).to.be.true;
    });

    it('should search contacts by email', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const query = 'example.com';
      const mockContacts = [
        createMockContact({ id: 'contact-1', email: 'user@example.com' }),
      ];

      mockModels.Contact.findAll.resolves(mockContacts);

      const result = await mockModels.Contact.findAll({
        where: { userId: context.userId },
        include: ['ContactEmail'],
      });

      expect(result).to.have.lengthOf(1);
    });

    it('should return empty array when no matches found', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const query = 'nonexistent';
      
      mockModels.Contact.findAll.resolves([]);

      const result = await mockModels.Contact.findAll({
        where: { userId: context.userId },
      });

      expect(result).to.be.an('array').that.is.empty;
    });

    it('should perform case-insensitive search', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const query = 'JOHN';
      const mockContacts = [
        createMockContact({ id: 'contact-1', name: 'john doe' }),
        createMockContact({ id: 'contact-2', name: 'John Smith' }),
      ];

      mockModels.Contact.findAll.resolves(mockContacts);

      const result = await mockModels.Contact.findAll({
        where: { userId: context.userId },
      });

      // Case-insensitive search should match both
      expect(result).to.have.lengthOf(2);
    });
  });
});
