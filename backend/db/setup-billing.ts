import { sequelize } from './database.js';
import { logger } from '../helpers/logger.js';

/**
 * Drop the old materialized view if it exists.
 * We now use the user_usages table instead.
 */
export async function dropBillingMaterializedView(): Promise<void> {
  try {
    await sequelize.query('DROP MATERIALIZED VIEW IF EXISTS user_storage_usage');
    logger.info('Billing DB', 'Cleaned up old materialized view (if existed)');
  } catch (error) {
    // Ignore errors - the view might not exist
    logger.debug('Billing DB', 'Materialized view cleanup:', error);
  }
}

/**
 * Set up billing-related database objects.
 * The user_usages table is now managed by Sequelize, so this is mainly for cleanup.
 */
export async function setupBillingDatabase(): Promise<void> {
  logger.info('Billing DB', 'Setting up billing database...');

  // Drop old materialized view if it exists (we now use a table)
  await dropBillingMaterializedView();

  logger.info('Billing DB', 'Billing database setup complete');
}
