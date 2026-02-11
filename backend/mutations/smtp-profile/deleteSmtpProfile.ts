import { makeMutation } from '../../types.js';
import { SmtpProfile } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { deleteSmtpCredentials } from '../../helpers/secrets.js';
import { logger } from '../../helpers/logger.js';

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

    // Delete credentials from secure secrets store
    await deleteSmtpCredentials(id);

    await smtpProfile.destroy();

    logger.info('deleteSmtpProfile', `Deleted SMTP profile ${smtpProfile.email} (${id}) for user ${userId}`);
    return true;
  },
);
