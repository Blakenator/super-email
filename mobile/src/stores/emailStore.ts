/**
 * Email Store
 * Manages email state with offline caching support
 */

import { create } from 'zustand';
import { apolloClient } from '../services/apollo';
import { gql } from '@apollo/client';
import { 
  cacheSetObject, 
  cacheGetObject, 
  secureSet,
  secureGet,
  STORAGE_KEYS,
  CACHE_KEYS,
} from '../services/secureStorage';

// GraphQL queries
const GET_EMAILS_QUERY = gql`
  query GetEmails($input: GetEmailsInput!) {
    getEmails(input: $input) {
      id
      emailAccountId
      messageId
      folder
      fromAddress
      fromName
      toAddresses
      ccAddresses
      subject
      textBody
      htmlBody
      receivedAt
      isRead
      isStarred
      isDraft
      hasAttachments
      attachmentCount
      tags {
        id
        name
        color
      }
    }
  }
`;

const GET_EMAIL_COUNT_QUERY = gql`
  query GetEmailCount($input: GetEmailsInput!) {
    getEmailCount(input: $input)
  }
`;

const GET_EMAIL_ACCOUNTS_QUERY = gql`
  query GetEmailAccounts {
    getEmailAccounts {
      id
      name
      email
      host
      accountType
      lastSyncedAt
      isSyncing
      syncProgress
      syncStatus
      isDefault
    }
  }
`;

const BULK_UPDATE_EMAILS_MUTATION = gql`
  mutation BulkUpdateEmails($input: BulkUpdateEmailsInput!) {
    bulkUpdateEmails(input: $input) {
      id
      isRead
      isStarred
      folder
    }
  }
`;

const SYNC_ALL_ACCOUNTS_MUTATION = gql`
  mutation SyncAllAccounts {
    syncAllAccounts
  }
`;

export type EmailFolder = 'INBOX' | 'SENT' | 'DRAFTS' | 'TRASH' | 'SPAM' | 'ARCHIVE';

export interface Email {
  id: string;
  emailAccountId: string;
  messageId: string;
  folder: EmailFolder;
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
  isDraft: boolean;
  hasAttachments: boolean;
  attachmentCount: number;
  tags: Array<{ id: string; name: string; color: string }>;
}

export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  host: string;
  accountType: string;
  lastSyncedAt?: string | null;
  isSyncing: boolean;
  syncProgress?: number | null;
  syncStatus?: string | null;
  isDefault: boolean;
}

interface EmailState {
  emails: Email[];
  emailAccounts: EmailAccount[];
  currentFolder: EmailFolder;
  currentAccountId: string | null;
  totalCount: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  isSyncing: boolean;
  searchQuery: string;
  filterIsRead: boolean | null;
  filterIsStarred: boolean | null;
  filterHasAttachments: boolean | null;
  selectedIds: Set<string>;
  lastSyncTime: string | null;
  
  // Actions
  setFolder: (folder: EmailFolder) => void;
  setAccountId: (accountId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  setFilters: (isRead: boolean | null, isStarred: boolean | null, hasAttachments?: boolean | null) => void;
  fetchEmails: () => Promise<void>;
  fetchEmailAccounts: () => Promise<void>;
  refreshEmails: () => Promise<void>;
  syncAllAccounts: () => Promise<void>;
  markAsRead: (ids: string[], isRead: boolean) => Promise<void>;
  markAsStarred: (ids: string[], isStarred: boolean) => Promise<void>;
  moveToFolder: (ids: string[], folder: EmailFolder) => Promise<void>;
  deleteEmails: (ids: string[]) => Promise<void>;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  loadCachedData: () => Promise<void>;
}

export const useEmailStore = create<EmailState>((set, get) => ({
  emails: [],
  emailAccounts: [],
  currentFolder: 'INBOX',
  currentAccountId: null,
  totalCount: 0,
  page: 1,
  pageSize: 25,
  isLoading: false,
  isSyncing: false,
  searchQuery: '',
  filterIsRead: null,
  filterIsStarred: null,
  filterHasAttachments: null,
  selectedIds: new Set(),
  lastSyncTime: null,
  
  setFolder: (folder) => {
    set({ currentFolder: folder, page: 1, selectedIds: new Set() });
    get().fetchEmails();
  },
  
  setAccountId: (accountId) => {
    set({ currentAccountId: accountId, page: 1, selectedIds: new Set() });
    get().fetchEmails();
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query, page: 1 });
    get().fetchEmails();
  },
  
  setPage: (page) => {
    set({ page });
    get().fetchEmails();
  },

  setFilters: (isRead, isStarred, hasAttachments) => {
    set({ 
      filterIsRead: isRead, 
      filterIsStarred: isStarred, 
      filterHasAttachments: hasAttachments ?? get().filterHasAttachments,
      page: 1 
    });
    get().fetchEmails();
  },
  
  fetchEmails: async () => {
    const { currentFolder, currentAccountId, page, pageSize, searchQuery, filterIsRead, filterIsStarred, filterHasAttachments } = get();
    
    set({ isLoading: true });
    
    try {
      const { data } = await apolloClient.query({
        query: GET_EMAILS_QUERY,
        variables: {
          input: {
            folder: currentFolder,
            emailAccountId: currentAccountId,
            limit: pageSize,
            offset: (page - 1) * pageSize,
            searchQuery: searchQuery || undefined,
            isRead: filterIsRead,
            isStarred: filterIsStarred,
            hasAttachments: filterHasAttachments,
          },
        },
        fetchPolicy: 'network-only',
      });
      
      const { data: countData } = await apolloClient.query({
        query: GET_EMAIL_COUNT_QUERY,
        variables: {
          input: {
            folder: currentFolder,
            emailAccountId: currentAccountId,
            searchQuery: searchQuery || undefined,
            isRead: filterIsRead,
            isStarred: filterIsStarred,
            hasAttachments: filterHasAttachments,
          },
        },
        fetchPolicy: 'network-only',
      });
      
      const emails = data?.getEmails ?? [];
      const totalCount = countData?.getEmailCount ?? 0;
      
      set({ emails, totalCount });
      
      // Cache emails for offline mode (using AsyncStorage for larger data)
      // Strip body content to reduce cache size - bodies can be fetched when viewing
      const emailsForCache = emails.map((email: Email) => ({
        ...email,
        textBody: null,
        htmlBody: null,
      }));
      
      try {
        await cacheSetObject(CACHE_KEYS.CACHED_EMAILS, {
          folder: currentFolder,
          accountId: currentAccountId,
          emails: emailsForCache,
          totalCount,
          timestamp: new Date().toISOString(),
        });
      } catch (cacheError) {
        console.warn('Failed to cache emails:', cacheError);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      
      // Try to load from cache
      await get().loadCachedData();
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchEmailAccounts: async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_EMAIL_ACCOUNTS_QUERY,
        fetchPolicy: 'network-only',
      });
      
      const emailAccounts = data?.getEmailAccounts ?? [];
      set({ emailAccounts });
    } catch (error) {
      console.error('Error fetching email accounts:', error);
    }
  },
  
  refreshEmails: async () => {
    set({ page: 1, selectedIds: new Set() });
    await get().fetchEmails();
  },
  
  syncAllAccounts: async () => {
    set({ isSyncing: true });
    
    try {
      await apolloClient.mutate({
        mutation: SYNC_ALL_ACCOUNTS_MUTATION,
      });
      
      // Update last sync time
      const syncTime = new Date().toISOString();
      await secureSet(STORAGE_KEYS.LAST_SYNC_TIME, syncTime);
      set({ lastSyncTime: syncTime });
      
      // Refresh emails after sync
      await get().fetchEmails();
      await get().fetchEmailAccounts();
    } catch (error) {
      console.error('Error syncing accounts:', error);
    } finally {
      set({ isSyncing: false });
    }
  },
  
  markAsRead: async (ids, isRead) => {
    try {
      await apolloClient.mutate({
        mutation: BULK_UPDATE_EMAILS_MUTATION,
        variables: {
          input: { ids, isRead },
        },
      });
      
      // Optimistic update
      set((state) => ({
        emails: state.emails.map((email) =>
          ids.includes(email.id) ? { ...email, isRead } : email
        ),
        selectedIds: new Set(),
      }));
    } catch (error) {
      console.error('Error marking emails as read:', error);
    }
  },
  
  markAsStarred: async (ids, isStarred) => {
    try {
      await apolloClient.mutate({
        mutation: BULK_UPDATE_EMAILS_MUTATION,
        variables: {
          input: { ids, isStarred },
        },
      });
      
      // Optimistic update
      set((state) => ({
        emails: state.emails.map((email) =>
          ids.includes(email.id) ? { ...email, isStarred } : email
        ),
        selectedIds: new Set(),
      }));
    } catch (error) {
      console.error('Error starring emails:', error);
    }
  },
  
  moveToFolder: async (ids, folder) => {
    try {
      await apolloClient.mutate({
        mutation: BULK_UPDATE_EMAILS_MUTATION,
        variables: {
          input: { ids, folder },
        },
      });
      
      // Remove from current view
      set((state) => ({
        emails: state.emails.filter((email) => !ids.includes(email.id)),
        totalCount: state.totalCount - ids.length,
        selectedIds: new Set(),
      }));
    } catch (error) {
      console.error('Error moving emails:', error);
    }
  },
  
  deleteEmails: async (ids) => {
    await get().moveToFolder(ids, 'TRASH');
  },
  
  toggleSelection: (id) => {
    set((state) => {
      const newSet = new Set(state.selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedIds: newSet };
    });
  },
  
  selectAll: () => {
    const { emails } = get();
    set({ selectedIds: new Set(emails.map((e) => e.id)) });
  },
  
  clearSelection: () => {
    set({ selectedIds: new Set() });
  },
  
  loadCachedData: async () => {
    const { currentFolder, currentAccountId } = get();
    
    const cached = await cacheGetObject<{
      folder: EmailFolder;
      accountId: string | null;
      emails: Email[];
      totalCount: number;
      timestamp: string;
    }>(CACHE_KEYS.CACHED_EMAILS);
    
    if (
      cached &&
      cached.folder === currentFolder &&
      cached.accountId === currentAccountId
    ) {
      set({
        emails: cached.emails,
        totalCount: cached.totalCount,
        lastSyncTime: cached.timestamp,
      });
    }
    
    const lastSyncTime = await secureGet(STORAGE_KEYS.LAST_SYNC_TIME);
    if (lastSyncTime) {
      set({ lastSyncTime });
    }
  },
}));
