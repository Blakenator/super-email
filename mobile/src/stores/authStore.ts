/**
 * Authentication Store
 * Manages auth state with Zustand and secure storage
 */

import { create } from 'zustand';
import { 
  secureSet, 
  secureGet, 
  secureSetObject, 
  secureGetObject,
  clearSecureStorage,
  STORAGE_KEYS 
} from '../services/secureStorage';
import { 
  supabase, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut as supabaseSignOut,
  getSession,
} from '../services/supabase';
import { apolloClient, clearApolloCache, authErrorEmitter } from '../services/apollo';
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

// GraphQL query for fetching user profile
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
  
  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithBiometric: () => Promise<boolean>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setBiometric: (enabled: boolean) => Promise<void>;
  setOffline: (offline: boolean) => void;
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
        registerForPushNotifications().then(async (pushToken) => {
          if (pushToken) {
            await registerPushTokenWithBackend(pushToken.token, session.access_token);
            console.log('[AuthStore] Push token registered');
          }
        }).catch(e => console.log('[AuthStore] Push registration failed:', e));
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
      }
      
      set({ token: session.access_token });
      
      // Fetch profile
      await get().refreshProfile();
      
      // Register for push notifications
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await registerPushTokenWithBackend(pushToken.token, session.access_token);
      }
      
      set({ isAuthenticated: true, isOffline: false });
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
        set({ token: session.access_token, isAuthenticated: true });
        await get().refreshProfile();
        return true;
      }
    } catch (error) {
      console.error('Biometric login session check failed:', error);
    }
    
    return false;
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
      await supabaseSignOut();
      await clearSecureStorage();
      await clearApolloCache();
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
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
  
  setBiometric: async (enabled) => {
    await setBiometricEnabled(enabled);
    set({ biometricEnabled: enabled });
  },
  
  setOffline: (offline) => {
    set({ isOffline: offline });
  },
}));

// Listen for auth errors and handle logout
authErrorEmitter.on('authError', () => {
  useAuthStore.getState().logout();
});
