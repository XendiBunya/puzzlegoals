import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // Ensure VITE_NEON_AUTH_URL is inlined at build time even on Railway/CI
  define: {
    'import.meta.env.VITE_NEON_AUTH_URL': JSON.stringify(process.env.VITE_NEON_AUTH_URL),
  },
  test: { environment: 'node', include: ['src/**/*.test.js'] },
  server: {
    port: 5180,
    host: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
