import { makeMutation } from '../../types.js';
import { Contact, Email, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

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

    // Check if contact already exists
    const existing = await Contact.findOne({
      where: {
        userId,
        email: email.fromAddress,
      },
    });

    if (existing) {
      // Update existing contact if it was auto-created
      if (existing.isAutoCreated && !existing.name && email.fromName) {
        await existing.update({
          name: email.fromName,
          isAutoCreated: false,
        });
      }
      return existing;
    }

    // Create new contact
    const contact = await Contact.create({
      userId,
      email: email.fromAddress,
      name: email.fromName,
      isAutoCreated: false,
    });

    return contact;
  },
);
