import { makeQuery } from '../../types.js';
import {
  getUserStorageUsage,
  bytesToGB,
} from '../../helpers/usage-calculator.js';

/**
 * Get only the current user's storage usage (cached from materialized view).
 * Returns null if usage hasn't been calculated yet.
 */
export const getStorageUsage = makeQuery(
  'getStorageUsage',
  async (_parent, _args, context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const usage = await getUserStorageUsage(context.user.id);

    if (!usage) {
      return null;
    }

    return {
      userId: context.user.id,
      accountCount: usage.accountCount,
      totalBodySizeBytes: usage.totalBodySizeBytes,
      totalAttachmentSizeBytes: usage.totalAttachmentSizeBytes,
      totalStorageBytes: usage.totalStorageBytes,
      totalStorageGB: bytesToGB(usage.totalStorageBytes),
      emailCount: usage.emailCount,
      attachmentCount: usage.attachmentCount,
      lastRefreshedAt: usage.lastRefreshedAt,
    };
  },
);
