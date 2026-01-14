import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useMutation } from '@apollo/client/react';
import { gql } from '../__generated__/gql';
import {
  lightTheme,
  darkTheme,
  getTheme,
  type Theme,
  type ThemePreference,
} from '../core/theme';

const UPDATE_THEME_PREFERENCE_MUTATION = gql(`
  mutation UpdateThemePreference($themePreference: ThemePreference!) {
    updateThemePreference(themePreference: $themePreference) {
      id
      themePreference
    }
  }
`);

interface ThemeContextValue {
  theme: Theme;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  userThemePreference?: ThemePreference | null;
}

export function ThemeContextProvider({
  children,
  userThemePreference,
}: ThemeProviderProps) {
  // Get initial preference from user or localStorage
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    () => {
      if (userThemePreference) return userThemePreference;
      const stored = localStorage.getItem('themePreference');
      if (stored && ['LIGHT', 'DARK', 'AUTO'].includes(stored)) {
        return stored as ThemePreference;
      }
      return 'AUTO';
    },
  );

  // Track system dark mode preference
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Update from user preference when it changes (e.g., after login)
  useEffect(() => {
    if (userThemePreference) {
      setThemePreferenceState(userThemePreference);
      localStorage.setItem('themePreference', userThemePreference);
    }
  }, [userThemePreference]);

  const [updateThemeMutation] = useMutation(UPDATE_THEME_PREFERENCE_MUTATION);

  const setThemePreference = useCallback(
    (preference: ThemePreference) => {
      setThemePreferenceState(preference);
      localStorage.setItem('themePreference', preference);

      // Update in database if user is authenticated
      updateThemeMutation({
        variables: { themePreference: preference },
      }).catch(() => {
        // Ignore errors for unauthenticated users
      });
    },
    [updateThemeMutation],
  );

  const theme = getTheme(themePreference, systemDark);
  const isDarkMode = theme.mode === 'dark';

  // Apply dark mode class to body for Bootstrap
  useEffect(() => {
    if (isDarkMode) {
      document.body.setAttribute('data-bs-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.body.removeAttribute('data-bs-theme');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themePreference,
        setThemePreference,
        isDarkMode,
      }}
    >
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }
  return context;
}
