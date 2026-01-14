// StacksMail Theme Configuration

export type ThemePreference = 'LIGHT' | 'DARK' | 'AUTO';

const baseTheme = {
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    pill: '24px',
    full: '50%',
  },

  transitions: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.35s ease',
  },

  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    xxl: '2rem',
  },
} as const;

export const lightTheme = {
  ...baseTheme,
  mode: 'light' as const,
  colors: {
    // Primary brand colors
    primary: '#667eea',
    primaryDark: '#5a67d8',
    primaryLight: '#a3b1fa',
    secondary: '#764ba2',

    // Gradient
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

    // Text colors
    textPrimary: '#202124',
    textSecondary: '#5f6368',
    textMuted: '#9aa0a6',

    // Background colors
    background: '#f6f8fc',
    backgroundWhite: '#ffffff',
    backgroundHover: '#f1f3f4',
    unreadBackground: '#e8f0fe',

    // Status colors
    success: '#28a745',
    warning: '#fbbc04',
    danger: '#dc3545',
    info: '#17a2b8',

    // Border colors
    border: '#e0e0e0',
    borderLight: '#f0f0f0',

    // Star color
    star: '#fbbc04',
    starInactive: '#dadce0',
  },

  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
    md: '0 4px 12px rgba(0, 0, 0, 0.1)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    primary: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
} as const;

export const darkTheme = {
  ...baseTheme,
  mode: 'dark' as const,
  colors: {
    // Primary brand colors (slightly brighter for dark mode)
    primary: '#818cf8',
    primaryDark: '#6366f1',
    primaryLight: '#a5b4fc',
    secondary: '#a78bfa',

    // Gradient
    gradient: 'linear-gradient(135deg, #4c51bf 0%, #6b46c1 100%)',

    // Text colors
    textPrimary: '#f3f4f6',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',

    // Background colors
    background: '#111827',
    backgroundWhite: '#1f2937',
    backgroundHover: '#374151',
    unreadBackground: '#1e3a5f',

    // Status colors
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#38bdf8',

    // Border colors
    border: '#374151',
    borderLight: '#4b5563',

    // Star color
    star: '#fbbf24',
    starInactive: '#4b5563',
  },

  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
    primary: '0 4px 12px rgba(129, 140, 248, 0.3)',
  },
} as const;

// Default theme for backwards compatibility
export const theme = lightTheme;

export type Theme = typeof lightTheme;

// Helper to access theme in styled-components
declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}

// Helper to get theme based on preference and system setting
export function getTheme(preference: ThemePreference, systemDark: boolean): Theme {
  if (preference === 'DARK') return darkTheme;
  if (preference === 'LIGHT') return lightTheme;
  // AUTO - follow system preference
  return systemDark ? darkTheme : lightTheme;
}
