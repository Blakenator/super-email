import { makeMutation } from '../../types.js';
import { Contact, ContactEmail } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const addEmailToContact = makeMutation(
  'addEmailToContact',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const contact = await Contact.findOne({
      where: { id: input.contactId, userId },
      include: [ContactEmail],
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    // Check if email already exists on this contact
    const existingEmail = await ContactEmail.findOne({
      where: {
        contactId: contact.id,
        email: input.email.toLowerCase(),
      },
    });

    if (existingEmail) {
      throw new Error('This email is already associated with this contact');
    }

    // If this is the first email or should be primary, update other emails
    const hasEmails = contact.emails && contact.emails.length > 0;
    const shouldBePrimary = input.isPrimary || !hasEmails;

    if (shouldBePrimary && hasEmails) {
      // Unset primary on existing emails
      await ContactEmail.update(
        { isPrimary: false },
        { where: { contactId: contact.id } },
      );
    }

    // Create the new email
    await ContactEmail.create({
      contactId: contact.id,
      email: input.email.toLowerCase(),
      isPrimary: shouldBePrimary,
      label: input.label || null,
    });

    // Update primary email on contact for backward compatibility
    if (shouldBePrimary) {
      await contact.update({ email: input.email.toLowerCase() });
    }

    // Reload with emails
    return Contact.findByPk(contact.id, {
      include: [ContactEmail],
    });
  },
);
