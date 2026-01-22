// Load environment variables from .env file BEFORE any other imports
import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from project root (one level up from backend)
dotenvConfig({ path: resolve(__dirname, '..', '.env') });

// Now load reflect-metadata and the main application using dynamic imports
// This ensures dotenv has already populated process.env
await import('reflect-metadata');
await import('./index.js');
