import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
/* eslint-disable react-refresh/only-export-components */
import { createClient } from '@supabase/supabase-js';
import { useApolloClient } from '@apollo/client/react';
import {
  FETCH_PROFILE_QUERY,
  UPDATE_USER_PREFERENCES_MUTATION,
} from '../pages/auth/queries';
import { useEmailStore, type SavedUser, type CachedUser } from '../stores/emailStore';
import { config } from '../config';

// Supabase client configuration
export const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    redirectTo: config.supabase.redirectUrl,
  },
});

import type { ThemePreference } from '../core/theme';

type NotificationDetailLevel = 'MINIMAL' | 'FULL';

interface User {
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

interface UpdatePreferencesInput {
  themePreference?: ThemePreference;
  navbarCollapsed?: boolean;
  notificationDetailLevel?: NotificationDetailLevel;
  inboxDensity?: boolean;
  inboxGroupByDate?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOffline: boolean;
  savedUsers: SavedUser[];
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginAsSavedUser: (userId: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  logout: (redirectPath?: string) => Promise<void>;
  refetchProfile: () => Promise<void>;
  updatePreferences: (input: UpdatePreferencesInput) => Promise<void>;
  removeSavedUser: (userId: string) => void;
  clearSavedUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const apolloClient = useApolloClient();

  // Track last profile fetch time to prevent excessive fetching
  const lastProfileFetchRef = React.useRef<number>(0);
  const PROFILE_FETCH_INTERVAL_MS = 60 * 1000; // 1 minute minimum between fetches

  // Get offline state and cached data from store
  const isOnline = useEmailStore((state) => state.isOnline);
  const cachedUser = useEmailStore((state) => state.cachedUser);
  const savedUsers = useEmailStore((state) => state.savedUsers);
  const setCachedUser = useEmailStore((state) => state.setCachedUser);
  const addSavedUser = useEmailStore((state) => state.addSavedUser);
  const removeSavedUserFromStore = useEmailStore((state) => state.removeSavedUser);
  const clearSavedUsersFromStore = useEmailStore((state) => state.clearSavedUsers);

  // Fetch profile from backend and sync user state
  const fetchProfileFromBackend = useCallback(
    async (accessToken: string, rememberMe: boolean = false, force: boolean = false) => {
      // Throttle profile fetches - don't fetch more than once per minute unless forced
      const now = Date.now();
      if (!force && now - lastProfileFetchRef.current < PROFILE_FETCH_INTERVAL_MS) {
        console.log('Profile fetch throttled - too soon since last fetch');
        return null;
      }

      // Skip network fetch if offline (unless forced)
      const currentIsOnline = useEmailStore.getState().isOnline;
      if (!force && !currentIsOnline) {
        console.log('Skipping profile fetch - offline');
        const currentCachedUser = useEmailStore.getState().cachedUser;
        if (currentCachedUser) {
          return currentCachedUser;
        }
        return null;
      }

      lastProfileFetchRef.current = now;

      try {
        const { data } = await apolloClient.query({
          query: FETCH_PROFILE_QUERY,
          fetchPolicy: 'network-only',
          context: {
            headers: {
              authorization: `Bearer ${accessToken}`,
            },
          },
        });

        if (data?.fetchProfile) {
          const userData: User = {
            id: data.fetchProfile.id,
            email: data.fetchProfile.email,
            firstName: data.fetchProfile.firstName,
            lastName: data.fetchProfile.lastName,
            themePreference:
              (data.fetchProfile.themePreference as ThemePreference) || 'AUTO',
            navbarCollapsed: data.fetchProfile.navbarCollapsed ?? false,
            notificationDetailLevel:
              (data.fetchProfile
                .notificationDetailLevel as NotificationDetailLevel) || 'FULL',
            inboxDensity: data.fetchProfile.inboxDensity ?? false,
            inboxGroupByDate: data.fetchProfile.inboxGroupByDate ?? false,
          };
          setUser(userData);

          // Cache user data for offline access
          const cachedUserData: CachedUser = {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            themePreference: userData.themePreference,
            navbarCollapsed: userData.navbarCollapsed,
            notificationDetailLevel: userData.notificationDetailLevel,
            inboxDensity: userData.inboxDensity,
            inboxGroupByDate: userData.inboxGroupByDate,
          };
          setCachedUser(cachedUserData);

          // Save user for "Remember Me" feature if requested
          if (rememberMe) {
            addSavedUser({
              id: userData.id,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              lastLoginAt: new Date().toISOString(),
            });
          }

          return data.fetchProfile;
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // If offline and we have cached user data, use that
        if (!isOnline && cachedUser) {
          console.log('Using cached user data for offline mode');
          setUser({
            id: cachedUser.id,
            email: cachedUser.email,
            firstName: cachedUser.firstName || null,
            lastName: cachedUser.lastName || null,
            themePreference: (cachedUser.themePreference as ThemePreference) || 'AUTO',
            navbarCollapsed: cachedUser.navbarCollapsed ?? false,
            notificationDetailLevel:
              (cachedUser.notificationDetailLevel as NotificationDetailLevel) || 'FULL',
            inboxDensity: cachedUser.inboxDensity ?? false,
            inboxGroupByDate: cachedUser.inboxGroupByDate ?? false,
          });
          return cachedUser;
        }
      }
      return null;
    },
    [apolloClient, setCachedUser, addSavedUser],
  );

  // Initialize auth state from Supabase session (only runs once on mount)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setToken(session.access_token);

          // Fetch profile from backend with a timeout to prevent infinite loading
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 10000),
          );

          try {
            await Promise.race([
              fetchProfileFromBackend(session.access_token, false, true), // Force fetch on initial load
              timeoutPromise,
            ]);
          } catch (profileError) {
            console.error(
              'Error fetching profile (proceeding anyway):',
              profileError,
            );
            // If we have cached user data, use that
            const currentCachedUser = useEmailStore.getState().cachedUser;
            if (currentCachedUser) {
              setUser({
                id: currentCachedUser.id,
                email: currentCachedUser.email,
                firstName: currentCachedUser.firstName || null,
                lastName: currentCachedUser.lastName || null,
                themePreference: (currentCachedUser.themePreference as ThemePreference) || 'AUTO',
                navbarCollapsed: currentCachedUser.navbarCollapsed ?? false,
                notificationDetailLevel:
                  (currentCachedUser.notificationDetailLevel as NotificationDetailLevel) || 'FULL',
                inboxDensity: currentCachedUser.inboxDensity ?? false,
                inboxGroupByDate: currentCachedUser.inboxGroupByDate ?? false,
              });
            } else {
              // Set minimal user data so app doesn't get stuck
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                firstName: null,
                lastName: null,
                themePreference: 'AUTO',
                navbarCollapsed: false,
                notificationDetailLevel: 'FULL',
                inboxDensity: false,
                inboxGroupByDate: false,
              });
            }
          }
        } else {
          // No session - check if we have cached user for offline mode
          const currentCachedUser = useEmailStore.getState().cachedUser;
          const currentIsOnline = useEmailStore.getState().isOnline;
          if (!currentIsOnline && currentCachedUser) {
            // Offline with cached user - allow offline access
            console.log('Offline mode: Using cached user data');
            setUser({
              id: currentCachedUser.id,
              email: currentCachedUser.email,
              firstName: currentCachedUser.firstName || null,
              lastName: currentCachedUser.lastName || null,
              themePreference: (currentCachedUser.themePreference as ThemePreference) || 'AUTO',
              navbarCollapsed: currentCachedUser.navbarCollapsed ?? false,
              notificationDetailLevel:
                (currentCachedUser.notificationDetailLevel as NotificationDetailLevel) || 'FULL',
              inboxDensity: currentCachedUser.inboxDensity ?? false,
              inboxGroupByDate: currentCachedUser.inboxGroupByDate ?? false,
            });
            // Set a placeholder token for offline mode
            setToken('offline-mode');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // If offline and we have cached data, use it
        const currentCachedUser = useEmailStore.getState().cachedUser;
        const currentIsOnline = useEmailStore.getState().isOnline;
        if (!currentIsOnline && currentCachedUser) {
          console.log('Offline mode fallback: Using cached user data');
          setUser({
            id: currentCachedUser.id,
            email: currentCachedUser.email,
            firstName: currentCachedUser.firstName || null,
            lastName: currentCachedUser.lastName || null,
            themePreference: (currentCachedUser.themePreference as ThemePreference) || 'AUTO',
            navbarCollapsed: currentCachedUser.navbarCollapsed ?? false,
            notificationDetailLevel:
              (currentCachedUser.notificationDetailLevel as NotificationDetailLevel) || 'FULL',
            inboxDensity: currentCachedUser.inboxDensity ?? false,
            inboxGroupByDate: currentCachedUser.inboxGroupByDate ?? false,
          });
          setToken('offline-mode');
        }
      } finally {
        setIsLoading(false);
      }
    };

    void initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setToken(session.access_token);
        // Fetch profile from backend to ensure user exists in our DB (force on auth change)
        await fetchProfileFromBackend(session.access_token, false, true);

        // Check for redirect path in URL after OAuth login
        if (event === 'SIGNED_IN') {
          const urlParams = new URLSearchParams(window.location.search);
          const redirectPath = urlParams.get('redirect');
          if (redirectPath && window.location.pathname === '/login') {
            // Navigate to the redirect path
            window.location.href = redirectPath;
          }
        }
      } else {
        setToken(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfileFromBackend]);

  // Periodically refresh profile (at most once per minute) and on tab visibility
  useEffect(() => {
    if (!token || token === 'offline-mode') return;

    const refreshProfile = () => {
      const now = Date.now();
      if (now - lastProfileFetchRef.current >= PROFILE_FETCH_INTERVAL_MS) {
        fetchProfileFromBackend(token, false, false).catch((err) => {
          console.error('Error refreshing profile:', err);
        });
      }
    };

    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && token && token !== 'offline-mode') {
        refreshProfile();
      }
    };

    // Set up periodic refresh (every minute)
    const intervalId = setInterval(refreshProfile, PROFILE_FETCH_INTERVAL_MS);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, fetchProfileFromBackend]);

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        setToken(data.session.access_token);
        // Fetch profile from backend to ensure user/auth method exists
        await fetchProfileFromBackend(data.session.access_token, rememberMe);
      }
    },
    [fetchProfileFromBackend],
  );

  // Login as a saved user (requires re-authentication with Supabase)
  const loginAsSavedUser = useCallback(
    async (userId: string) => {
      const savedUser = savedUsers.find((u) => u.id === userId);
      if (!savedUser) {
        throw new Error('Saved user not found');
      }
      // This just pre-fills the email - user still needs to enter password
      // The actual login happens through the regular login flow
      throw new Error('PASSWORD_REQUIRED:' + savedUser.email);
    },
    [savedUsers],
  );

  const removeSavedUser = useCallback(
    (userId: string) => {
      removeSavedUserFromStore(userId);
    },
    [removeSavedUserFromStore],
  );

  const clearSavedUsers = useCallback(() => {
    clearSavedUsersFromStore();
  }, [clearSavedUsersFromStore]);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        setToken(data.session.access_token);
        // Fetch profile from backend to create user/auth method
        await fetchProfileFromBackend(data.session.access_token);
      }
    },
    [fetchProfileFromBackend],
  );

  const logout = useCallback(
    async (redirectPath?: string) => {
      await supabase.auth.signOut();
      setToken(null);
      setUser(null);
      // Clear Apollo cache on logout
      await apolloClient.clearStore();

      // If a redirect path is provided, add it as a search param
      if (
        redirectPath &&
        redirectPath !== '/login' &&
        redirectPath !== '/signup'
      ) {
        window.location.href = `/login?redirect=${encodeURIComponent(redirectPath)}`;
      }
    },
    [apolloClient],
  );

  const refetchProfile = useCallback(async () => {
    if (token && token !== 'offline-mode') {
      // Force refresh when explicitly called
      await fetchProfileFromBackend(token, false, true);
    }
  }, [token, fetchProfileFromBackend]);

  const updatePreferences = useCallback(
    async (input: UpdatePreferencesInput) => {
      if (!token || !user) {
        throw new Error('Not authenticated');
      }

      // Optimistic update - apply changes immediately for better UX
      const previousUser = user;
      setUser((prev) =>
        prev
          ? {
              ...prev,
              ...(input.themePreference !== undefined && {
                themePreference: input.themePreference,
              }),
              ...(input.navbarCollapsed !== undefined && {
                navbarCollapsed: input.navbarCollapsed,
              }),
              ...(input.notificationDetailLevel !== undefined && {
                notificationDetailLevel: input.notificationDetailLevel,
              }),
            }
          : null,
      );

      try {
        await apolloClient.mutate({
          mutation: UPDATE_USER_PREFERENCES_MUTATION,
          variables: { input },
          context: {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        });
      } catch (error) {
        // Rollback on error
        setUser(previousUser);
        throw error;
      }
    },
    [token, user, apolloClient],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isOffline: !isOnline,
        savedUsers,
        login,
        loginAsSavedUser,
        signUp,
        logout,
        refetchProfile,
        updatePreferences,
        removeSavedUser,
        clearSavedUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
