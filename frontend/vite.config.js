import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // leaflet and leaflet.heat are loaded from CDN in index.html
  // so exclude them from Vite's bundling entirely
  optimizeDeps: {
    exclude: ['leaflet', 'leaflet.heat'],
  },
  build: {
    rollupOptions: {
      external: ['leaflet', 'leaflet.heat'],
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
