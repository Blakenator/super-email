import { makeQuery } from '../../types.js';
import { SmtpProfile } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getSmtpProfiles = makeQuery(
  'getSmtpProfiles',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    const profiles = await SmtpProfile.findAll({
      where: { userId },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    return profiles;
  },
);
