/**
 * Contact Integration Tests
 * 
 * Tests the Contact GraphQL queries and mutations against the actual server.
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

describe('Contact Integration Tests', function () {
  this.timeout(30000);

  before(async () => {
    await cleanupTestData();
    await createTestUser();
  });

  beforeEach(async () => {
    // Clean up contacts between tests
    await sequelize.models.ContactEmail?.destroy({ where: {}, force: true });
    await sequelize.models.Contact?.destroy({ where: {}, force: true });
  });

  describe('Query: getContacts', () => {
    it('should return empty array when no contacts exist', async () => {
      const result = await executeAuthenticatedOperation(`
        query GetContacts {
          getContacts {
            id
            name
            email
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getContacts).to.be.an('array').that.is.empty;
    });

    it('should return created contacts', async () => {
      // Create a contact directly in the database
      const Contact = sequelize.models.Contact;
      await Contact.create({
        userId: TEST_USER_ID,
        name: 'John Doe',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      const result = await executeAuthenticatedOperation(`
        query GetContacts {
          getContacts {
            id
            name
            email
            firstName
            lastName
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getContacts).to.have.lengthOf(1);
      expect(data.getContacts[0].name).to.equal('John Doe');
      expect(data.getContacts[0].email).to.equal('john@example.com');
    });

    it('should require authentication', async () => {
      const result = await executeUnauthenticatedOperation(`
        query GetContacts {
          getContacts {
            id
            name
          }
        }
      `);

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
    });
  });

  describe('Mutation: createContact', () => {
    it('should create a new contact', async () => {
      const result = await executeAuthenticatedOperation(`
        mutation CreateContact($input: CreateContactInput!) {
          createContact(input: $input) {
            id
            name
            firstName
            lastName
            company
            emails {
              email
              isPrimary
            }
          }
        }
      `, {
        input: {
          name: 'Jane Smith',
          emails: [{ email: 'jane@example.com', isPrimary: true }],
          firstName: 'Jane',
          lastName: 'Smith',
          company: 'Acme Corp',
        },
      });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.createContact).to.have.property('id');
      expect(data.createContact.name).to.equal('Jane Smith');
      expect(data.createContact.emails).to.have.lengthOf(1);
      expect(data.createContact.emails[0].email).to.equal('jane@example.com');
      expect(data.createContact.company).to.equal('Acme Corp');
    });

    it('should create a contact with minimal info', async () => {
      const result = await executeAuthenticatedOperation(`
        mutation CreateContact($input: CreateContactInput!) {
          createContact(input: $input) {
            id
            emails {
              email
            }
          }
        }
      `, {
        input: {
          emails: [{ email: 'minimal@example.com', isPrimary: true }],
        },
      });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.createContact).to.have.property('id');
      expect(data.createContact.emails[0].email).to.equal('minimal@example.com');
    });

    it('should require authentication', async () => {
      const result = await executeUnauthenticatedOperation(`
        mutation CreateContact($input: CreateContactInput!) {
          createContact(input: $input) {
            id
          }
        }
      `, {
        input: { emails: [{ email: 'test@example.com', isPrimary: true }] },
      });

      expect(result.body.kind).to.equal('single');
      const errors = (result.body as any).singleResult.errors;
      expect(errors).to.be.an('array').that.is.not.empty;
    });
  });

  describe('Query: getContact', () => {
    it('should return a specific contact', async () => {
      const Contact = sequelize.models.Contact;
      const contact = await Contact.create({
        userId: TEST_USER_ID,
        name: 'Specific User',
        email: 'specific@example.com',
      });
      const contactId = (contact as any).id;

      const result = await executeAuthenticatedOperation(`
        query GetContact($id: String!) {
          getContact(id: $id) {
            id
            name
            email
          }
        }
      `, { id: contactId });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getContact).to.not.be.null;
      expect(data.getContact.name).to.equal('Specific User');
    });

    it('should return null for non-existent contact', async () => {
      const result = await executeAuthenticatedOperation(`
        query GetContact($id: String!) {
          getContact(id: $id) {
            id
            name
          }
        }
      `, { id: '00000000-0000-0000-0000-999999999999' });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.getContact).to.be.null;
    });
  });

  describe('Mutation: deleteContact', () => {
    it('should delete an existing contact', async () => {
      const Contact = sequelize.models.Contact;
      const contact = await Contact.create({
        userId: TEST_USER_ID,
        name: 'To Delete',
        email: 'delete@example.com',
      });
      const contactId = (contact as any).id;

      const result = await executeAuthenticatedOperation(`
        mutation DeleteContact($id: String!) {
          deleteContact(id: $id)
        }
      `, { id: contactId });

      expect(result.body.kind).to.equal('single');
      const data = (result.body as any).singleResult.data;
      expect(data.deleteContact).to.be.true;

      // Verify it's deleted
      const deletedContact = await Contact.findByPk(contactId);
      expect(deletedContact).to.be.null;
    });
  });
});
