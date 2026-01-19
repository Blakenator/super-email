/**
 * Background Sync - Periodically syncs stale email accounts
 *
 * This module runs a background job that finds email accounts that haven't been
 * synced recently and initiates syncs for them. This ensures mailboxes stay
 * up-to-date even when users aren't actively connected via WebSocket/IDLE.
 */

import { Op } from 'sequelize';
import { config } from '../config/env.js';
import { EmailAccount } from '../db/models/email-account.model.js';
import { startAsyncSync } from './imap-sync.js';
import { logger } from './logger.js';

// Track the interval timer so we can stop it if needed
let syncIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Find all email accounts that are considered stale (last synced > threshold ago)
 * and don't have an active sync in progress.
 */
async function findStaleEmailAccounts(): Promise<EmailAccount[]> {
  const { staleThresholdMinutes } = config.backgroundSync;

  // Calculate the cutoff time - accounts synced before this are stale
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - staleThresholdMinutes);

  // Find accounts that:
  // 1. Have never been synced (lastSyncedAt is null), OR
  // 2. Were last synced before the cutoff time
  // AND
  // 3. Don't have an active sync in progress (syncId is null)
  const staleAccounts = await EmailAccount.findAll({
    where: {
      syncId: null, // No active sync
      [Op.or]: [
        { lastSyncedAt: null }, // Never synced
        { lastSyncedAt: { [Op.lt]: cutoffTime } }, // Synced before cutoff
      ],
    },
    order: [
      // Prioritize accounts that have never been synced
      ['lastSyncedAt', 'ASC NULLS FIRST'],
    ],
  });

  return staleAccounts;
}

/**
 * Run a background sync cycle - finds and syncs all stale accounts
 */
export async function runBackgroundSyncCycle(): Promise<{
  checked: number;
  syncsStarted: number;
  errors: string[];
}> {
  const result = {
    checked: 0,
    syncsStarted: 0,
    errors: [] as string[],
  };

  try {
    const staleAccounts = await findStaleEmailAccounts();
    result.checked = staleAccounts.length;

    if (staleAccounts.length === 0) {
      logger.debug('BackgroundSync', 'No stale accounts found');
      return result;
    }

    logger.info(
      'BackgroundSync',
      `Found ${staleAccounts.length} stale email account(s) to sync`,
    );

    // Start syncs for all stale accounts
    // We don't await all of them - startAsyncSync runs in background
    for (const account of staleAccounts) {
      try {
        const started = await startAsyncSync(account);
        if (started) {
          result.syncsStarted++;
          logger.info(
            'BackgroundSync',
            `Started sync for ${account.email} (user: ${account.userId})`,
          );
        } else {
          logger.debug(
            'BackgroundSync',
            `Sync already in progress for ${account.email}`,
          );
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push(`Failed to start sync for ${account.email}: ${errorMsg}`);
        logger.error(
          'BackgroundSync',
          `Failed to start sync for ${account.email}`,
          err,
        );
      }
    }

    logger.info(
      'BackgroundSync',
      `Sync cycle complete: ${result.syncsStarted} syncs started out of ${result.checked} stale accounts`,
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(`Background sync cycle failed: ${errorMsg}`);
    logger.error('BackgroundSync', 'Sync cycle failed', err);
  }

  return result;
}

/**
 * Start the background sync scheduler
 * Runs immediately once, then at the configured interval
 */
export function startBackgroundSync(): void {
  if (!config.backgroundSync.enabled) {
    logger.info('BackgroundSync', 'Background sync is disabled');
    return;
  }

  if (syncIntervalId) {
    logger.warn('BackgroundSync', 'Background sync already running');
    return;
  }

  const { intervalMinutes, staleThresholdMinutes } = config.backgroundSync;

  logger.info(
    'BackgroundSync',
    `Starting background sync scheduler (interval: ${intervalMinutes}m, stale threshold: ${staleThresholdMinutes}m)`,
  );

  // Run once immediately after a short delay to allow server to fully start
  setTimeout(() => {
    logger.info('BackgroundSync', 'Running initial sync cycle');
    runBackgroundSyncCycle().catch((err) => {
      logger.error('BackgroundSync', 'Initial sync cycle failed', err);
    });
  }, 5000); // 5 second delay for startup

  // Then run at the configured interval
  const intervalMs = intervalMinutes * 60 * 1000;
  syncIntervalId = setInterval(() => {
    logger.info('BackgroundSync', 'Running scheduled sync cycle');
    runBackgroundSyncCycle().catch((err) => {
      logger.error('BackgroundSync', 'Scheduled sync cycle failed', err);
    });
  }, intervalMs);

  logger.info(
    'BackgroundSync',
    `Background sync scheduler started, next run in ${intervalMinutes} minutes`,
  );
}

/**
 * Stop the background sync scheduler
 */
export function stopBackgroundSync(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    logger.info('BackgroundSync', 'Background sync scheduler stopped');
  }
}

/**
 * Check if background sync is currently running
 */
export function isBackgroundSyncRunning(): boolean {
  return syncIntervalId !== null;
}
