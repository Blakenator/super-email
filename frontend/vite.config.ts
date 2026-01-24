import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';

/**
 * Find a package directory in the pnpm store by matching a prefix pattern.
 * This handles version differences across different machines/lockfiles.
 */
function findPnpmPackage(
  nodeModulesPath: string,
  packagePrefix: string,
): string | null {
  const pnpmPath = path.join(nodeModulesPath, '.pnpm');
  if (!fs.existsSync(pnpmPath)) {
    return null;
  }

  const dirs = fs.readdirSync(pnpmPath);
  // Match directories that start with the package prefix followed by @version
  const matchingDir = dirs.find(
    (dir) => dir === packagePrefix || dir.startsWith(`${packagePrefix}@`),
  );

  if (matchingDir) {
    // Extract the actual package name (e.g., "react" from "react@19.2.3")
    const packageName = packagePrefix.split('@')[0] || packagePrefix;
    const fullPath = path.join(
      pnpmPath,
      matchingDir,
      'node_modules',
      packageName,
    );
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

// Find React packages dynamically to handle version differences across machines
const rootNodeModules = path.resolve(__dirname, '../node_modules');
const reactPath = findPnpmPackage(rootNodeModules, 'react');
const reactDomPath = findPnpmPackage(rootNodeModules, 'react-dom');

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192x192.svg', 'icon-512x512.svg'],
      manifest: {
        name: 'SuperMail - Email Client',
        short_name: 'SuperMail',
        description:
          'A modern email client for managing all your email accounts',
        theme_color: '#5c6bc0',
        background_color: '#f8f9fa',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Runtime caching for API calls
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // Skip injecting Firefox-specific features to avoid Babel plugin issues
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false, // Disable in dev to avoid Babel issues, enable in production only
      },
    }),
  ],
  resolve: {
    alias: {
      '@graphql-typed-document-node/core': path.resolve(
        __dirname,
        'src/graphql-typed-document-shim.ts',
      ),
      // Resolve @main/common from source for Vite
      '@main/common': path.resolve(__dirname, '../common/src/index.ts'),
      // Force Vite to use a single React instance from pnpm store to avoid conflicts
      // Paths are resolved dynamically to handle version differences across machines
      ...(reactPath && { react: reactPath }),
      ...(reactDomPath && { 'react-dom': reactDomPath }),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      },
    },
  },
});
