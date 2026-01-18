/**
 * Frontend configuration loaded from environment variables.
 * Values are injected at build time by Vite.
 */

// Use import.meta.env for Vite environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ivqyyttllhpwbducgpih.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_jcR4C-0t6ibdL5010_bLMg_-0xxL61F';
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || '/api/graphql';
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export const config = {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    redirectUrl: `${APP_URL}/auth/callback`,
  },
  api: {
    graphqlUrl: BACKEND_API_URL,
    wsUrl: BACKEND_API_URL.replace('http://', 'ws://').replace('https://', 'wss://'),
  },
  app: {
    url: APP_URL,
  },
} as const;
