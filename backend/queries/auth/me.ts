import { makeQuery } from '../../types.js';
import { User, EmailAccount, SmtpProfile } from '../../db/models/index.js';
import { getUserIdFromContext } from '../../helpers/auth.js';

export const me = makeQuery('me', async (_parent, _args, context) => {
  const userId = getUserIdFromContext(context);

  if (!userId) {
    return null;
  }

  const user = await User.findByPk(userId, {
    include: [EmailAccount, SmtpProfile],
  });

  return user;
});
