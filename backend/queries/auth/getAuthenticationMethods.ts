import { makeQuery } from '../../types.js';
import { AuthenticationMethod } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const getAuthenticationMethods = makeQuery(
  'getAuthenticationMethods',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    const methods = await AuthenticationMethod.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    return methods;
  },
);
