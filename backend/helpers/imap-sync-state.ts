import { ImapAccountSettings } from '../db/models/imap-account-settings.model.js';
import { logger } from './logger.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
  cancelled: boolean;
}

export type SyncType = 'historical' | 'update';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SYNC_EXPIRATION_MINUTES = 60;
export const SYNC_EXPIRATION_UPDATE_INTERVAL = 30; // seconds

// ---------------------------------------------------------------------------
// Field-name helpers
// ---------------------------------------------------------------------------

export function getSyncFields(syncType: SyncType) {
  if (syncType === 'historical') {
    return {
      syncIdField: 'historicalSyncId' as const,
      progressField: 'historicalSyncProgress' as const,
      statusField: 'historicalSyncStatus' as const,
      expiresAtField: 'historicalSyncExpiresAt' as const,
    };
  }
  return {
    syncIdField: 'updateSyncId' as const,
    progressField: 'updateSyncProgress' as const,
    statusField: 'updateSyncStatus' as const,
    expiresAtField: 'updateSyncExpiresAt' as const,
  };
}

// ---------------------------------------------------------------------------
// Expiration helpers
// ---------------------------------------------------------------------------

export function getSyncExpirationTime(): Date {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + SYNC_EXPIRATION_MINUTES);
  return expiresAt;
}

export function isSyncExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) {
    return true;
  }
  return new Date() > expiresAt;
}

// ---------------------------------------------------------------------------
// Sync lifecycle
// ---------------------------------------------------------------------------

export async function clearExpiredSync(
  imapSettings: ImapAccountSettings,
  syncType: SyncType,
): Promise<void> {
  const fields = getSyncFields(syncType);
  await imapSettings.update({
    [fields.syncIdField]: null,
    [fields.progressField]: null,
    [fields.statusField]: null,
    [fields.expiresAtField]: null,
  });
}

/**
 * Atomically start a sync of the given type.
 * Uses a conditional UPDATE (compare-and-swap on syncId = NULL) to prevent
 * concurrent calls from overwriting each other's syncId.
 */
export async function markSyncStarted(
  imapSettings: ImapAccountSettings,
  syncType: SyncType,
  syncId: string,
): Promise<boolean> {
  const fields = getSyncFields(syncType);
  const [affectedRows] = await ImapAccountSettings.update(
    {
      [fields.syncIdField]: syncId,
      [fields.progressField]: 0,
      [fields.statusField]:
        syncType === 'historical'
          ? 'Starting historical sync...'
          : 'Starting sync...',
      [fields.expiresAtField]: getSyncExpirationTime(),
    },
    {
      where: {
        id: imapSettings.id,
        [fields.syncIdField]: null,
      },
    },
  );
  if (affectedRows > 0) {
    await imapSettings.reload();
  }
  return affectedRows > 0;
}

export async function updateSyncProgress(
  imapSettings: ImapAccountSettings,
  syncType: SyncType,
  syncId: string,
  progress: number,
  status: string,
): Promise<boolean> {
  await imapSettings.reload();
  const fields = getSyncFields(syncType);

  if (imapSettings[fields.syncIdField] !== syncId) {
    return false;
  }

  await imapSettings.update({
    [fields.progressField]: progress,
    [fields.statusField]: status,
    [fields.expiresAtField]: getSyncExpirationTime(),
  });
  return true;
}

export async function markSyncCompleted(
  imapSettings: ImapAccountSettings,
  syncType: SyncType,
  syncId: string,
  result: SyncResult,
): Promise<boolean> {
  await imapSettings.reload();
  const fields = getSyncFields(syncType);
  const isHistoricalSync = syncType === 'historical';

  if (imapSettings[fields.syncIdField] !== syncId) {
    if (isHistoricalSync && !imapSettings.historicalSyncComplete) {
      await imapSettings.update({ historicalSyncComplete: true });
      logger.info('IMAP', `historicalSyncComplete set for settings ${imapSettings.id} (sync ${syncId} was superseded but completed)`);
    }
    return false;
  }

  const updateData: Record<string, unknown> = {
    [fields.syncIdField]: null,
    [fields.progressField]: 100,
    [fields.statusField]: result.cancelled
      ? 'Sync cancelled'
      : `Synced ${result.synced} emails`,
    [fields.expiresAtField]: null,
    lastSyncedAt: new Date(),
    ...(isHistoricalSync
      ? { historicalSyncComplete: true, historicalSyncLastAt: new Date() }
      : {}),
  };

  if (isHistoricalSync && !result.cancelled) {
    updateData.historicalSyncLastUidInbox = null;
    updateData.historicalSyncLastUidSent = null;
    updateData.historicalSyncTotalInbox = null;
    updateData.historicalSyncTotalSent = null;
  }

  await imapSettings.update(updateData);
  return true;
}

export async function markSyncFailed(
  imapSettings: ImapAccountSettings,
  syncType: SyncType,
  syncId: string,
  errorMsg: string,
): Promise<void> {
  await imapSettings.reload();
  const fields = getSyncFields(syncType);

  if (imapSettings[fields.syncIdField] !== syncId) {
    return;
  }

  await imapSettings.update({
    [fields.syncIdField]: null,
    [fields.progressField]: null,
    [fields.statusField]: `Sync failed: ${errorMsg}`,
    [fields.expiresAtField]: null,
  });
}

export async function shouldContinueSync(
  imapSettings: ImapAccountSettings,
  syncId: string,
  syncType: SyncType,
): Promise<boolean> {
  await imapSettings.reload();
  const fields = getSyncFields(syncType);
  return imapSettings[fields.syncIdField] === syncId;
}

export async function updateSyncExpiration(
  imapSettings: ImapAccountSettings,
  syncId: string,
  syncType: SyncType,
): Promise<void> {
  await imapSettings.reload();

  const fields = getSyncFields(syncType);
  if (imapSettings[fields.syncIdField] === syncId) {
    await imapSettings.update({
      [fields.expiresAtField]: getSyncExpirationTime(),
    });
  }
}
