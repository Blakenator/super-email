import { makeMutation } from '../../types.js';
import { refreshUsageMaterializedView } from '../../helpers/usage-calculator.js';

/**
 * Force refresh the storage usage materialized view.
 * Normally this runs automatically at midnight UTC.
 * Returns true if successful.
 */
export const refreshStorageUsage = makeMutation(
  'refreshStorageUsage',
  async (_parent, _args, context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    await refreshUsageMaterializedView();
    return true;
  },
);
