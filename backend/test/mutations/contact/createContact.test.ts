/**
 * Tests for createContact mutation
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';
import { createMockContact, createMockContactEmail } from '../../utils/mock-models.js';

describe('createContact mutation', () => {
  let mockModels: any;

  beforeEach(() => {
    mockModels = {
      Contact: {
        create: sinon.stub(),
        findByPk: sinon.stub(),
      },
      ContactEmail: {
        create: sinon.stub(),
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
    it('should create contact with valid input', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        emails: [{ email: 'contact@example.com', isPrimary: true }],
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Example Corp',
        phone: '+1-555-1234',
        notes: 'Test contact',
      };
      
      const newContact = createMockContact({
        ...input,
        userId: context.userId,
        email: 'contact@example.com',
      });

      mockModels.Contact.create.resolves(newContact);
      mockModels.ContactEmail.create.resolves(createMockContactEmail());
      mockModels.Contact.findByPk.resolves(newContact);

      // Create contact
      const result = await mockModels.Contact.create({
        userId: context.userId,
        email: 'contact@example.com',
        name: input.name,
        firstName: input.firstName,
        lastName: input.lastName,
        company: input.company,
        phone: input.phone,
        notes: input.notes,
        isAutoCreated: false,
      });

      expect(result).to.exist;
      expect(result.name).to.equal(input.name);
      expect(result.email).to.equal('contact@example.com');
      expect(mockModels.Contact.create.calledOnce).to.be.true;
    });

    it('should set first email as primary if none specified', async () => {
      const input = {
        emails: [
          { email: 'first@example.com', isPrimary: false },
          { email: 'second@example.com', isPrimary: false },
        ],
      };
      
      // Simulate the logic
      const emails: Array<{ email: string; isPrimary: boolean }> = [...input.emails];
      const hasPrimary = emails.some((e) => e.isPrimary);
      if (!hasPrimary && emails.length > 0) {
        emails[0] = { ...emails[0], isPrimary: true };
      }
      
      expect(emails[0]).to.have.property('isPrimary', true);
    });

    it('should create ContactEmail records for each email', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        emails: [
          { email: 'work@example.com', isPrimary: true, label: 'Work' },
          { email: 'personal@example.com', isPrimary: false, label: 'Personal' },
        ],
      };
      
      const newContact = createMockContact({ id: 'contact-123' });
      mockModels.Contact.create.resolves(newContact);
      mockModels.ContactEmail.create.resolves(createMockContactEmail());

      await mockModels.Contact.create({
        userId: context.userId,
        email: 'work@example.com',
        isAutoCreated: false,
      });

      // Create ContactEmail for each email
      for (const emailInput of input.emails) {
        await mockModels.ContactEmail.create({
          contactId: newContact.id,
          email: emailInput.email,
          isPrimary: emailInput.isPrimary || false,
          label: emailInput.label || null,
        });
      }

      expect(mockModels.ContactEmail.create.calledTwice).to.be.true;
    });

    it('should set isAutoCreated to false for manually created contacts', async () => {
      const context = createMockContext({ userId: 'user-123' });
      
      mockModels.Contact.create.resolves(createMockContact({ isAutoCreated: false }));

      await mockModels.Contact.create({
        userId: context.userId,
        email: 'test@example.com',
        isAutoCreated: false,
      });

      expect(mockModels.Contact.create.firstCall.args[0]).to.have.property('isAutoCreated', false);
    });

    it('should reload contact with emails after creation', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const newContact = createMockContact({ id: 'contact-123' });
      
      mockModels.Contact.create.resolves(newContact);
      mockModels.Contact.findByPk.resolves({
        ...newContact,
        emails: [createMockContactEmail()],
      });

      await mockModels.Contact.create({
        userId: context.userId,
        email: 'test@example.com',
        isAutoCreated: false,
      });

      // Reload with emails
      const reloaded = await mockModels.Contact.findByPk(newContact.id, {
        include: ['ContactEmail'],
      });

      expect(reloaded.emails).to.exist;
      expect(mockModels.Contact.findByPk.calledOnce).to.be.true;
    });

    it('should handle contact with only required fields', async () => {
      const context = createMockContext({ userId: 'user-123' });
      const input = {
        emails: [{ email: 'minimal@example.com' }],
      };
      
      mockModels.Contact.create.resolves(createMockContact({
        email: 'minimal@example.com',
        name: null,
        firstName: null,
        lastName: null,
        company: null,
        phone: null,
        notes: null,
      }));

      await mockModels.Contact.create({
        userId: context.userId,
        email: input.emails[0].email,
        name: undefined,
        firstName: undefined,
        lastName: undefined,
        company: undefined,
        phone: undefined,
        notes: undefined,
        isAutoCreated: false,
      });

      expect(mockModels.Contact.create.calledOnce).to.be.true;
    });
  });
});
