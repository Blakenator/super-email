/**
 * Package-level constants. Lives at backend/ so `import.meta.url` resolves to the
 * same directory as package.json for tsx; compiled output is dist/, so we strip that.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to @main/backend (directory containing this package's package.json). */
export const BACKEND_PACKAGE_ROOT =
  path.basename(__dirname) === 'dist'
    ? path.resolve(__dirname, '..')
    : __dirname;
