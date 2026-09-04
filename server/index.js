import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

import goals from './routes/goals.js';
import images from './routes/images.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, '..', 'dist');

// API app — handles all /api/* routes
const api = new Hono();
api.route('/goals', goals);
api.route('/images', images);
const startedAt = new Date().toISOString();
let gitCommit = 'unknown';
try { gitCommit = execSync('git rev-parse --short HEAD').toString().trim(); } catch {}
api.get('/health', (c) => c.json({ ok: true, commit: gitCommit, started: startedAt }));

// Main app
const app = new Hono();

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error('[Error]', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

app.use('*', secureHeaders());
app.use('*', logger());
app.use('/api/*', bodyLimit({
  maxSize: 10 * 1024 * 1024,
  onError: (c) => c.json({ error: 'Payload Too Large' }, 413),
}));

// Mount API — this MUST match before static files
app.route('/api', api);

// Serve static files from dist/ in production
if (existsSync(distPath)) {
  app.use('/assets/*', serveStatic({ root: distPath, rewriteRequestPath: (p) => p }));

  // Serve static HTML pages (e.g. faq.html)
  app.get('/faq', (c) => {
    const faqPath = join(distPath, 'faq.html');
    if (existsSync(faqPath)) return c.html(readFileSync(faqPath, 'utf8'));
    return c.notFound();
  });

  const indexHtml = readFileSync(join(distPath, 'index.html'), 'utf8');
  app.get('*', (c) => c.html(indexHtml));
}

const port = process.env.PORT || 3001;
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});
