import { Hono } from 'hono';
import sql from '../db.js';
import { session } from '../middleware/session.js';

const templates = new Hono();
templates.use('*', session);

templates.get('/', async (c) => {
  const user = c.get('user');
  const rows = await sql`
    SELECT id, name, steps, created_at, updated_at
    FROM templates WHERE user_id = ${user.id}
    ORDER BY updated_at DESC
  `;
  return c.json({ templates: rows });
});

templates.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const rows = await sql`SELECT * FROM templates WHERE id = ${id} AND user_id = ${user.id}`;
  if (!rows.length) return c.json({ error: 'Not found' }, 404);
  return c.json({ template: rows[0] });
});

templates.post('/', async (c) => {
  const user = c.get('user');
  const { name, steps } = await c.req.json();
  if (!name || !steps?.length) return c.json({ error: 'Name and steps are required' }, 400);
  if (name.length > 256) return c.json({ error: 'Name must be 256 characters or fewer' }, 400);

  const [row] = await sql`
    INSERT INTO templates (user_id, name, steps)
    VALUES (${user.id}, ${name}, ${JSON.stringify(steps)})
    RETURNING *
  `;
  return c.json({ template: row }, 201);
});

templates.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const { name, steps } = await c.req.json();
  if (!name || !steps?.length) return c.json({ error: 'Name and steps are required' }, 400);
  if (name.length > 256) return c.json({ error: 'Name must be 256 characters or fewer' }, 400);

  const rows = await sql`
    UPDATE templates SET name = ${name}, steps = ${JSON.stringify(steps)}, updated_at = now()
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING *
  `;
  if (!rows.length) return c.json({ error: 'Not found' }, 404);
  return c.json({ template: rows[0] });
});

templates.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const result = await sql`DELETE FROM templates WHERE id = ${id} AND user_id = ${user.id} RETURNING id`;
  if (!result.length) return c.json({ error: 'Not found' }, 404);
  return c.body(null, 204);
});

export default templates;
