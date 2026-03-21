/**
 * Email Cache Service
 *
 * Generic EncryptedCache<T> class that handles encryption, TTL expiry,
 * LRU eviction, and total size cap. Domain-specific cache instances are
 * created as thin configuration wrappers.
 */

import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encrypt, decrypt, isEncryptionReady } from './encryption';

// ---------------------------------------------------------------------------
// Cache prefix enum — all cache key prefixes must be declared here
// ---------------------------------------------------------------------------

export enum CachePrefix {
  Inbox = '@cache/inbox',
  Folder = '@cache/folder',
  Viewed = '@cache/viewed',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheOptions {
  prefix: CachePrefix;
  ttlMs: number;
  maxEntries?: number;
  maxTotalBytes?: number;
}

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
}

interface LRUIndexEntry {
  key: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// EncryptedCache<T>
// ---------------------------------------------------------------------------

export class EncryptedCache<T> {
  private readonly prefix: CachePrefix;
  private readonly ttlMs: number;
  private readonly maxEntries?: number;
  private readonly maxTotalBytes?: number;

  constructor(options: CacheOptions) {
    this.prefix = options.prefix;
    this.ttlMs = options.ttlMs;
    this.maxEntries = options.maxEntries;
    this.maxTotalBytes = options.maxTotalBytes;
  }

  private storageKey(key: string): string {
    return `${this.prefix}/${key}`;
  }

  private get indexKey(): string {
    return `${this.prefix}/_index`;
  }

  // -- Low-level read/write with encryption --------------------------------

  private async rawSet(fullKey: string, value: string): Promise<void> {
    const stored = isEncryptionReady() ? encrypt(value) : value;
    await AsyncStorage.setItem(fullKey, stored);
  }

  private async rawGet(fullKey: string): Promise<string | null> {
    const stored = await AsyncStorage.getItem(fullKey);
    if (!stored) return null;
    if (!isEncryptionReady()) return stored;
    try {
      return decrypt(stored);
    } catch {
      await AsyncStorage.removeItem(fullKey);
      return null;
    }
  }

  private async rawDelete(fullKey: string): Promise<void> {
    await AsyncStorage.removeItem(fullKey);
  }

  // -- Index management (for caches with maxEntries) -----------------------

  private async getIndex(): Promise<LRUIndexEntry[]> {
    const raw = await this.rawGet(this.indexKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as LRUIndexEntry[];
    } catch {
      return [];
    }
  }

  private async setIndex(index: LRUIndexEntry[]): Promise<void> {
    await this.rawSet(this.indexKey, JSON.stringify(index));
  }

  // -- Public API ----------------------------------------------------------

  async get(key: string): Promise<T | null> {
    try {
      const raw = await this.rawGet(this.storageKey(key));
      if (!raw) return null;

      const envelope = JSON.parse(raw) as CacheEnvelope<T>;
      if (Date.now() - envelope.timestamp > this.ttlMs) {
        await this.delete(key);
        return null;
      }
      return envelope.data;
    } catch (error) {
      console.error(`[EncryptedCache] get(${this.prefix}/${key}) failed:`, error);
      return null;
    }
  }

  async set(key: string, value: T): Promise<void> {
    try {
      const envelope: CacheEnvelope<T> = {
        data: value,
        timestamp: Date.now(),
      };
      await this.rawSet(this.storageKey(key), JSON.stringify(envelope));

      if (this.maxEntries != null) {
        await this.updateIndex(key);
      }
    } catch (error) {
      console.error(`[EncryptedCache] set(${this.prefix}/${key}) failed:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    await this.rawDelete(this.storageKey(key));
    if (this.maxEntries != null) {
      const index = await this.getIndex();
      const updated = index.filter(e => e.key !== key);
      if (updated.length !== index.length) {
        await this.setIndex(updated);
      }
    }
  }

  async clear(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const ownKeys = allKeys.filter(k => k.startsWith(this.prefix + '/'));
      if (ownKeys.length > 0) {
        await AsyncStorage.multiRemove(ownKeys);
      }
    } catch (error) {
      console.error(`[EncryptedCache] clear(${this.prefix}) failed:`, error);
    }
  }

  async sweep(): Promise<void> {
    try {
      if (this.maxEntries != null) {
        await this.sweepIndexed();
      } else {
        await this.sweepSingle();
      }
    } catch (error) {
      console.error(`[EncryptedCache] sweep(${this.prefix}) failed:`, error);
    }
  }

  async estimateSize(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const ownKeys = allKeys.filter(k => k.startsWith(this.prefix + '/'));
      if (ownKeys.length === 0) return 0;

      const pairs = await AsyncStorage.multiGet(ownKeys);
      return pairs.reduce((sum, [, val]) => sum + (val?.length ?? 0), 0);
    } catch {
      return 0;
    }
  }

  // -- Private helpers -----------------------------------------------------

  private async updateIndex(key: string): Promise<void> {
    let index = await this.getIndex();

    // Move key to front (most recently used)
    index = index.filter(e => e.key !== key);
    index.unshift({ key, timestamp: Date.now() });

    // Evict oldest entries beyond maxEntries
    if (this.maxEntries != null && index.length > this.maxEntries) {
      const evicted = index.splice(this.maxEntries);
      await Promise.all(evicted.map(e => this.rawDelete(this.storageKey(e.key))));
    }

    await this.setIndex(index);
  }

  private async sweepIndexed(): Promise<void> {
    let index = await this.getIndex();
    const now = Date.now();

    // Remove TTL-expired entries
    const expired = index.filter(e => now - e.timestamp > this.ttlMs);
    if (expired.length > 0) {
      await Promise.all(expired.map(e => this.rawDelete(this.storageKey(e.key))));
      index = index.filter(e => now - e.timestamp <= this.ttlMs);
    }

    // Size-cap eviction
    if (this.maxTotalBytes != null) {
      let totalSize = await this.estimateSize();
      while (totalSize > this.maxTotalBytes && index.length > 0) {
        const oldest = index.pop()!;
        const fullKey = this.storageKey(oldest.key);
        const val = await AsyncStorage.getItem(fullKey);
        const entrySize = val?.length ?? 0;
        await this.rawDelete(fullKey);
        totalSize -= entrySize;
      }
    }

    await this.setIndex(index);
  }

  private async sweepSingle(): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys();
    const ownKeys = allKeys.filter(
      k => k.startsWith(this.prefix + '/') && !k.endsWith('/_index'),
    );

    const now = Date.now();
    for (const fullKey of ownKeys) {
      const raw = await this.rawGet(fullKey);
      if (!raw) continue;
      try {
        const envelope = JSON.parse(raw) as CacheEnvelope<unknown>;
        if (now - envelope.timestamp > this.ttlMs) {
          await this.rawDelete(fullKey);
        }
      } catch {
        await this.rawDelete(fullKey);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Domain-specific cache data types
// ---------------------------------------------------------------------------

export interface InboxCacheData {
  emails: Array<{
    id: string;
    emailAccountId: string;
    messageId: string;
    folder: string;
    fromAddress: string;
    fromName?: string | null;
    toAddresses: string[];
    ccAddresses?: string[] | null;
    subject: string;
    receivedAt: string;
    isRead: boolean;
    isStarred: boolean;
    isDraft: boolean;
    hasAttachments: boolean;
    attachmentCount: number;
    threadId?: string | null;
    threadCount?: number | null;
    tags: Array<{ id: string; name: string; color: string }>;
  }>;
  totalCount: number;
  accountId: string | null;
}

export interface FolderCacheData {
  folder: string;
  accountId: string | null;
  emails: InboxCacheData['emails'];
  totalCount: number;
}

export interface ViewedEmailData {
  id: string;
  emailAccountId: string;
  messageId: string;
  folder: string;
  fromAddress: string;
  fromName?: string | null;
  toAddresses: string[];
  ccAddresses?: string[] | null;
  subject: string;
  textBody?: string | null;
  htmlBody?: string | null;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachmentCount: number;
  threadId?: string | null;
  threadCount?: number | null;
  isUnsubscribed?: boolean;
  unsubscribeUrl?: string | null;
  unsubscribeEmail?: string | null;
  tags: Array<{ id: string; name: string; color: string }>;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

// ---------------------------------------------------------------------------
// Cache instances
// ---------------------------------------------------------------------------

export const inboxPageCache = new EncryptedCache<InboxCacheData>({
  prefix: CachePrefix.Inbox,
  ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const folderCache = new EncryptedCache<FolderCacheData>({
  prefix: CachePrefix.Folder,
  ttlMs: 4 * 60 * 60 * 1000, // 4 hours
});

export const viewedEmailCache = new EncryptedCache<ViewedEmailData>({
  prefix: CachePrefix.Viewed,
  ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxEntries: 50,
  maxTotalBytes: 40 * 1024 * 1024, // 40 MB
});

// ---------------------------------------------------------------------------
// Periodic sweep
// ---------------------------------------------------------------------------

const ALL_CACHES = [inboxPageCache, folderCache, viewedEmailCache];

export async function sweepAllCaches(): Promise<void> {
  await Promise.all(ALL_CACHES.map(c => c.sweep()));
}

export async function clearAllCaches(): Promise<void> {
  await Promise.all(ALL_CACHES.map(c => c.clear()));
}

let lastSweepTime = 0;
const SWEEP_THROTTLE_MS = 60 * 60 * 1000; // 1 hour

function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState === 'active' && Date.now() - lastSweepTime > SWEEP_THROTTLE_MS) {
    lastSweepTime = Date.now();
    sweepAllCaches().catch(err =>
      console.error('[EmailCache] Periodic sweep failed:', err),
    );
  }
}

let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

export function startCacheSweepListener(): void {
  if (appStateSubscription) return;
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
}

export function stopCacheSweepListener(): void {
  appStateSubscription?.remove();
  appStateSubscription = null;
}
