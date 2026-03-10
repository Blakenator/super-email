import { createRequire } from 'module';
import { makeQuery } from '../../types.js';

const require = createRequire(import.meta.url);
const pkg = require('../../../package.json') as { version: string };

const startTime = Date.now();

export const healthCheck = makeQuery(
  'healthCheck',
  async () => ({
    status: 'ok',
    version: pkg.version,
    timestamp: new Date().toISOString(),
    uptimeSeconds: (Date.now() - startTime) / 1000,
  }),
);
