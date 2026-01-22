import { recalculateUserUsage } from './usage-calculator.js';
import { logger } from './logger.js';
import { User } from '../db/models/user.model.js';

let refreshInterval: NodeJS.Timeout | null = null;

/**
 * Calculate milliseconds until next midnight UTC
 */
function msUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

/**
 * Recalculate usage for all users
 */
async function recalculateAllUsersUsage(): Promise<void> {
  logger.info('Usage Daemon', 'Recalculating usage for all users...');
  const startTime = Date.now();

  try {
    // Get all users
    const users = await User.findAll({ attributes: ['id'] });
    
    for (const user of users) {
      try {
        await recalculateUserUsage(user.id);
      } catch (error) {
        logger.warn(
          'Usage Daemon',
          `Failed to recalculate usage for user ${user.id}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    const duration = Date.now() - startTime;
    logger.info(
      'Usage Daemon',
      `Recalculated usage for ${users.length} users in ${duration}ms`,
    );
  } catch (error) {
    logger.error('Usage Daemon', 'Failed to recalculate all users:', error);
  }
}

/**
 * Schedule the next refresh at midnight UTC
 */
function scheduleNextRefresh(): void {
  const msUntilRefresh = msUntilMidnightUTC();
  const hoursUntil = (msUntilRefresh / (1000 * 60 * 60)).toFixed(1);

  logger.info(
    'Usage Daemon',
    `Next refresh scheduled in ${hoursUntil} hours (midnight UTC)`,
  );

  refreshInterval = setTimeout(async () => {
    try {
      await recalculateAllUsersUsage();
    } catch (error) {
      logger.error('Usage Daemon', 'Failed to refresh usage:', error);
    }

    // Schedule the next refresh
    scheduleNextRefresh();
  }, msUntilRefresh);
}

/**
 * Start the usage calculation daemon
 * Recalculates usage for all users daily at midnight UTC
 */
export async function startUsageDaemon(): Promise<void> {
  logger.info('Usage Daemon', 'Starting usage calculation daemon...');

  // Schedule daily refresh at midnight UTC
  scheduleNextRefresh();

  logger.info('Usage Daemon', 'Daemon started successfully');
}

/**
 * Stop the usage calculation daemon
 */
export function stopUsageDaemon(): void {
  if (refreshInterval) {
    clearTimeout(refreshInterval);
    refreshInterval = null;
    logger.info('Usage Daemon', 'Daemon stopped');
  }
}

/**
 * Force an immediate refresh for all users (for manual triggers or testing)
 */
export async function forceRefreshAll(): Promise<void> {
  logger.info('Usage Daemon', 'Forcing immediate refresh for all users...');
  await recalculateAllUsersUsage();
}
