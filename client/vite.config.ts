import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, '../server/public'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'hls': ['hls.js'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query': ['@tanstack/react-query'],
        },
      },
    },
  },
});
