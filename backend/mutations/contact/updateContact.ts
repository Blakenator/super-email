import { makeMutation } from '../../types.js';
import { Contact } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const updateContact = makeMutation(
  'updateContact',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const contact = await Contact.findOne({
      where: { id: input.id, userId },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    await contact.update({
      email: input.email ?? contact.email,
      name: input.name ?? contact.name,
      firstName: input.firstName ?? contact.firstName,
      lastName: input.lastName ?? contact.lastName,
      company: input.company ?? contact.company,
      phone: input.phone ?? contact.phone,
      notes: input.notes ?? contact.notes,
    });

    return contact;
  },
);
