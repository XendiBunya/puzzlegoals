import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load .env files AND merge with process.env (for Railway/CI where vars are real env vars)
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };

  return {
    plugins: [react()],
    base: './',
    define: {
      'import.meta.env.VITE_NEON_AUTH_URL': JSON.stringify(env.VITE_NEON_AUTH_URL),
    },
    test: { environment: 'node', include: ['src/**/*.test.js'] },
    server: {
      port: 5180,
      host: true,
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
  };
});
