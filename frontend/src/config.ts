/**
 * Frontend configuration loaded from environment variables.
 * Values are injected at build time by Vite.
 */

import { API_ROUTES, API_BASE_PATH } from '@main/common';

// Use import.meta.env for Vite environment variables
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://ivqyyttllhpwbducgpih.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_jcR4C-0t6ibdL5010_bLMg_-0xxL61F';
// Backend URL can be:
// - Development: window.location.origin (Vite proxies /api/* to localhost:4000)
// - Production without custom domain: window.location.origin (CloudFront proxies /api/* to EC2)
// - Production with custom domain: 'https://api.super-mail.app'
const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || window.location.origin;
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
