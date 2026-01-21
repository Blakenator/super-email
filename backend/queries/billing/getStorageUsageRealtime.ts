import { makeQuery } from '../../types.js';
import {
  getUserStorageUsageRealtime,
  bytesToGB,
} from '../../helpers/usage-calculator.js';

/**
 * Get real-time storage usage (bypasses cache, slower but accurate).
 * Use this before syncing to check current limits.
 */
export const getStorageUsageRealtime = makeQuery(
  'getStorageUsageRealtime',
  async (_parent, _args, context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const usage = await getUserStorageUsageRealtime(context.user.id);

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
