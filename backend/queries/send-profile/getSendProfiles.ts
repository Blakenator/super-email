import { makeQuery } from '../../types.js';
import { SendProfile, SmtpAccountSettings, EmailAccount } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getSendProfiles = makeQuery(
  'getSendProfiles',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    const profiles = await SendProfile.findAll({
      where: { userId },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      include: [
        {
          model: SmtpAccountSettings,
          as: 'smtpSettings',
          required: false,
        },
        {
          model: EmailAccount,
          as: 'emailAccount',
          required: false,
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return profiles;
  },
);
