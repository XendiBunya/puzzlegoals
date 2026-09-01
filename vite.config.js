import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

function gitHash() {
  // Railway sets RAILWAY_GIT_COMMIT_SHA; fall back to local git
  if (process.env.RAILWAY_GIT_COMMIT_SHA) return process.env.RAILWAY_GIT_COMMIT_SHA.slice(0, 7);
  try { return execSync('git rev-parse --short HEAD').toString().trim(); }
  catch { return 'unknown'; }
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  const buildInfo = { commit: gitHash(), built: new Date().toISOString() };

  return {
    plugins: [react()],
    base: './',
    define: {
      'import.meta.env.VITE_NEON_AUTH_URL': JSON.stringify(env.VITE_NEON_AUTH_URL),
      '__BUILD_INFO__': JSON.stringify(buildInfo),
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
