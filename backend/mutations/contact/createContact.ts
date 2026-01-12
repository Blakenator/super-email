import { makeMutation } from '../../types.js';
import { Contact } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const createContact = makeMutation(
  'createContact',
  async (_parent, { input }, context) => {
    const userId = requireAuth(context);

    const contact = await Contact.create({
      userId,
      email: input.email,
      name: input.name,
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company,
      phone: input.phone,
      notes: input.notes,
      isAutoCreated: false,
    });

    return contact;
  },
);
