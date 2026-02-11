import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * Email cache store using Zustand
 * Provides centralized email caching with tab synchronization and offline support
 */

// Maximum number of emails to persist in localStorage
const MAX_CACHED_EMAILS = 200;

/** Tab lock structure in localStorage */
interface TabLock {
  tabId: string;
  timestamp: number;
}

function isTabLock(data: unknown): data is TabLock {
  return (
    typeof data === 'object' &&
    data !== null &&
    'tabId' in data &&
    'timestamp' in data &&
    typeof (data as TabLock).tabId === 'string' &&
    typeof (data as TabLock).timestamp === 'number'
  );
}

/**
 * Custom storage that handles quota exceeded errors gracefully
 */
const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (e) {
      console.warn('[EmailStore] Failed to read from localStorage:', e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      // Handle quota exceeded error
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
        console.warn('[EmailStore] localStorage quota exceeded, clearing email cache');
        // Try to clear the old data and retry
        try {
          localStorage.removeItem(name);
          // Parse the value and keep only essential data
          const parsed: unknown = JSON.parse(value);
          if (isPersistedState(parsed) && parsed.state?.emails && typeof parsed.state.emails === 'object') {
            // Keep only the most recent emails
            const emailEntries = Object.entries(parsed.state.emails)
              .filter((entry): entry is [string, CachedEmail] => isCachedEmail(entry[1]))
              .sort((a, b) => new Date(b[1].receivedAt).getTime() - new Date(a[1].receivedAt).getTime())
              .slice(0, MAX_CACHED_EMAILS / 2); // Keep even fewer on error
            parsed.state.emails = Object.fromEntries(emailEntries);
          }
          localStorage.setItem(name, JSON.stringify(parsed));
        } catch (retryError) {
          console.error('[EmailStore] Failed to recover from quota error:', retryError);
          // Last resort: clear the cache entirely
          try {
            localStorage.removeItem(name);
          } catch {
            // Ignore
          }
        }
      } else {
        console.error('[EmailStore] Failed to write to localStorage:', e);
      }
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch (e) {
      console.warn('[EmailStore] Failed to remove from localStorage:', e);
    }
  },
};

export interface CachedEmail {
  id: string;
  messageId: string;
  folder: string;
  fromAddress: string;
  fromName?: string | null;
  subject: string;
  textBody?: string | null;
  htmlBody?: string | null;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  emailAccountId: string;
  toAddresses: string[];
  ccAddresses?: string[] | null;
  bccAddresses?: string[] | null;
  inReplyTo?: string | null;
  threadId?: string | null;
  threadCount?: number | null;
  tags?: Array<{ id: string; name: string; color: string }> | null;
}

/** Parsed structure from zustand persist storage */
interface PersistedStateStructure {
  state?: {
    emails?: Record<string, unknown>;
  };
}

function isPersistedState(data: unknown): data is PersistedStateStructure {
  return typeof data === 'object' && data !== null;
}

function isCachedEmail(obj: unknown): obj is CachedEmail {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.emailAccountId === 'string' &&
    typeof o.receivedAt === 'string'
  );
}

export interface CachedEmailAccount {
  id: string;
  name?: string | null;
  email: string;
  host: string;
  providerId?: string | null;
}

export interface CachedUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  themePreference?: string;
  navbarCollapsed?: boolean;
  notificationDetailLevel?: string;
  inboxDensity?: boolean;
  inboxGroupByDate?: boolean;
  blockExternalImages?: boolean;
}

export interface SavedUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  lastLoginAt: string;
}

export interface MailboxUpdate {
  type:
    | 'NEW_EMAILS'
    | 'EMAIL_UPDATED'
    | 'EMAIL_DELETED'
    | 'SYNC_STARTED'
    | 'SYNC_COMPLETED'
    | 'CONNECTION_ESTABLISHED'
    | 'CONNECTION_CLOSED'
    | 'ERROR';
  emailAccountId: string;
  emails?: CachedEmail[];
  message?: string;
}

interface EmailStoreState {
  // Email cache by ID
  emails: Record<string, CachedEmail>;

  // Email accounts cache
  emailAccounts: CachedEmailAccount[];

  // Cached user data for offline access
  cachedUser: CachedUser | null;

  // Saved users for "Remember Me" feature
  savedUsers: SavedUser[];

  // Offline status
  isOnline: boolean;
  lastOnlineAt: string | null;

  // Subscription state
  isSubscriptionActive: boolean;
  subscriptionError: string | null;
  lastUpdate: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';

  // Tab locking - only one tab should maintain the subscription
  tabLockId: string | null;
  currentTabId: string;

  // Email actions
  setEmails: (emails: CachedEmail[]) => void;
  updateEmail: (email: CachedEmail) => void;
  removeEmail: (emailId: string) => void;
  clearEmailCache: () => void;

  // Email accounts actions
  setEmailAccounts: (accounts: CachedEmailAccount[]) => void;

  // User cache actions
  setCachedUser: (user: CachedUser | null) => void;

  // Saved users actions (Remember Me)
  addSavedUser: (user: SavedUser) => void;
  removeSavedUser: (userId: string) => void;
  clearSavedUsers: () => void;

  // Offline actions
  setOnline: (online: boolean) => void;

  // Subscription actions
  setSubscriptionActive: (active: boolean) => void;
  setSubscriptionError: (error: string | null) => void;
  setConnectionStatus: (
    status: 'disconnected' | 'connecting' | 'connected' | 'error',
  ) => void;
  handleMailboxUpdate: (update: MailboxUpdate) => void;

  // Tab locking actions
  acquireTabLock: () => boolean;
  releaseTabLock: () => void;
  isCurrentTabOwner: () => boolean;

  // Computed helpers
  hasCachedData: () => boolean;
  getEmailCount: () => number;
  pruneOldEmails: (maxToKeep?: number) => void;
}

// Generate a unique ID for this tab
const generateTabId = () =>
  `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Lock key for cross-tab synchronization
const TAB_LOCK_KEY = 'email_subscription_lock';
const TAB_LOCK_TIMEOUT = 10000; // 10 seconds - lock expires if not refreshed

export const useEmailStore = create<EmailStoreState>()(
  persist(
    (set, get) => ({
      emails: {},
      emailAccounts: [],
      cachedUser: null,
      savedUsers: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastOnlineAt: null,
      isSubscriptionActive: false,
      subscriptionError: null,
      lastUpdate: null,
      connectionStatus: 'disconnected',
      tabLockId: null,
      currentTabId: generateTabId(),

      setEmails: (emails) => {
        const emailMap: Record<string, CachedEmail> = {};
        for (const email of emails) {
          emailMap[email.id] = email;
        }
        set((state) => {
          const newEmails = { ...state.emails, ...emailMap };
          
          // If we have too many emails, prune the oldest ones
          const emailEntries = Object.entries(newEmails);
          if (emailEntries.length > MAX_CACHED_EMAILS * 1.5) {
            // Only prune if significantly over limit to avoid excessive operations
            const sortedEmails = emailEntries
              .sort((a, b) => new Date(b[1].receivedAt).getTime() - new Date(a[1].receivedAt).getTime())
              .slice(0, MAX_CACHED_EMAILS);
            console.log(`[EmailStore] Auto-pruned emails from ${emailEntries.length} to ${sortedEmails.length}`);
            return {
              emails: Object.fromEntries(sortedEmails),
              lastUpdate: new Date().toISOString(),
            };
          }
          
          return {
            emails: newEmails,
            lastUpdate: new Date().toISOString(),
          };
        });
      },

      updateEmail: (email) => {
        set((state) => ({
          emails: { ...state.emails, [email.id]: email },
          lastUpdate: new Date().toISOString(),
        }));
      },

      removeEmail: (emailId) => {
        set((state) => {
          const newEmails = { ...state.emails };
          delete newEmails[emailId];
          return { emails: newEmails, lastUpdate: new Date().toISOString() };
        });
      },

      clearEmailCache: () => {
        set({ emails: {}, emailAccounts: [], lastUpdate: null });
      },

      setEmailAccounts: (accounts) => {
        set({ emailAccounts: accounts });
      },

      setCachedUser: (user) => {
        set({ cachedUser: user });
      },

      addSavedUser: (user) => {
        set((state) => {
          // Remove existing entry for this user (to update lastLoginAt)
          const filtered = state.savedUsers.filter((u) => u.id !== user.id);
          // Add at the beginning (most recent first)
          return { savedUsers: [user, ...filtered].slice(0, 10) }; // Keep max 10 users
        });
      },

      removeSavedUser: (userId) => {
        set((state) => ({
          savedUsers: state.savedUsers.filter((u) => u.id !== userId),
        }));
      },

      clearSavedUsers: () => {
        set({ savedUsers: [] });
      },

      setOnline: (online) => {
        const state = get();
        set({
          isOnline: online,
          lastOnlineAt: online ? new Date().toISOString() : state.lastOnlineAt,
        });
      },

      setSubscriptionActive: (active) => {
        set({ isSubscriptionActive: active });
      },

      setSubscriptionError: (error) => {
        set({ subscriptionError: error });
      },

      setConnectionStatus: (status) => {
        set({ connectionStatus: status });
      },

      handleMailboxUpdate: (update) => {
        const state = get();

        switch (update.type) {
          case 'NEW_EMAILS':
            if (update.emails) {
              state.setEmails(update.emails);
            }
            break;

          case 'EMAIL_UPDATED':
            if (update.emails?.[0]) {
              state.updateEmail(update.emails[0]);
            }
            break;

          case 'EMAIL_DELETED':
            if (update.emails?.[0]) {
              state.removeEmail(update.emails[0].id);
            }
            break;

          case 'CONNECTION_ESTABLISHED':
            set({ connectionStatus: 'connected', subscriptionError: null, isOnline: true });
            break;

          case 'CONNECTION_CLOSED':
            set({ connectionStatus: 'disconnected' });
            break;

          case 'ERROR':
            set({
              connectionStatus: 'error',
              subscriptionError: update.message ?? 'Unknown error',
            });
            break;

          case 'SYNC_STARTED':
          case 'SYNC_COMPLETED':
            // These are informational updates
            break;
        }

        set({ lastUpdate: new Date().toISOString() });
      },

      acquireTabLock: () => {
        const state = get();
        const now = Date.now();

        // Check localStorage for existing lock
        try {
          const lockData = localStorage.getItem(TAB_LOCK_KEY);
          if (lockData) {
            const lock: unknown = JSON.parse(lockData);
            if (isTabLock(lock) && lock.tabId !== state.currentTabId && now - lock.timestamp < TAB_LOCK_TIMEOUT) {
              return false;
            }
          }

          // Acquire the lock
          localStorage.setItem(
            TAB_LOCK_KEY,
            JSON.stringify({
              tabId: state.currentTabId,
              timestamp: now,
            }),
          );
          set({ tabLockId: state.currentTabId });
          return true;
        } catch {
          // If localStorage fails, assume we have the lock
          return true;
        }
      },

      releaseTabLock: () => {
        const state = get();
        try {
          const lockData = localStorage.getItem(TAB_LOCK_KEY);
          if (lockData) {
            const lock: unknown = JSON.parse(lockData);
            if (isTabLock(lock) && lock.tabId === state.currentTabId) {
              localStorage.removeItem(TAB_LOCK_KEY);
            }
          }
        } catch {
          // Ignore errors
        }
        set({ tabLockId: null });
      },

      isCurrentTabOwner: () => {
        const state = get();
        try {
          const lockData = localStorage.getItem(TAB_LOCK_KEY);
          if (lockData) {
            const lock: unknown = JSON.parse(lockData);
            return isTabLock(lock) && lock.tabId === state.currentTabId;
          }
        } catch {
          // Ignore errors
        }
        return false;
      },

      hasCachedData: () => {
        const state = get();
        return Object.keys(state.emails).length > 0;
      },

      // Get the current email count (useful for debugging)
      getEmailCount: () => {
        const state = get();
        return Object.keys(state.emails).length;
      },

      // Prune old emails to stay within limits
      pruneOldEmails: (maxToKeep: number = MAX_CACHED_EMAILS) => {
        const state = get();
        const emailEntries = Object.entries(state.emails);
        
        if (emailEntries.length <= maxToKeep) return;

        const sortedEmails = emailEntries
          .sort((a, b) => new Date(b[1].receivedAt).getTime() - new Date(a[1].receivedAt).getTime())
          .slice(0, maxToKeep);

        set({
          emails: Object.fromEntries(sortedEmails),
          lastUpdate: new Date().toISOString(),
        });
        
        console.log(`[EmailStore] Pruned emails from ${emailEntries.length} to ${sortedEmails.length}`);
      },
    }),
    {
      name: 'email-cache-storage',
      storage: createJSONStorage(() => safeLocalStorage),
      // Persist emails, accounts, user cache, saved users, and offline timestamp
      // Limit emails to avoid quota issues
      partialize: (state) => {
        // Only persist the most recent emails, and strip out large body content
        const emailEntries = Object.entries(state.emails);
        const limitedEmails = emailEntries
          .sort((a, b) => new Date(b[1].receivedAt).getTime() - new Date(a[1].receivedAt).getTime())
          .slice(0, MAX_CACHED_EMAILS)
          .map(([id, email]): [string, CachedEmail] => [
            id,
            {
              ...email,
              // Don't persist full body content - it will be fetched when needed
              textBody: email.textBody ? email.textBody.slice(0, 500) : null,
              htmlBody: null, // Never persist HTML - too large
            },
          ]);

        return {
          emails: Object.fromEntries(limitedEmails),
          emailAccounts: state.emailAccounts,
          cachedUser: state.cachedUser,
          savedUsers: state.savedUsers,
          lastUpdate: state.lastUpdate,
          lastOnlineAt: state.lastOnlineAt,
        };
      },
    },
  ),
);

// Set up browser event listeners
if (typeof window !== 'undefined') {
  // Refresh lock periodically if we own it
  setInterval(() => {
    const state = useEmailStore.getState();
    if (state.isCurrentTabOwner()) {
      localStorage.setItem(
        TAB_LOCK_KEY,
        JSON.stringify({
          tabId: state.currentTabId,
          timestamp: Date.now(),
        }),
      );
    }
  }, TAB_LOCK_TIMEOUT / 2);

  // Release lock when tab closes
  window.addEventListener('beforeunload', () => {
    useEmailStore.getState().releaseTabLock();
  });

  // Listen for storage events from other tabs
  window.addEventListener('storage', (event) => {
    if (event.key === TAB_LOCK_KEY) {
      // Lock changed in another tab - recheck our status
      const state = useEmailStore.getState();
      if (state.isSubscriptionActive && !state.isCurrentTabOwner()) {
        // We lost the lock, stop our subscription
        state.setSubscriptionActive(false);
        state.setConnectionStatus('disconnected');
      }
    }
  });

  // Online/offline event listeners
  window.addEventListener('online', () => {
    useEmailStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useEmailStore.getState().setOnline(false);
  });

  // Initialize with current online status
  useEmailStore.getState().setOnline(navigator.onLine);
}
