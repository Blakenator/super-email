// Load environment variables from .env files BEFORE any other imports
import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from project root first (for shared variables)
dotenvConfig({ path: resolve(__dirname, '..', '.env') });

// Then load backend-specific .env (values here will override project root)
dotenvConfig({ path: resolve(__dirname, '.env'), override: true });

// Now load observability, reflect-metadata, and the main application using dynamic imports.
// This ensures dotenv has already populated process.env before any app imports run.
const { initObservability } = await import('./helpers/observability.js');
await initObservability();
await import('reflect-metadata');
await import('./index.js');
