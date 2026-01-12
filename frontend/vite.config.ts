import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@graphql-typed-document-node/core': path.resolve(
        __dirname,
        'src/graphql-typed-document-shim.ts',
      ),
    },
  },
  server: {
    proxy: {
      '/api/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
