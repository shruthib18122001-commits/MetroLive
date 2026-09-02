/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { devApiPlugin } from './vite.dev-api';

export default defineConfig({
  plugins: [react(), devApiPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'api/**/*.{test,spec}.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
