/**
 * Mobile app configuration loaded from environment variables.
 * Uses Expo Constants for environment variable access.
 */

import Constants from 'expo-constants';

console.log('[Config] Loading config...');

// Environment variables from app.config.js or .env
const extra = Constants.expirationDate
  ? {}
  : (Constants.expoConfig?.extra ?? {});

// Supabase configuration
const SUPABASE_URL =
  extra.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://ivqyyttllhpwbducgpih.supabase.co';

const SUPABASE_ANON_KEY =
  extra.SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_jcR4C-0t6ibdL5010_bLMg_-0xxL61F';

// Backend API URL
let API_BASE_URL =
  extra.API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://api.supermail.com';

// Ensure URL has protocol
if (
  API_BASE_URL &&
  !API_BASE_URL.startsWith('http://') &&
  !API_BASE_URL.startsWith('https://')
) {
  API_BASE_URL = `https://${API_BASE_URL}`;
}

// API routes (inline to avoid bundler issues with @main/common)
const API_ROUTES = {
  GRAPHQL: '/api/graphql',
} as const;

console.log('[Config] API_BASE_URL:', API_BASE_URL);
console.log('[Config] SUPABASE_URL:', SUPABASE_URL);

export const config = {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  },
  api: {
    baseUrl: API_BASE_URL,
    graphqlUrl: `${API_BASE_URL}${API_ROUTES.GRAPHQL}`,
    wsUrl: `${API_BASE_URL}${API_ROUTES.GRAPHQL}`
      .replace('http://', 'ws://')
      .replace('https://', 'wss://'),
  },
  app: {
    name: 'SuperMail',
    version: Constants.expoConfig?.version || '1.0.0',
    buildNumber: Constants.expoConfig?.ios?.buildNumber || '1',
  },
  // Feature flags
  features: {
    biometricAuth: true,
    pushNotifications: true,
    offlineMode: true,
  },
} as const;

console.log('[Config] Config loaded successfully');

export type Config = typeof config;
