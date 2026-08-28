import { Hono } from 'hono';
import sql from '../db.js';
import { session } from '../middleware/session.js';

const images = new Hono();

// Upload requires auth
images.post('/', session, async (c) => {
  const user = c.get('user');
  const contentType = c.req.header('content-type') || '';

  let data, mime;

  if (contentType.includes('multipart/form-data')) {
    const form = await c.req.formData();
    const file = form.get('file');
    if (!file) return c.json({ error: 'No file provided' }, 400);
    if (file.size > 5 * 1024 * 1024) return c.json({ error: 'File too large (5 MB max)' }, 413);
    data = Buffer.from(await file.arrayBuffer());
    mime = file.type || 'image/jpeg';
  } else {
    // Accept raw binary with content-type header
    const body = await c.req.arrayBuffer();
    if (body.byteLength > 5 * 1024 * 1024) return c.json({ error: 'File too large (5 MB max)' }, 413);
    data = Buffer.from(body);
    mime = contentType.split(';')[0] || 'image/jpeg';
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(mime)) {
    return c.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.' }, 400);
  }

  const [row] = await sql`
    INSERT INTO images (user_id, data, content_type) VALUES (${user.id}, ${data}, ${mime})
    RETURNING id
  `;

  return c.json({ url: `/api/images/${row.id}` }, 201);
});

// Serve image (public — no auth needed, images are accessed by URL in goal data)
images.get('/:id', async (c) => {
  const id = c.req.param('id');
  const rows = await sql`SELECT data, content_type FROM images WHERE id = ${id}`;
  if (!rows.length) return c.json({ error: 'Not found' }, 404);

  const img = rows[0];
  c.header('content-type', img.content_type);
  c.header('cache-control', 'public, max-age=31536000, immutable');
  return c.body(img.data);
});

export default images;
