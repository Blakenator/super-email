import { sequelize } from '../db/database.js';
import { QueryTypes } from 'sequelize';
import { logger } from './logger.js';

/**
 * User storage usage from the materialized view
 */
export interface UserStorageUsage {
  userId: string;
  accountCount: number;
  totalBodySizeBytes: number;
  totalAttachmentSizeBytes: number;
  totalStorageBytes: number;
  emailCount: number;
  attachmentCount: number;
  lastRefreshedAt: Date;
}

/**
 * Refresh the user_storage_usage materialized view
 * This should be called daily at midnight UTC
 * Uses CONCURRENTLY to avoid locking reads during refresh
 */
export async function refreshUsageMaterializedView(): Promise<void> {
  logger.info('Usage', 'Refreshing user_storage_usage materialized view...');
  const startTime = Date.now();

  try {
    // Use CONCURRENTLY to allow reads during refresh (requires unique index)
    await sequelize.query(
      'REFRESH MATERIALIZED VIEW CONCURRENTLY user_storage_usage',
    );

    const duration = Date.now() - startTime;
    logger.info(
      'Usage',
      `Materialized view refreshed successfully in ${duration}ms`,
    );
  } catch (error) {
    // If CONCURRENTLY fails (e.g., first run), try without it
    if (
      error instanceof Error &&
      error.message.includes('has not been populated')
    ) {
      logger.info(
        'Usage',
        'First refresh - using non-concurrent refresh...',
      );
      await sequelize.query('REFRESH MATERIALIZED VIEW user_storage_usage');
      const duration = Date.now() - startTime;
      logger.info(
        'Usage',
        `Materialized view refreshed successfully in ${duration}ms`,
      );
    } else {
      logger.error('Usage', 'Failed to refresh materialized view:', error);
      throw error;
    }
  }
}

/**
 * Get storage usage for a specific user
 */
export async function getUserStorageUsage(
  userId: string,
): Promise<UserStorageUsage | null> {
  const results = await sequelize.query<{
    user_id: string;
    account_count: string;
    total_body_size_bytes: string;
    total_attachment_size_bytes: string;
    total_storage_bytes: string;
    email_count: string;
    attachment_count: string;
    last_refreshed_at: Date;
  }>(
    `SELECT * FROM user_storage_usage WHERE user_id = :userId`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
    },
  );

  if (results.length === 0) {
    return null;
  }

  const row = results[0];
  return {
    userId: row.user_id,
    accountCount: parseInt(row.account_count, 10),
    totalBodySizeBytes: parseInt(row.total_body_size_bytes, 10),
    totalAttachmentSizeBytes: parseInt(row.total_attachment_size_bytes, 10),
    totalStorageBytes: parseInt(row.total_storage_bytes, 10),
    emailCount: parseInt(row.email_count, 10),
    attachmentCount: parseInt(row.attachment_count, 10),
    lastRefreshedAt: row.last_refreshed_at,
  };
}

/**
 * Get real-time storage usage for a user (bypasses materialized view)
 * Use this when you need immediate accuracy (e.g., before syncing)
 */
export async function getUserStorageUsageRealtime(
  userId: string,
): Promise<UserStorageUsage | null> {
  const results = await sequelize.query<{
    user_id: string;
    account_count: string;
    total_body_size_bytes: string;
    total_attachment_size_bytes: string;
    total_storage_bytes: string;
    email_count: string;
    attachment_count: string;
  }>(
    `
    SELECT 
      :userId AS user_id,
      COALESCE(ea_count.account_count, 0) AS account_count,
      COALESCE(email_stats.total_body_size, 0) AS total_body_size_bytes,
      COALESCE(attachment_stats.total_attachment_size, 0) AS total_attachment_size_bytes,
      COALESCE(email_stats.total_body_size, 0) + COALESCE(attachment_stats.total_attachment_size, 0) AS total_storage_bytes,
      COALESCE(email_stats.email_count, 0) AS email_count,
      COALESCE(attachment_stats.attachment_count, 0) AS attachment_count
    FROM (SELECT 1) AS dummy
    LEFT JOIN (
      SELECT COUNT(*) AS account_count
      FROM email_accounts
      WHERE "userId" = :userId
    ) ea_count ON true
    LEFT JOIN (
      SELECT 
        COUNT(e.id) AS email_count,
        SUM(COALESCE(LENGTH(e."textBody"), 0) + COALESCE(LENGTH(e."htmlBody"), 0)) AS total_body_size
      FROM emails e
      INNER JOIN email_accounts ea ON e."emailAccountId" = ea.id
      WHERE ea."userId" = :userId
    ) email_stats ON true
    LEFT JOIN (
      SELECT 
        COUNT(a.id) AS attachment_count,
        SUM(a.size) AS total_attachment_size
      FROM attachments a
      INNER JOIN emails e ON a."emailId" = e.id
      INNER JOIN email_accounts ea ON e."emailAccountId" = ea.id
      WHERE ea."userId" = :userId
    ) attachment_stats ON true
    `,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
    },
  );

  if (results.length === 0) {
    return null;
  }

  const row = results[0];
  return {
    userId: row.user_id,
    accountCount: parseInt(row.account_count, 10),
    totalBodySizeBytes: parseInt(row.total_body_size_bytes, 10) || 0,
    totalAttachmentSizeBytes: parseInt(row.total_attachment_size_bytes, 10) || 0,
    totalStorageBytes: parseInt(row.total_storage_bytes, 10) || 0,
    emailCount: parseInt(row.email_count, 10) || 0,
    attachmentCount: parseInt(row.attachment_count, 10) || 0,
    lastRefreshedAt: new Date(),
  };
}

/**
 * Format bytes to human-readable string (e.g., "5.2 GB")
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Convert bytes to GB with specified decimal places
 */
export function bytesToGB(bytes: number, decimals: number = 1): number {
  const gb = bytes / (1024 * 1024 * 1024);
  return parseFloat(gb.toFixed(decimals));
}
