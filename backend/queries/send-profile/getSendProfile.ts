import { makeQuery } from '../../types.js';
import { SendProfile, SmtpAccountSettings } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getSendProfile = makeQuery(
  'getSendProfile',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const profile = await SendProfile.findOne({
      where: { id, userId },
      include: [
        {
          model: SmtpAccountSettings,
          as: 'smtpSettings',
          required: false,
        },
      ],
    });

    return profile;
  },
);
