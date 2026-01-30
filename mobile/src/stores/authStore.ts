/**
 * Authentication Store
 * Manages auth state with Zustand and secure storage
 */

import { create } from 'zustand';
import { AppState, AppStateStatus } from 'react-native';
import {
  secureSet,
  secureGet,
  secureSetObject,
  secureGetObject,
  clearSecureStorage,
  STORAGE_KEYS,
} from '../services/secureStorage';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  getSession,
  refreshSession,
} from '../services/supabase';
import { apolloClient, clearApolloCache, authErrorEmitter, stopMailboxSubscription } from '../services/apollo';
import { useEmailStore } from './emailStore';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  authenticateWithBiometrics,
  getBiometricType,
  BiometricType,
} from '../services/biometricAuth';
import { registerForPushNotifications, registerPushTokenWithBackend } from '../services/notifications';
import { gql } from '@apollo/client';

// GraphQL queries/mutations
const FETCH_PROFILE_QUERY = gql`
  query FetchProfile {
    fetchProfile {
      id
      email
      firstName
      lastName
      themePreference
      navbarCollapsed
      notificationDetailLevel
      inboxDensity
      inboxGroupByDate
      blockExternalImages
    }
  }
`;

const UPDATE_USER_PREFERENCES_MUTATION = gql`
  mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
    updateUserPreferences(input: $input) {
      id
      themePreference
      blockExternalImages
    }
  }
`;

export type ThemePreference = 'LIGHT' | 'DARK' | 'AUTO';
export type NotificationDetailLevel = 'MINIMAL' | 'FULL';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  themePreference: ThemePreference;
  navbarCollapsed: boolean;
  notificationDetailLevel: NotificationDetailLevel;
  inboxDensity: boolean;
  inboxGroupByDate: boolean;
  blockExternalImages: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricType: BiometricType;
  isOffline: boolean;
  shouldPromptBiometric: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithBiometric: () => Promise<boolean>;
  promptBiometricLogin: () => Promise<boolean>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTokenIfNeeded: () => Promise<boolean>;
  setBiometric: (enabled: boolean) => Promise<void>;
  setThemePreference: (theme: ThemePreference) => Promise<void>;
  setInboxGroupByDate: (enabled: boolean) => Promise<void>;
  setBlockExternalImages: (enabled: boolean) => Promise<void>;
  setOffline: (offline: boolean) => void;
  clearBiometricPrompt: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  biometricAvailable: false,
  biometricEnabled: false,
  biometricType: 'none',
  isOffline: false,
  shouldPromptBiometric: false,

  initialize: async () => {
    console.log('[AuthStore] Starting initialization...');
    try {
      set({ isLoading: true });

      // Check biometric availability
      console.log('[AuthStore] Checking biometric availability...');
      let biometricAvailable = false;
      let biometricEnabled = false;
      let biometricType: BiometricType = 'none';

      try {
        biometricAvailable = await isBiometricAvailable();
        biometricEnabled = await isBiometricEnabled();
        biometricType = await getBiometricType();
        console.log('[AuthStore] Biometric check done:', { biometricAvailable, biometricEnabled, biometricType });
      } catch (e) {
        console.log('[AuthStore] Biometric check failed:', e);
      }

      set({ biometricAvailable, biometricEnabled, biometricType });

      // Check for existing session
      console.log('[AuthStore] Checking for existing session...');
      let session = null;
      try {
        session = await getSession();
        console.log('[AuthStore] Session check done, hasSession:', !!session);
      } catch (e) {
        console.log('[AuthStore] Session check failed:', e);
      }

      // Check if "remember me" was enabled
      const rememberMe = await secureGet(STORAGE_KEYS.REMEMBER_ME);
      const hasRememberedSession = rememberMe === 'true';

      if (session?.access_token) {
        console.log('[AuthStore] Found valid session, setting token...');
        await secureSet(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
        set({ token: session.access_token });

        // Fetch user profile
        console.log('[AuthStore] Fetching user profile...');
        try {
          await get().refreshProfile();
          console.log('[AuthStore] Profile fetched successfully');
        } catch (e) {
          console.log('[AuthStore] Profile fetch failed:', e);
        }

        // Register for push notifications (non-blocking)
        console.log('[AuthStore] Registering for push notifications...');
        registerForPushNotifications()
          .then(async (pushToken) => {
            if (pushToken) {
              console.log('[AuthStore] Obtained push token, registering with backend...');
              const success = await registerPushTokenWithBackend(pushToken.token, session.access_token);
              if (success) {
                console.log('[AuthStore] Push token registered successfully');
              } else {
                console.warn('[AuthStore] Push token registration returned false');
              }
            } else {
              console.log('[AuthStore] No push token obtained (push notifications may be disabled)');
            }
          })
          .catch((e) => console.error('[AuthStore] Push registration failed:', e));
        
        // Start mailbox subscription for real-time updates
        console.log('[AuthStore] Starting mailbox subscription...');
        useEmailStore.getState().startSubscription();
      } else if (hasRememberedSession && biometricEnabled && biometricAvailable) {
        // User was remembered and biometric is enabled - prompt for biometric login
        console.log('[AuthStore] User remembered with biometric enabled, will prompt...');
        set({ shouldPromptBiometric: true });

        // Load cached user for offline display while prompting
        try {
          const cachedUser = await secureGetObject<User>(STORAGE_KEYS.USER_DATA);
          if (cachedUser) {
            set({ user: cachedUser, isOffline: true });
          }
        } catch (e) {
          console.log('[AuthStore] Cache check failed:', e);
        }
      } else {
        console.log('[AuthStore] No session, checking for cached user data...');
        // Check for cached user data for offline mode
        try {
          const cachedUser = await secureGetObject<User>(STORAGE_KEYS.USER_DATA);
          if (cachedUser) {
            console.log('[AuthStore] Found cached user data');
            set({ user: cachedUser, isOffline: true });
          } else {
            console.log('[AuthStore] No cached user data found');
          }
        } catch (e) {
          console.log('[AuthStore] Cache check failed:', e);
        }
      }
      console.log('[AuthStore] Initialization complete');
    } catch (error) {
      console.error('[AuthStore] Initialization error:', error);
    } finally {
      set({ isLoading: false });
      console.log('[AuthStore] isLoading set to false');
    }
  },

  login: async (email, password, rememberMe = false) => {
    set({ isLoading: true });

    try {
      const { session } = await signInWithEmail(email, password);

      if (!session?.access_token) {
        throw new Error('Login failed - no session returned');
      }

      await secureSet(STORAGE_KEYS.AUTH_TOKEN, session.access_token);

      if (rememberMe) {
        await secureSet(STORAGE_KEYS.REMEMBER_ME, 'true');
        await secureSet(STORAGE_KEYS.SAVED_EMAIL, email);
      } else {
        await secureSet(STORAGE_KEYS.REMEMBER_ME, 'false');
      }

      set({ token: session.access_token });

      // Fetch profile
      await get().refreshProfile();

      // Register for push notifications
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await registerPushTokenWithBackend(pushToken.token, session.access_token);
      }

      set({ isAuthenticated: true, isOffline: false, shouldPromptBiometric: false });
      
      // Start mailbox subscription for real-time updates
      useEmailStore.getState().startSubscription();
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithBiometric: async () => {
    const { biometricEnabled, biometricAvailable } = get();

    if (!biometricAvailable || !biometricEnabled) {
      return false;
    }

    const authResult = await authenticateWithBiometrics();

    if (!authResult.success) {
      return false;
    }

    // Check for existing valid session
    try {
      const session = await getSession();

      if (session?.access_token) {
        await secureSet(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
        set({ token: session.access_token, isAuthenticated: true, shouldPromptBiometric: false });
        await get().refreshProfile();
        
        // Start mailbox subscription for real-time updates
        useEmailStore.getState().startSubscription();
        return true;
      }
    } catch (error) {
      console.error('Biometric login session check failed:', error);
    }

    return false;
  },

  promptBiometricLogin: async () => {
    // This is called on app start when biometric is enabled and user is remembered
    const success = await get().loginWithBiometric();
    set({ shouldPromptBiometric: false });
    return success;
  },

  signup: async (email, password, firstName, lastName) => {
    set({ isLoading: true });

    try {
      const { session } = await signUpWithEmail(email, password, { firstName, lastName });

      if (!session?.access_token) {
        throw new Error('Signup failed - please check your email for verification');
      }

      await secureSet(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
      set({ token: session.access_token });

      // Fetch profile
      await get().refreshProfile();

      set({ isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      // Stop mailbox subscription
      useEmailStore.getState().stopSubscription();
      stopMailboxSubscription();
      
      await supabaseSignOut();
      await clearSecureStorage();
      await clearApolloCache();

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        shouldPromptBiometric: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshProfile: async () => {
    const { token } = get();

    if (!token) return;

    try {
      const { data } = await apolloClient.query({
        query: FETCH_PROFILE_QUERY,
        fetchPolicy: 'network-only',
        context: {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      });

      if (data?.fetchProfile) {
        const user: User = {
          id: data.fetchProfile.id,
          email: data.fetchProfile.email,
          firstName: data.fetchProfile.firstName,
          lastName: data.fetchProfile.lastName,
          themePreference: data.fetchProfile.themePreference || 'AUTO',
          navbarCollapsed: data.fetchProfile.navbarCollapsed ?? false,
          notificationDetailLevel: data.fetchProfile.notificationDetailLevel || 'FULL',
          inboxDensity: data.fetchProfile.inboxDensity ?? false,
          inboxGroupByDate: data.fetchProfile.inboxGroupByDate ?? false,
          blockExternalImages: data.fetchProfile.blockExternalImages ?? false,
        };

        // Cache user data for offline mode
        await secureSetObject(STORAGE_KEYS.USER_DATA, user);

        set({ user, isAuthenticated: true, isOffline: false });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);

      // Try to use cached data
      const cachedUser = await secureGetObject<User>(STORAGE_KEYS.USER_DATA);
      if (cachedUser) {
        set({ user: cachedUser, isOffline: true });
      }
    }
  },

  refreshTokenIfNeeded: async () => {
    try {
      console.log('[AuthStore] Proactively refreshing session...');
      const session = await refreshSession();
      
      if (session?.access_token) {
        await secureSet(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
        set({ token: session.access_token, isOffline: false });
        console.log('[AuthStore] Session refreshed proactively');
        return true;
      }
    } catch (error) {
      console.log('[AuthStore] Proactive session refresh failed:', error);
      
      // If biometric is enabled, we can try that when the actual auth error occurs
      // For now, just mark as potentially needing re-auth
      const { biometricEnabled, biometricAvailable } = get();
      if (biometricEnabled && biometricAvailable) {
        set({ shouldPromptBiometric: true });
      }
    }
    return false;
  },

  setBiometric: async (enabled) => {
    await setBiometricEnabled(enabled);
    set({ biometricEnabled: enabled });
  },

  setThemePreference: async (theme: ThemePreference) => {
    const { user, token } = get();

    if (!user || !token) return;

    // Optimistic update
    set({ user: { ...user, themePreference: theme } });

    try {
      await apolloClient.mutate({
        mutation: UPDATE_USER_PREFERENCES_MUTATION,
        variables: {
          input: { themePreference: theme },
        },
        context: {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      });

      // Update cached user
      const updatedUser = { ...user, themePreference: theme };
      await secureSetObject(STORAGE_KEYS.USER_DATA, updatedUser);
    } catch (error) {
      console.error('Error updating theme preference:', error);
      // Revert on error
      set({ user });
    }
  },

  setInboxGroupByDate: async (enabled: boolean) => {
    const { user, token } = get();

    if (!user || !token) return;

    // Optimistic update
    set({ user: { ...user, inboxGroupByDate: enabled } });

    try {
      await apolloClient.mutate({
        mutation: UPDATE_USER_PREFERENCES_MUTATION,
        variables: {
          input: { inboxGroupByDate: enabled },
        },
        context: {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      });

      // Update cached user
      const updatedUser = { ...user, inboxGroupByDate: enabled };
      await secureSetObject(STORAGE_KEYS.USER_DATA, updatedUser);
    } catch (error) {
      console.error('Error updating inbox group by date preference:', error);
      // Revert on error
      set({ user });
    }
  },

  setBlockExternalImages: async (enabled: boolean) => {
    const { user, token } = get();

    if (!user || !token) return;

    // Optimistic update
    set({ user: { ...user, blockExternalImages: enabled } });

    try {
      await apolloClient.mutate({
        mutation: UPDATE_USER_PREFERENCES_MUTATION,
        variables: {
          input: { blockExternalImages: enabled },
        },
        context: {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      });

      // Update cached user
      const updatedUser = { ...user, blockExternalImages: enabled };
      await secureSetObject(STORAGE_KEYS.USER_DATA, updatedUser);
    } catch (error) {
      console.error('Error updating block external images preference:', error);
      // Revert on error
      set({ user });
    }
  },

  setOffline: (offline) => {
    set({ isOffline: offline });
  },

  clearBiometricPrompt: () => {
    set({ shouldPromptBiometric: false });
  },
}));

// Listen for auth errors and handle re-authentication
let isHandlingAuthError = false;

authErrorEmitter.on('authError', async () => {
  // Prevent multiple simultaneous auth error handlers
  if (isHandlingAuthError) return;
  isHandlingAuthError = true;

  const store = useAuthStore.getState();
  
  try {
    console.log('[AuthStore] Auth error detected, attempting session refresh...');
    
    // First, try to refresh the session
    const session = await refreshSession();
    
    if (session?.access_token) {
      console.log('[AuthStore] Session refreshed successfully');
      await secureSet(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
      store.setOffline(false);
      isHandlingAuthError = false;
      return;
    }
  } catch (refreshError) {
    console.log('[AuthStore] Session refresh failed:', refreshError);
  }

  // If refresh failed and biometric is available, prompt for re-auth
  if (store.biometricEnabled && store.biometricAvailable) {
    console.log('[AuthStore] Prompting for biometric re-authentication...');
    
    const success = await store.loginWithBiometric();
    if (success) {
      console.log('[AuthStore] Biometric re-authentication successful');
      isHandlingAuthError = false;
      return;
    }
  }

  // All recovery attempts failed - log out
  console.log('[AuthStore] All auth recovery attempts failed, logging out...');
  await store.logout();
  isHandlingAuthError = false;
});

// Track last active time for proactive session refresh
let lastActiveTime = Date.now();
const SESSION_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// Listen for app state changes and refresh token when coming back from background
AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
  if (nextAppState === 'active') {
    const store = useAuthStore.getState();
    const timeSinceActive = Date.now() - lastActiveTime;
    
    // Only refresh if we've been inactive for a while and user is authenticated
    if (timeSinceActive > SESSION_REFRESH_THRESHOLD_MS && store.isAuthenticated) {
      console.log(`[AuthStore] App returned to foreground after ${Math.round(timeSinceActive / 1000)}s, refreshing token...`);
      await store.refreshTokenIfNeeded();
    }
  } else if (nextAppState === 'background') {
    lastActiveTime = Date.now();
  }
});
