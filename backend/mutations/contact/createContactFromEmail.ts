import { makeMutation } from '../../types.js';
import {
  Contact,
  ContactEmail,
  Email,
  EmailAccount,
} from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { logger } from '../../helpers/logger.js';

export const createContactFromEmail = makeMutation(
  'createContactFromEmail',
  async (_parent, { emailId }, context) => {
    const userId = requireAuth(context);

    // Get the email
    const email = await Email.findByPk(emailId, {
      include: [EmailAccount],
    });

    if (!email) {
      throw new Error('Email not found');
    }

    // Verify user owns this email account
    if (email.emailAccount?.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Check if contact with this email already exists
    const existingContactEmail = await ContactEmail.findOne({
      where: { email: email.fromAddress.toLowerCase() },
      include: [{ model: Contact, where: { userId } }],
    });

    if (existingContactEmail) {
      // Contact exists, update it if it was auto-created
      const existing = existingContactEmail.contact;
      if (
        existing &&
        existing.isAutoCreated &&
        !existing.name &&
        email.fromName
      ) {
        await existing.update({
          name: email.fromName,
          isAutoCreated: false,
        });
      }
      if (!existing) {
        logger.warn('createContactFromEmail', `ContactEmail record found but associated contact is missing`, { contactEmailId: existingContactEmail.id, email: email.fromAddress });
        return null;
      }
      return Contact.findByPk(existing.id, { include: [ContactEmail] });
    }

    // Also check the legacy email field
    const existingByEmail = await Contact.findOne({
      where: {
        userId,
        email: email.fromAddress.toLowerCase(),
      },
      include: [ContactEmail],
    });

    if (existingByEmail) {
      // Migrate to ContactEmail if not already
      const hasContactEmail = await ContactEmail.findOne({
        where: {
          contactId: existingByEmail.id,
          email: email.fromAddress.toLowerCase(),
        },
      });
      if (!hasContactEmail) {
        await ContactEmail.create({
          contactId: existingByEmail.id,
          email: email.fromAddress.toLowerCase(),
          isPrimary: true,
        });
      }
      if (
        existingByEmail.isAutoCreated &&
        !existingByEmail.name &&
        email.fromName
      ) {
        await existingByEmail.update({
          name: email.fromName,
          isAutoCreated: false,
        });
      }
      return Contact.findByPk(existingByEmail.id, { include: [ContactEmail] });
    }

    // Create new contact
    const contact = await Contact.create({
      userId,
      email: email.fromAddress.toLowerCase(),
      name: email.fromName,
      isAutoCreated: false,
    });

    // Create ContactEmail record
    await ContactEmail.create({
      contactId: contact.id,
      email: email.fromAddress.toLowerCase(),
      isPrimary: true,
    });

    return Contact.findByPk(contact.id, { include: [ContactEmail] });
  },
);
