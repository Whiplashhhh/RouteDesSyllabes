import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Configuration Vite : en développement, les appels /api sont relayés vers le serveur Fastify.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    fs: { allow: ['..'] },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // En développement seulement : le serveur vérifie que l'en-tête Origin
        // correspond à son propre hôte (protection CSRF).
        configure: (proxy) => {
          proxy.on('proxyReq', (requete) => {
            if (requete.getHeader('origin')) requete.setHeader('origin', 'http://localhost:3000');
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
