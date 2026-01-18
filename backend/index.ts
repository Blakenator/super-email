/**
 * Email Client API Server
 * 
 * This is the main entry point for the backend server.
 * Uses the server factory for actual implementation.
 */

import { createServer } from './server.js';

// Log startup immediately so we know the server is restarting
console.log('\n====================================');
console.log('🔄 Email Client API Starting...');
console.log(`⏰ ${new Date().toISOString()}`);
console.log('====================================\n');

// Create and start the server with default dependencies
const server = await createServer();
await server.start();
