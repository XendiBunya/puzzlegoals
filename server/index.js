import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import 'dotenv/config';

import goals from './routes/goals.js';
import images from './routes/images.js';

const app = new Hono();

app.use('*', logger());

app.route('/api/goals', goals);
app.route('/api/images', images);

app.get('/api/health', (c) => c.json({ ok: true }));

const port = process.env.PORT || 3001;
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});
