import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['host.docker.internal', 'localhost', '127.0.0.1'],
    proxy: {
      '/api/users': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/teams': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/api/tasks': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
      '/api/notifications': {
        target: 'http://localhost:3004',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3004',
        ws: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'tiptap-vendor': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-underline',
          ],
          'charts-vendor': ['recharts'],
          'icons-vendor': ['lucide-react'],
        },
      },
    },
  },
});