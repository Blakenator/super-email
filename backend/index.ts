/**
 * Email Client API Server
 *
 * This is the main entry point for the backend server.
 * Uses the server factory for actual implementation.
 */

import { createServer } from './server.js';
import { logger } from './helpers/logger.js';

// Catch anything that slips past try/catch blocks so it surfaces in CloudWatch
// rather than silently killing the process or hanging the event loop.
process.on('uncaughtException', (err) => {
  logger.error('Process', 'Uncaught exception — process will exit', {
    error: err.message,
    stack: err.stack,
  });
  // Give the logger a tick to flush before exiting so the log line is shipped.
  setImmediate(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  logger.error('Process', 'Unhandled promise rejection', { error: message, stack });
});

// Log startup immediately so we know the server is restarting
console.log('\n====================================');
console.log('🔄 Email Client API Starting...');
console.log(`⏰ ${new Date().toISOString()}`);
console.log('====================================\n');
logger.info('Process', `Starting — node ${process.version} env=${process.env.NODE_ENV} pid=${process.pid}`);

// Create and start the server with default dependencies
const server = await createServer();
await server.start();
