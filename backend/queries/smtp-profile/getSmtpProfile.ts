import { makeQuery } from '../../types.js';
import { SmtpProfile } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getSmtpProfile = makeQuery(
  'getSmtpProfile',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    const profile = await SmtpProfile.findOne({
      where: { id, userId },
    });

    return profile;
  },
);
