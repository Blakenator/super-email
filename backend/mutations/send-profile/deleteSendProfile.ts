import { makeMutation } from '../../types.js';
import { SendProfile } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';
import { deleteSmtpCredentials } from '../../helpers/secrets.js';
import { logger } from '../../helpers/logger.js';

export const deleteSendProfile = makeMutation(
  'deleteSendProfile',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const sendProfile = await SendProfile.findOne({
      where: { id, userId },
    });

    if (!sendProfile) {
      throw new Error('Send profile not found');
    }

    await deleteSmtpCredentials(id);
    await sendProfile.destroy();

    logger.info('deleteSendProfile', `Deleted send profile ${sendProfile.email} (${id}) for user ${userId}`);
    return true;
  },
);
