import { sequelize } from './database.js';
import { logger } from '../helpers/logger.js';
import { QueryTypes } from 'sequelize';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Set up billing-related database objects
 * Creates the materialized view for usage tracking
 */
export async function setupBillingDatabase(): Promise<void> {
  logger.info('Billing DB', 'Setting up billing database objects...');

  try {
    // Read and execute the SQL migration for the materialized view
    const sqlPath = path.join(__dirname, 'migrations', 'create-billing-views.sql');
    
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      
      // Execute the SQL statements
      await sequelize.query(sql);
      
      logger.info('Billing DB', 'Materialized view created/updated successfully');
    } else {
      logger.warn('Billing DB', `Migration file not found: ${sqlPath}`);
    }
  } catch (error) {
    // Log but don't fail - this might run multiple times
    if (error instanceof Error && error.message.includes('already exists')) {
      logger.info('Billing DB', 'Billing database objects already exist');
    } else {
      logger.error('Billing DB', 'Failed to set up billing database:', error);
      throw error;
    }
  }
}

/**
 * Check if the materialized view exists
 */
export async function checkMaterializedViewExists(): Promise<boolean> {
  try {
    const result = await sequelize.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'user_storage_usage'
      ) as exists`,
      { type: QueryTypes.SELECT },
    );
    return (result[0] as any)?.exists ?? false;
  } catch {
    return false;
  }
}
