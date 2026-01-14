import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Email cache store using Zustand
 * Provides centralized email caching with tab synchronization
 */

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

  // Subscription state
  isSubscriptionActive: boolean;
  subscriptionError: string | null;
  lastUpdate: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';

  // Tab locking - only one tab should maintain the subscription
  tabLockId: string | null;
  currentTabId: string;

  // Actions
  setEmails: (emails: CachedEmail[]) => void;
  updateEmail: (email: CachedEmail) => void;
  removeEmail: (emailId: string) => void;
  clearCache: () => void;

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
        set((state) => ({
          emails: { ...state.emails, ...emailMap },
          lastUpdate: new Date().toISOString(),
        }));
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

      clearCache: () => {
        set({ emails: {}, lastUpdate: null });
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
            set({ connectionStatus: 'connected', subscriptionError: null });
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
            const lock = JSON.parse(lockData);
            // If lock exists and hasn't expired, and it's not ours, return false
            if (
              lock.tabId !== state.currentTabId &&
              now - lock.timestamp < TAB_LOCK_TIMEOUT
            ) {
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
        } catch (e) {
          // If localStorage fails, assume we have the lock
          return true;
        }
      },

      releaseTabLock: () => {
        const state = get();
        try {
          const lockData = localStorage.getItem(TAB_LOCK_KEY);
          if (lockData) {
            const lock = JSON.parse(lockData);
            if (lock.tabId === state.currentTabId) {
              localStorage.removeItem(TAB_LOCK_KEY);
            }
          }
        } catch (e) {
          // Ignore errors
        }
        set({ tabLockId: null });
      },

      isCurrentTabOwner: () => {
        const state = get();
        try {
          const lockData = localStorage.getItem(TAB_LOCK_KEY);
          if (lockData) {
            const lock = JSON.parse(lockData);
            return lock.tabId === state.currentTabId;
          }
        } catch (e) {
          // Ignore errors
        }
        return false;
      },
    }),
    {
      name: 'email-cache-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist emails, not subscription state
      partialize: (state) => ({
        emails: state.emails,
        lastUpdate: state.lastUpdate,
      }),
    },
  ),
);

// Refresh lock periodically if we own it
if (typeof window !== 'undefined') {
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
}
