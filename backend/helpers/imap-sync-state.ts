import { EmailAccount } from '../db/models/email-account.model.js';
import { Email } from '../db/models/email.model.js';
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
      lastAtField: 'historicalSyncLastAt' as const,
    };
  }
  return {
    syncIdField: 'updateSyncId' as const,
    progressField: 'updateSyncProgress' as const,
    statusField: 'updateSyncStatus' as const,
    expiresAtField: 'updateSyncExpiresAt' as const,
    lastAtField: 'lastSyncEmailReceivedAt' as const,
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
  emailAccount: EmailAccount,
  syncType: SyncType,
): Promise<void> {
  const fields = getSyncFields(syncType);
  await emailAccount.update({
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
  emailAccount: EmailAccount,
  syncType: SyncType,
  syncId: string,
): Promise<boolean> {
  const fields = getSyncFields(syncType);
  const [affectedRows] = await EmailAccount.update(
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
        id: emailAccount.id,
        [fields.syncIdField]: null,
      },
    },
  );
  if (affectedRows > 0) {
    await emailAccount.reload();
  }
  return affectedRows > 0;
}

export async function updateSyncProgress(
  emailAccount: EmailAccount,
  syncType: SyncType,
  syncId: string,
  progress: number,
  status: string,
): Promise<boolean> {
  await emailAccount.reload();
  const fields = getSyncFields(syncType);

  if (emailAccount[fields.syncIdField] !== syncId) {
    return false;
  }

  await emailAccount.update({
    [fields.progressField]: progress,
    [fields.statusField]: status,
    [fields.expiresAtField]: getSyncExpirationTime(),
  });
  return true;
}

export async function markSyncCompleted(
  emailAccount: EmailAccount,
  syncType: SyncType,
  syncId: string,
  result: SyncResult,
): Promise<boolean> {
  await emailAccount.reload();
  const fields = getSyncFields(syncType);
  const isHistoricalSync = syncType === 'historical';

  if (emailAccount[fields.syncIdField] !== syncId) {
    // Even if superseded, historicalSyncComplete is a monotonic flag (false→true).
    if (isHistoricalSync && !emailAccount.historicalSyncComplete) {
      await emailAccount.update({ historicalSyncComplete: true });
      logger.info('IMAP', `historicalSyncComplete set for ${emailAccount.email} (sync ${syncId} was superseded but completed)`);
    }
    return false;
  }

  // For update syncs, anchor the sync date to the most recent email's receivedAt
  // rather than the current wall-clock time so the next incremental sync picks up
  // from where we actually have data.
  let syncAnchorDate: Date = new Date();
  if (!isHistoricalSync) {
    const latestEmail = await Email.findOne({
      where: { emailAccountId: emailAccount.id },
      order: [['receivedAt', 'DESC']],
      attributes: ['receivedAt'],
    });
    if (latestEmail?.receivedAt) {
      syncAnchorDate = new Date(latestEmail.receivedAt);
    }
  }

  const updateData: Record<string, unknown> = {
    [fields.syncIdField]: null,
    [fields.progressField]: 100,
    [fields.statusField]: result.cancelled
      ? 'Sync cancelled'
      : `Synced ${result.synced} emails`,
    [fields.lastAtField]: isHistoricalSync ? new Date() : syncAnchorDate,
    [fields.expiresAtField]: null,
    lastSyncedAt: new Date(),
    ...(isHistoricalSync ? { historicalSyncComplete: true } : {}),
  };

  if (isHistoricalSync && !result.cancelled) {
    updateData.historicalSyncOldestDate = null;
    updateData.historicalSyncLastUidInbox = null;
    updateData.historicalSyncLastUidSent = null;
    updateData.historicalSyncTotalInbox = null;
    updateData.historicalSyncTotalSent = null;
  }

  await emailAccount.update(updateData);
  return true;
}

export async function markSyncFailed(
  emailAccount: EmailAccount,
  syncType: SyncType,
  syncId: string,
  errorMsg: string,
): Promise<void> {
  await emailAccount.reload();
  const fields = getSyncFields(syncType);

  if (emailAccount[fields.syncIdField] !== syncId) {
    return;
  }

  await emailAccount.update({
    [fields.syncIdField]: null,
    [fields.progressField]: null,
    [fields.statusField]: `Sync failed: ${errorMsg}`,
    [fields.expiresAtField]: null,
  });
}

export async function shouldContinueSync(
  emailAccount: EmailAccount,
  syncId: string,
  syncType: SyncType,
): Promise<boolean> {
  await emailAccount.reload();
  const fields = getSyncFields(syncType);
  return emailAccount[fields.syncIdField] === syncId;
}

export async function updateSyncExpiration(
  emailAccount: EmailAccount,
  syncId: string,
  syncType: SyncType,
): Promise<void> {
  await emailAccount.reload();

  const fields = getSyncFields(syncType);
  if (emailAccount[fields.syncIdField] === syncId) {
    await emailAccount.update({
      [fields.expiresAtField]: getSyncExpirationTime(),
    });
  }
}
