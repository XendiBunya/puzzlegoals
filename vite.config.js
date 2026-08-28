import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  test: { environment: 'node', include: ['src/**/*.test.js'] },
  server: {
    port: 5180,
    host: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
