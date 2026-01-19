/**
 * Shared API route constants
 * Used by both frontend and backend for consistency
 */

export const API_ROUTES = {
  // GraphQL endpoint
  GRAPHQL: '/api/graphql',

  // Health check
  HEALTH: '/api/health',

  // Attachments
  ATTACHMENTS: {
    DOWNLOAD: (id: string) => `/api/attachments/download/${id}`,
    BASE: '/api/attachments',
  },
} as const;

// Base API path for proxying
export const API_BASE_PATH = '/api';
