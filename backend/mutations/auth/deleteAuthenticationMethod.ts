import { makeMutation } from '../../types.js';
import { AuthenticationMethod } from '../../db/models/index.js';
import { requireAuth } from '../../helpers/auth.js';

export const deleteAuthenticationMethod = makeMutation(
  'deleteAuthenticationMethod',
  async (_parent, { id }, context) => {
    const userId = requireAuth(context);

    // Find the auth method
    const authMethod = await AuthenticationMethod.findOne({
      where: { id, userId },
    });

    if (!authMethod) {
      throw new Error('Authentication method not found');
    }

    // Check if this is the last auth method
    const count = await AuthenticationMethod.count({ where: { userId } });
    if (count <= 1) {
      throw new Error(
        'Cannot delete the last authentication method. Add another method first.',
      );
    }

    await authMethod.destroy();
    return true;
  },
);
