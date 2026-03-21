/**
 * Filesystem helpers for local data and shared monorepo files.
 * Anchored at BACKEND_PACKAGE_ROOT — never process.cwd().
 */

import path from 'path';
import { BACKEND_PACKAGE_ROOT } from '../constants.js';

/**
 * Resolve a path under the backend package. Absolute `relativeOrAbsolute` is returned unchanged.
 */
export function resolveBackendDataPath(relativeOrAbsolute: string): string {
  if (path.isAbsolute(relativeOrAbsolute)) return relativeOrAbsolute;
  return path.resolve(BACKEND_PACKAGE_ROOT, relativeOrAbsolute);
}

/** Monorepo GraphQL schema (sibling of backend/). */
export const GRAPHQL_SCHEMA_PATH = path.join(
  BACKEND_PACKAGE_ROOT,
  '..',
  'common',
  'schema.graphql',
);
