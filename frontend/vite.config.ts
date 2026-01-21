import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192x192.svg', 'icon-512x512.svg'],
      manifest: {
        name: 'StacksMail - Email Client',
        short_name: 'StacksMail',
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
      react: path.resolve(
        __dirname,
        '../node_modules/.pnpm/react@19.2.3/node_modules/react',
      ),
      'react-dom': path.resolve(
        __dirname,
        '../node_modules/.pnpm/react-dom@19.2.3_react@19.2.3/node_modules/react-dom',
      ),
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
