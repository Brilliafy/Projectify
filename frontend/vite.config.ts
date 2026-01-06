import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow the Docker container to access this dev server
    allowedHosts: ['host.docker.internal', 'localhost','127.0.0.1'],
    host: true, // This is effectively 0.0.0.0, ensures it listens on all interfaces
    port: 5173
  }
})