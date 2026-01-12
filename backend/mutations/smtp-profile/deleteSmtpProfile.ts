import { makeMutation } from '../../types.js';
import { SmtpProfile } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const deleteSmtpProfile = makeMutation(
  'deleteSmtpProfile',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const smtpProfile = await SmtpProfile.findOne({
      where: { id, userId },
    });

    if (!smtpProfile) {
      throw new Error('SMTP profile not found');
    }

    await smtpProfile.destroy();

    return true;
  },
);
