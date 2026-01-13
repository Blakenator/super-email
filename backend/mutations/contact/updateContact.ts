import { makeMutation } from '../../types.js';
import { Contact, ContactEmail } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const updateContact = makeMutation(
  'updateContact',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const contact = await Contact.findOne({
      where: { id: input.id, userId },
      include: [ContactEmail],
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    // Update basic fields
    await contact.update({
      name: input.name ?? contact.name,
      firstName: input.firstName ?? contact.firstName,
      lastName: input.lastName ?? contact.lastName,
      company: input.company ?? contact.company,
      phone: input.phone ?? contact.phone,
      notes: input.notes ?? contact.notes,
    });

    // If emails are provided, replace all emails
    if (input.emails) {
      // Delete existing emails
      await ContactEmail.destroy({
        where: { contactId: contact.id },
      });

      // Ensure at least one email is primary
      const emails = input.emails;
      const hasPrimary = emails.some((e: any) => e.isPrimary);
      if (emails.length > 0 && !hasPrimary) {
        emails[0].isPrimary = true;
      }

      // Create new email records
      for (const emailInput of emails) {
        await ContactEmail.create({
          contactId: contact.id,
          email: emailInput.email,
          isPrimary: emailInput.isPrimary || false,
          label: emailInput.label || null,
        });
      }

      // Update primary email for backward compatibility
      const primaryEmail = emails.find((e: any) => e.isPrimary)?.email || emails[0]?.email || null;
      await contact.update({ email: primaryEmail });
    }

    // Reload with emails
    return Contact.findByPk(contact.id, {
      include: [ContactEmail],
    });
  },
);
