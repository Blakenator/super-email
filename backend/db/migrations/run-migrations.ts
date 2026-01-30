#!/usr/bin/env tsx
/**
 * CLI script to run database migrations
 * 
 * Usage:
 *   pnpm run db:migrate          - Run pending migrations
 *   pnpm run db:migrate:status   - Show migration status
 */

import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenvConfig({ path: resolve(__dirname, '../../..', '.env') });
dotenvConfig({ path: resolve(__dirname, '../..', '.env'), override: true });

// Import after env is loaded
import 'reflect-metadata';
import { sequelize } from '../database.js';
import { runMigrations, getPendingMigrations, getExecutedMigrations } from './migrator.js';

async function main() {
  const command = process.argv[2] || 'up';

  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected.\n');

    switch (command) {
      case 'up':
      case 'migrate':
        await runMigrations(sequelize);
        break;

      case 'status':
        const executed = await getExecutedMigrations(sequelize);
        const pending = await getPendingMigrations(sequelize);

        console.log('=== Migration Status ===\n');
        
        if (executed.length > 0) {
          console.log('Executed migrations:');
          executed.forEach(m => console.log(`  ✓ ${m}`));
          console.log('');
        }

        if (pending.length > 0) {
          console.log('Pending migrations:');
          pending.forEach(m => console.log(`  ○ ${m}`));
        } else {
          console.log('No pending migrations.');
        }
        break;

      default:
        console.log('Usage:');
        console.log('  pnpm run db:migrate         - Run pending migrations');
        console.log('  pnpm run db:migrate:status  - Show migration status');
        process.exit(1);
    }

    console.log('\nDone.');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

main();
