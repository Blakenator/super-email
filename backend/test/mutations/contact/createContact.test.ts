/**
 * Tests for createContact mutation
 *
 * Tests the REAL resolver by importing it directly and stubbing
 * model static methods with sinon.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { Contact, ContactEmail } from '../../../db/models/index.js';
import { createContact } from '../../../mutations/contact/createContact.js';
import { createMockContext, createUnauthenticatedContext } from '../../utils/index.js';

describe('createContact mutation', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should throw when not authenticated', async () => {
    const context = createUnauthenticatedContext();

    try {
      await (createContact as any)(null, { input: { emails: [] } }, context);
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).to.equal('Authentication required');
    }
  });

  it('should create contact with the primary email derived from input', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = {
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      company: 'Example Corp',
      phone: '+1-555-1234',
      notes: 'Test contact',
      emails: [
        { email: 'john@example.com', isPrimary: true, label: 'Work' },
      ],
    };

    const mockContact = { id: 'contact-1', userId: 'user-123', name: 'John Doe' };
    const mockContactWithEmails = { ...mockContact, ContactEmails: [{ email: 'john@example.com' }] };

    const contactCreateStub = sinon.stub(Contact, 'create').resolves(mockContact as any);
    const contactEmailCreateStub = sinon.stub(ContactEmail, 'create').resolves({} as any);
    sinon.stub(Contact, 'findByPk').resolves(mockContactWithEmails as any);

    await (createContact as any)(null, { input }, context);

    // Verify Contact.create was called with derived primary email
    expect(contactCreateStub.calledOnce).to.be.true;
    const createArgs = contactCreateStub.firstCall.args[0] as any;
    expect(createArgs.userId).to.equal('user-123');
    expect(createArgs.email).to.equal('john@example.com');
    expect(createArgs.name).to.equal('John Doe');
    expect(createArgs.isAutoCreated).to.equal(false);

    // Verify ContactEmail.create was called for each email
    expect(contactEmailCreateStub.calledOnce).to.be.true;
    const ceArgs = contactEmailCreateStub.firstCall.args[0] as any;
    expect(ceArgs.contactId).to.equal('contact-1');
    expect(ceArgs.email).to.equal('john@example.com');
    expect(ceArgs.isPrimary).to.equal(true);
  });

  it('should set first email as primary if none specified', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = {
      emails: [
        { email: 'first@example.com', isPrimary: false },
        { email: 'second@example.com', isPrimary: false },
      ],
    };

    const mockContact = { id: 'contact-2', userId: 'user-123' };

    const contactCreateStub = sinon.stub(Contact, 'create').resolves(mockContact as any);
    sinon.stub(ContactEmail, 'create').resolves({} as any);
    sinon.stub(Contact, 'findByPk').resolves(mockContact as any);

    await (createContact as any)(null, { input }, context);

    // Resolver should derive primaryEmail from emails[0] after setting isPrimary
    const createArgs = contactCreateStub.firstCall.args[0] as any;
    expect(createArgs.email).to.equal('first@example.com');
  });

  it('should create ContactEmail records for each email', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = {
      emails: [
        { email: 'work@example.com', isPrimary: true, label: 'Work' },
        { email: 'personal@example.com', isPrimary: false, label: 'Personal' },
      ],
    };

    const mockContact = { id: 'contact-3', userId: 'user-123' };

    sinon.stub(Contact, 'create').resolves(mockContact as any);
    const contactEmailCreateStub = sinon.stub(ContactEmail, 'create').resolves({} as any);
    sinon.stub(Contact, 'findByPk').resolves(mockContact as any);

    await (createContact as any)(null, { input }, context);

    expect(contactEmailCreateStub.callCount).to.equal(2);

    const firstCall = contactEmailCreateStub.firstCall.args[0] as any;
    expect(firstCall.email).to.equal('work@example.com');
    expect(firstCall.isPrimary).to.equal(true);
    expect(firstCall.label).to.equal('Work');

    const secondCall = contactEmailCreateStub.secondCall.args[0] as any;
    expect(secondCall.email).to.equal('personal@example.com');
    expect(secondCall.isPrimary).to.equal(false);
    expect(secondCall.label).to.equal('Personal');
  });

  it('should reload contact with emails after creation', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = {
      emails: [{ email: 'test@example.com', isPrimary: true }],
    };

    const mockContact = { id: 'contact-4', userId: 'user-123' };
    const mockReloaded = { ...mockContact, ContactEmails: [{ email: 'test@example.com' }] };

    sinon.stub(Contact, 'create').resolves(mockContact as any);
    sinon.stub(ContactEmail, 'create').resolves({} as any);
    const findByPkStub = sinon.stub(Contact, 'findByPk').resolves(mockReloaded as any);

    const result = await (createContact as any)(null, { input }, context);

    // Verify findByPk was called with the contact ID and includes
    expect(findByPkStub.calledOnce).to.be.true;
    expect(findByPkStub.firstCall.args[0]).to.equal('contact-4');
    expect(findByPkStub.firstCall.args[1]).to.deep.include({ include: [ContactEmail] });

    // Verify the final result is the reloaded contact
    expect(result).to.equal(mockReloaded);
  });

  it('should handle contact with no emails', async () => {
    const context = createMockContext({ userId: 'user-123' });
    const input = { name: 'No Emails', emails: [] };

    const mockContact = { id: 'contact-5', userId: 'user-123' };

    const contactCreateStub = sinon.stub(Contact, 'create').resolves(mockContact as any);
    const contactEmailCreateStub = sinon.stub(ContactEmail, 'create').resolves({} as any);
    sinon.stub(Contact, 'findByPk').resolves(mockContact as any);

    await (createContact as any)(null, { input }, context);

    // No email should be set
    const createArgs = contactCreateStub.firstCall.args[0] as any;
    expect(createArgs.email).to.be.null;

    // No ContactEmail records should be created
    expect(contactEmailCreateStub.callCount).to.equal(0);
  });
});
