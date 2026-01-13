import { makeMutation } from '../../types.js';
import { Contact, ContactEmail } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const createContact = makeMutation(
  'createContact',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    // Ensure at least one email is primary
    const emails = input.emails || [];
    const hasPrimary = emails.some((e: any) => e.isPrimary);
    if (emails.length > 0 && !hasPrimary) {
      emails[0].isPrimary = true;
    }

    // Find the primary email for backward compatibility
    const primaryEmail = emails.find((e: any) => e.isPrimary)?.email || emails[0]?.email || null;

    const contact = await Contact.create({
      userId,
      email: primaryEmail,
      name: input.name,
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company,
      phone: input.phone,
      notes: input.notes,
      isAutoCreated: false,
    });

    // Create ContactEmail records
    for (const emailInput of emails) {
      await ContactEmail.create({
        contactId: contact.id,
        email: emailInput.email,
        isPrimary: emailInput.isPrimary || false,
        label: emailInput.label || null,
      });
    }

    // Reload with emails
    return Contact.findByPk(contact.id, {
      include: [ContactEmail],
    });
  },
);
