import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { bodyLimit } from 'hono/body-limit';
import { existsSync, readFileSync } from 'fs';
import 'dotenv/config';

import goals from './routes/goals.js';
import images from './routes/images.js';

const app = new Hono();

app.use('*', secureHeaders());
app.use('*', logger());
app.use('/api/*', bodyLimit({
  maxSize: 10 * 1024 * 1024, // 10MB limit
  onError: (c) => c.json({ error: 'Payload Too Large' }, 413)
}));

// API routes
app.route('/api/goals', goals);
app.route('/api/images', images);
app.get('/api/health', (c) => c.json({ ok: true }));

// Serve static files from dist/ in production (exclude /api paths)
if (existsSync('dist')) {
  app.use('*', async (c, next) => {
    if (c.req.path.startsWith('/api')) return next();
    return serveStatic({ root: './dist' })(c, next);
  });

  // Fallback to index.html for client-side routing (not API)
  const indexHtml = readFileSync('dist/index.html', 'utf8');
  app.get('*', (c) => {
    if (c.req.path.startsWith('/api')) return c.json({ error: 'Not found' }, 404);
    return c.html(indexHtml);
  });
}

const port = process.env.PORT || 3001;
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});
