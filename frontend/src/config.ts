/**
 * Frontend configuration loaded from environment variables.
 * Values are injected at build time by Vite.
 */

import { API_ROUTES } from '@main/common';

// Use import.meta.env for Vite environment variables
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://ivqyyttllhpwbducgpih.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_jcR4C-0t6ibdL5010_bLMg_-0xxL61F';
// Always use same-origin requests — both Vite (dev) and CloudFront (prod)
// proxy /api/* to the backend, so relative paths work from any domain.
const BACKEND_BASE_URL = window.location.origin;
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export const config = {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    redirectUrl: `${APP_URL}/auth/callback`,
  },
  api: {
    baseUrl: BACKEND_BASE_URL,
    graphqlUrl: `${BACKEND_BASE_URL}${API_ROUTES.GRAPHQL}`,
    wsUrl: `${BACKEND_BASE_URL}${API_ROUTES.GRAPHQL}`
      .replace('http://', 'ws://')
      .replace('https://', 'wss://'),
    attachmentsUrl: `${BACKEND_BASE_URL}${API_ROUTES.ATTACHMENTS.BASE}`,
  },
  app: {
    url: APP_URL,
  },
} as const;
