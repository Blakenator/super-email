/**
 * Theme configuration for StacksMail mobile app
 * Matches the web app's color scheme
 */

import { useColorScheme } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Email specific
  unread: string;
  starred: string;
  
  // Other
  shadow: string;
  overlay: string;
}

export const lightColors: ThemeColors = {
  // Primary colors - gradient from web app
  primary: '#667eea',
  primaryLight: '#8b9cf4',
  primaryDark: '#764ba2',
  secondary: '#764ba2',
  
  // Background colors
  background: '#f8f9fa',
  backgroundSecondary: '#ffffff',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  
  // Text colors
  text: '#212529',
  textSecondary: '#495057',
  textMuted: '#6c757d',
  textInverse: '#ffffff',
  
  // Status colors
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8',
  
  // Border colors
  border: '#dee2e6',
  borderLight: '#e9ecef',
  
  // Email specific
  unread: '#667eea',
  starred: '#ffc107',
  
  // Other
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const darkColors: ThemeColors = {
  // Primary colors
  primary: '#667eea',
  primaryLight: '#8b9cf4',
  primaryDark: '#764ba2',
  secondary: '#764ba2',
  
  // Background colors
  background: '#121212',
  backgroundSecondary: '#1e1e1e',
  surface: '#1e1e1e',
  surfaceElevated: '#2d2d2d',
  
  // Text colors
  text: '#f8f9fa',
  textSecondary: '#adb5bd',
  textMuted: '#6c757d',
  textInverse: '#212529',
  
  // Status colors
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8',
  
  // Border colors
  border: '#343a40',
  borderLight: '#495057',
  
  // Email specific
  unread: '#8b9cf4',
  starred: '#ffc107',
  
  // Other
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export interface Theme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    fontSizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    fontWeights: {
      normal: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

const baseTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    fontSizes: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 20,
      xxl: 24,
    },
    fontWeights: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

export const lightTheme: Theme = {
  colors: lightColors,
  ...baseTheme,
};

export const darkTheme: Theme = {
  colors: darkColors,
  ...baseTheme,
};

/**
 * Hook to get the current theme based on user preference
 */
export function useTheme(): Theme {
  const systemColorScheme = useColorScheme();
  
  // Access auth store for theme preference
  const themePreference = useAuthStore((state) => state.user?.themePreference);
  
  // Determine which theme to use
  let isDark = false;
  
  if (themePreference === 'DARK') {
    isDark = true;
  } else if (themePreference === 'LIGHT') {
    isDark = false;
  } else {
    // AUTO - follow system
    isDark = systemColorScheme === 'dark';
  }
  
  return isDark ? darkTheme : lightTheme;
}

/**
 * Hook to get just the colors
 */
export function useColors(): ThemeColors {
  const theme = useTheme();
  return theme.colors;
}
