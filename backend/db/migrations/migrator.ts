/**
 * Database Migration Runner using Umzug
 * 
 * This module handles running SQL migrations from the migrations folder.
 * Migrations are tracked in a 'migrations' table in the database.
 * 
 * Usage:
 * - Import and call runMigrations() during app startup
 * - Place .sql migration files in backend/db/migrations/
 * - Files are executed in alphabetical order
 */

import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize, QueryInterface } from 'sequelize';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migration context type
interface MigrationContext {
  queryInterface: QueryInterface;
  sequelize: Sequelize;
}

/**
 * Create the umzug migrator instance
 */
export function createMigrator(sequelize: Sequelize): Umzug<MigrationContext> {
  const migrationsPath = __dirname;

  return new Umzug({
    migrations: {
      glob: ['*.sql', { cwd: migrationsPath }],
      resolve: ({ name, path: migrationPath }) => {
        return {
          name,
          up: async ({ context }) => {
            if (!migrationPath) {
              throw new Error(`Migration path not found for ${name}`);
            }
            const sql = fs.readFileSync(migrationPath, 'utf-8');
            
            // Split by semicolons but handle the CONCURRENTLY keyword specially
            // PostgreSQL requires CONCURRENTLY indexes to be run outside of transactions
            const statements = sql
              .split(/;(?=\s*(?:--|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|$))/i)
              .map(s => s.trim())
              .filter(s => s.length > 0 && !s.startsWith('--'));
            
            for (const statement of statements) {
              if (statement.length > 0) {
                try {
                  // For CONCURRENTLY operations, we need to run outside of a transaction
                  if (statement.toUpperCase().includes('CONCURRENTLY')) {
                    await context.sequelize.query(statement, { raw: true });
                  } else {
                    await context.queryInterface.sequelize.query(statement);
                  }
                } catch (err: any) {
                  // Ignore "already exists" errors for CREATE INDEX IF NOT EXISTS
                  if (err.message?.includes('already exists')) {
                    console.log(`[Migrations] Index already exists, skipping: ${statement.substring(0, 80)}...`);
                  } else {
                    throw err;
                  }
                }
              }
            }
          },
          down: async () => {
            // SQL migrations typically don't have down migrations
            // For rollback support, create separate rollback files
            console.warn(`[Migrations] Rollback not supported for SQL migration: ${name}`);
          },
        };
      },
    },
    context: {
      queryInterface: sequelize.getQueryInterface(),
      sequelize,
    },
    storage: new SequelizeStorage({ sequelize }),
    logger: {
      info: (message) => console.log(`[Migrations] ${message.event}: ${message.name || ''}`),
      warn: (message) => console.warn(`[Migrations] WARNING: ${JSON.stringify(message)}`),
      error: (message) => console.error(`[Migrations] ERROR: ${JSON.stringify(message)}`),
      debug: () => {}, // Suppress debug logs
    },
  });
}

/**
 * Run all pending migrations
 */
export async function runMigrations(sequelize: Sequelize): Promise<void> {
  console.log('[Migrations] Checking for pending migrations...');
  
  const migrator = createMigrator(sequelize);
  
  try {
    const pending = await migrator.pending();
    
    if (pending.length === 0) {
      console.log('[Migrations] No pending migrations');
      return;
    }
    
    console.log(`[Migrations] Found ${pending.length} pending migrations:`);
    pending.forEach(m => console.log(`  - ${m.name}`));
    
    const executed = await migrator.up();
    
    console.log(`[Migrations] Executed ${executed.length} migrations:`);
    executed.forEach(m => console.log(`  ✓ ${m.name}`));
  } catch (error) {
    console.error('[Migrations] Migration failed:', error);
    throw error;
  }
}

/**
 * Get list of pending migrations
 */
export async function getPendingMigrations(sequelize: Sequelize): Promise<string[]> {
  const migrator = createMigrator(sequelize);
  const pending = await migrator.pending();
  return pending.map(m => m.name);
}

/**
 * Get list of executed migrations
 */
export async function getExecutedMigrations(sequelize: Sequelize): Promise<string[]> {
  const migrator = createMigrator(sequelize);
  const executed = await migrator.executed();
  return executed.map(m => m.name);
}
