import { makeMutation } from '../../types.js';
import { recalculateUserUsage } from '../../helpers/usage-calculator.js';
import { requireAuth } from '../../helpers/auth.js';

/**
 * Force refresh storage usage for the current user.
 * Returns true if successful.
 */
export const refreshStorageUsage = makeMutation(
  'refreshStorageUsage',
  async (_parent, _args, context) => {
    const userId = requireAuth(context);

    await recalculateUserUsage(userId);
    return true;
  },
);
