/**
 * Metro configuration for React Native in a pnpm monorepo
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Set up module resolution for pnpm monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Block React from other workspace packages to prevent duplicates
config.resolver.blockList = [
  /frontend\/node_modules\/react\/.*/,
  /backend\/node_modules\/react\/.*/,
  /common\/node_modules\/react\/.*/,
  /infra\/node_modules\/react\/.*/,
];

module.exports = config;
