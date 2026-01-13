import { makeMutation } from '../../types.js';
import { Contact, ContactEmail } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const deleteContact = makeMutation(
  'deleteContact',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const contact = await Contact.findOne({
      where: { id, userId },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    // Delete associated contact emails first
    await ContactEmail.destroy({
      where: { contactId: id },
    });

    await contact.destroy();
    return true;
  },
);
