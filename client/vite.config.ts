import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration Vite : en développement, les appels /api sont relayés vers le serveur Fastify.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    fs: { allow: ['..'] },
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', '../shared/**/*.test.ts'],
  },
});
