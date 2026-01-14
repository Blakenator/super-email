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

// Supabase client configuration
const supabaseUrl = 'https://ivqyyttllhpwbducgpih.supabase.co';
const supabaseAnonKey = 'sb_publishable_jcR4C-0t6ibdL5010_bLMg_-0xxL61F';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import type { ThemePreference } from '../core/theme';

type NotificationDetailLevel = 'MINIMAL' | 'FULL';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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
  login: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  logout: (redirectPath?: string) => Promise<void>;
  refetchProfile: () => Promise<void>;
  updatePreferences: (input: UpdatePreferencesInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const apolloClient = useApolloClient();

  // Fetch profile from backend and sync user state
  const fetchProfileFromBackend = useCallback(
    async (accessToken: string) => {
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
          setUser({
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
          });
          return data.fetchProfile;
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
      return null;
    },
    [apolloClient],
  );

  // Initialize auth state from Supabase session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setToken(session.access_token);
          // Fetch profile from backend to ensure user exists in our DB
          await fetchProfileFromBackend(session.access_token);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
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
        // Fetch profile from backend to ensure user exists in our DB
        await fetchProfileFromBackend(session.access_token);

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

  const login = useCallback(
    async (email: string, password: string) => {
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
        await fetchProfileFromBackend(data.session.access_token);
      }
    },
    [fetchProfileFromBackend],
  );

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
    if (token) {
      await fetchProfileFromBackend(token);
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
        login,
        signUp,
        logout,
        refetchProfile,
        updatePreferences,
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
