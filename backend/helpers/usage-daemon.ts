import { refreshUsageMaterializedView } from './usage-calculator.js';
import { logger } from './logger.js';
import { config } from '../config/env.js';

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
      await refreshUsageMaterializedView();
    } catch (error) {
      logger.error('Usage Daemon', 'Failed to refresh usage:', error);
    }

    // Schedule the next refresh
    scheduleNextRefresh();
  }, msUntilRefresh);
}

/**
 * Start the usage calculation daemon
 * Refreshes the materialized view daily at midnight UTC
 */
export async function startUsageDaemon(): Promise<void> {
  logger.info('Usage Daemon', 'Starting usage calculation daemon...');

  // Do an initial refresh on startup
  try {
    await refreshUsageMaterializedView();
    logger.info('Usage Daemon', 'Initial refresh completed');
  } catch (error) {
    // Log but don't fail - the view might not exist yet
    logger.warn(
      'Usage Daemon',
      'Initial refresh failed (view may not exist yet):',
      error instanceof Error ? error.message : String(error),
    );
  }

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
 * Force an immediate refresh (for manual triggers or testing)
 */
export async function forceRefresh(): Promise<void> {
  logger.info('Usage Daemon', 'Forcing immediate refresh...');
  await refreshUsageMaterializedView();
}
