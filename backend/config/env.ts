/**
 * Centralized Environment Configuration
 *
 * All environment variables should be accessed through this module.
 * This provides type safety, defaults, and validation in one place.
 */

// Determine if we're running in production
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Application Configuration
 */
export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  isDevelopment: !isProduction,

  // Server
  port: parseInt(process.env.PORT || '4000', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // Database (PostgreSQL)
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    name: process.env.DB_NAME || 'email_client',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },

  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    // Credentials are automatically loaded from environment or IAM role
  },

  // S3 Attachments Storage
  attachments: {
    s3Bucket: process.env.ATTACHMENTS_S3_BUCKET || 'email-attachments',
    localDir: process.env.ATTACHMENTS_LOCAL_DIR || 'data/attachments',
  },

  // Supabase Authentication
  supabase: {
    url: process.env.SUPABASE_URL || 'https://ivqyyttllhpwbducgpih.supabase.co',
    anonKey:
      process.env.SUPABASE_ANON_KEY ||
      'sb_publishable_jcR4C-0t6ibdL5010_bLMg_-0xxL61F',
  },

  // AWS Secrets Manager (for IMAP/SMTP credentials)
  secrets: {
    // The base path in Secrets Manager for email credentials
    basePath: process.env.SECRETS_BASE_PATH || 'email-client',
    // Local secrets file for development
    localSecretsFile: process.env.LOCAL_SECRETS_FILE || 'data/secrets.json',
  },

  // JWT Configuration (if using local auth in addition to Supabase)
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Frontend URL (for Stripe checkout redirects, email links, etc.)
  frontendUrl: process.env.FRONTEND_URL || (isProduction ? '' : 'http://localhost:5173'),

  // Background Sync Configuration
  backgroundSync: {
    // How long before an email account is considered stale and needs re-syncing (in minutes)
    staleThresholdMinutes: parseInt(
      process.env.BACKGROUND_SYNC_STALE_THRESHOLD_MINUTES ||
        (isProduction ? '14' : '5'),
      10,
    ),
    // How often to run the background sync check (in minutes)
    intervalMinutes: parseInt(
      process.env.BACKGROUND_SYNC_INTERVAL_MINUTES ||
        (isProduction ? '60' : '2'),
      10,
    ),
    // Whether background sync is enabled (disable when using Lambda cron in production)
    enabled: process.env.BACKGROUND_SYNC_ENABLED !== 'false',
  },

  // Internal API Token (for Lambda to trigger sync securely)
  internalApiToken: process.env.INTERNAL_API_TOKEN || '',

  // Stripe Configuration (for billing)
  stripe: {
    // Stripe secret key (starts with sk_test_ or sk_live_)
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    // Stripe webhook signing secret (starts with whsec_)
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    // Stripe publishable key (for frontend, starts with pk_test_ or pk_live_)
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    // Price IDs for storage tiers (set in Stripe Dashboard)
    storagePriceIds: {
      basic: process.env.STRIPE_PRICE_STORAGE_BASIC || '',
      pro: process.env.STRIPE_PRICE_STORAGE_PRO || '',
      enterprise: process.env.STRIPE_PRICE_STORAGE_ENTERPRISE || '',
    },
    // Price IDs for account tiers (set in Stripe Dashboard)
    accountPriceIds: {
      basic: process.env.STRIPE_PRICE_ACCOUNTS_BASIC || '',
      pro: process.env.STRIPE_PRICE_ACCOUNTS_PRO || '',
      enterprise: process.env.STRIPE_PRICE_ACCOUNTS_ENTERPRISE || '',
    },
  },

  // Firebase Configuration (for web push notifications)
  firebase: {
    // Firebase Admin SDK service account JSON (stringified)
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
    // Or path to the service account JSON file (easier for local dev)
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
  },
} as const;

/**
 * Environment variable definitions for documentation and deployment
 */
export const envVarDefinitions = {
  // Required in production
  required: {
    DB_HOST: 'PostgreSQL database host',
    DB_PORT: 'PostgreSQL database port (default: 5432)',
    DB_NAME: 'PostgreSQL database name',
    DB_USER: 'PostgreSQL username',
    DB_PASSWORD: 'PostgreSQL password',
    ATTACHMENTS_S3_BUCKET: 'S3 bucket name for email attachments',
    AWS_REGION: 'AWS region (default: us-east-1)',
  },

  // Optional with defaults
  optional: {
    NODE_ENV: 'Environment: development or production (default: development)',
    PORT: 'Server port (default: 4000)',
    LOG_LEVEL:
      'Logging level: debug, info, warn, error (default: info in prod)',
    SUPABASE_URL: 'Supabase project URL',
    SUPABASE_ANON_KEY: 'Supabase anonymous key',
    SECRETS_BASE_PATH: 'Base path in AWS Secrets Manager for credentials',
    LOCAL_SECRETS_FILE: 'Path to local secrets file for development',
    JWT_SECRET: 'Secret for JWT signing (not needed if using Supabase auth)',
    JWT_EXPIRES_IN: 'JWT token expiration time (default: 7d)',
    BACKGROUND_SYNC_STALE_THRESHOLD_MINUTES:
      'Minutes before email account is considered stale (default: 15 in prod, 5 in dev)',
    BACKGROUND_SYNC_INTERVAL_MINUTES:
      'How often to run background sync (default: 60 in prod, 2 in dev)',
    BACKGROUND_SYNC_ENABLED:
      'Enable/disable background sync (default: true, disable when using Lambda cron)',
    INTERNAL_API_TOKEN:
      'Secret token for internal API endpoints (used by Lambda cron)',
    STRIPE_SECRET_KEY: 'Stripe secret API key (sk_test_... or sk_live_...)',
    STRIPE_WEBHOOK_SECRET: 'Stripe webhook signing secret (whsec_...)',
    STRIPE_PUBLISHABLE_KEY:
      'Stripe publishable key for frontend (pk_test_... or pk_live_...)',
    STRIPE_PRICE_STORAGE_BASIC: 'Stripe Price ID for Basic storage tier (10GB)',
    STRIPE_PRICE_STORAGE_PRO: 'Stripe Price ID for Pro storage tier (20GB)',
    STRIPE_PRICE_STORAGE_ENTERPRISE:
      'Stripe Price ID for Enterprise storage tier (100GB)',
    STRIPE_PRICE_ACCOUNTS_BASIC:
      'Stripe Price ID for Basic accounts tier (2 accounts)',
    STRIPE_PRICE_ACCOUNTS_PRO:
      'Stripe Price ID for Pro accounts tier (5 accounts)',
    STRIPE_PRICE_ACCOUNTS_ENTERPRISE:
      'Stripe Price ID for Enterprise accounts tier (unlimited)',
    FIREBASE_SERVICE_ACCOUNT_JSON:
      'Firebase Admin SDK service account JSON (stringified) for web push notifications',
    FIREBASE_SERVICE_ACCOUNT_PATH:
      'Path to Firebase service account JSON file (alternative to JSON string)',
  },
} as const;

/**
 * Validate required environment variables in production
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.isProduction) {
    // In production, these must be set
    if (!process.env.DB_HOST) {
      errors.push('DB_HOST is required in production');
    }
    if (!process.env.DB_PASSWORD) {
      errors.push('DB_PASSWORD is required in production');
    }
    if (!process.env.ATTACHMENTS_S3_BUCKET) {
      errors.push('ATTACHMENTS_S3_BUCKET is required in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Export default config
export default config;
