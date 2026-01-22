import { sequelize } from '../db/database.js';
import { QueryTypes } from 'sequelize';
import { logger } from './logger.js';
import { UserUsage } from '../db/models/user-usage.model.js';

/**
 * User storage usage interface
 */
export interface UserStorageUsage {
  userId: string;
  accountCount: number;
  totalBodySizeBytes: number;
  totalAttachmentSizeBytes: number;
  totalStorageBytes: number;
  emailCount: number;
  attachmentCount: number;
  lastRefreshedAt: Date | null;
}

/**
 * Recalculate and store usage for a specific user.
 * This should be called after any email sync or account changes.
 */
export async function recalculateUserUsage(userId: string): Promise<UserUsage> {
  logger.info('Usage', `Recalculating usage for user ${userId}...`);
  const startTime = Date.now();

  // Calculate real-time usage from the database
  const results = await sequelize.query<{
    account_count: string;
    total_body_size_bytes: string;
    total_attachment_size_bytes: string;
    total_storage_bytes: string;
    email_count: string;
    attachment_count: string;
  }>(
    `
    SELECT 
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

  const row = results[0];
  const usageData = {
    accountCount: parseInt(row.account_count, 10) || 0,
    totalBodySizeBytes: parseInt(row.total_body_size_bytes, 10) || 0,
    totalAttachmentSizeBytes: parseInt(row.total_attachment_size_bytes, 10) || 0,
    totalStorageBytes: parseInt(row.total_storage_bytes, 10) || 0,
    emailCount: parseInt(row.email_count, 10) || 0,
    attachmentCount: parseInt(row.attachment_count, 10) || 0,
    lastCalculatedAt: new Date(),
  };

  // Upsert the usage record
  const [usage] = await UserUsage.upsert({
    userId,
    ...usageData,
  });

  const duration = Date.now() - startTime;
  logger.info('Usage', `Usage recalculated for user ${userId} in ${duration}ms`);

  return usage;
}

/**
 * Get storage usage for a specific user from the cache table
 */
export async function getUserStorageUsage(
  userId: string,
): Promise<UserStorageUsage | null> {
  const usage = await UserUsage.findOne({ where: { userId } });

  if (!usage) {
    return null;
  }

  return {
    userId: usage.userId,
    accountCount: usage.accountCount,
    totalBodySizeBytes: Number(usage.totalBodySizeBytes),
    totalAttachmentSizeBytes: Number(usage.totalAttachmentSizeBytes),
    totalStorageBytes: Number(usage.totalStorageBytes),
    emailCount: usage.emailCount,
    attachmentCount: usage.attachmentCount,
    lastRefreshedAt: usage.lastCalculatedAt,
  };
}

/**
 * Get real-time storage usage for a user (bypasses cache)
 * Use this when you need immediate accuracy (e.g., before syncing)
 */
export async function getUserStorageUsageRealtime(
  userId: string,
): Promise<UserStorageUsage> {
  const results = await sequelize.query<{
    account_count: string;
    total_body_size_bytes: string;
    total_attachment_size_bytes: string;
    total_storage_bytes: string;
    email_count: string;
    attachment_count: string;
  }>(
    `
    SELECT 
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

  const row = results[0];
  return {
    userId,
    accountCount: parseInt(row.account_count, 10) || 0,
    totalBodySizeBytes: parseInt(row.total_body_size_bytes, 10) || 0,
    totalAttachmentSizeBytes: parseInt(row.total_attachment_size_bytes, 10) || 0,
    totalStorageBytes: parseInt(row.total_storage_bytes, 10) || 0,
    emailCount: parseInt(row.email_count, 10) || 0,
    attachmentCount: parseInt(row.attachment_count, 10) || 0,
    lastRefreshedAt: new Date(),
  };
}

/**
 * Get or create usage record for a user
 * If no record exists, calculates usage and creates one
 */
export async function getOrCreateUserUsage(userId: string): Promise<UserStorageUsage> {
  let usage = await getUserStorageUsage(userId);
  
  if (!usage) {
    // Calculate and store usage
    await recalculateUserUsage(userId);
    usage = await getUserStorageUsage(userId);
  }

  return usage!;
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
