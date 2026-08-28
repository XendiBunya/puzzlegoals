import { Hono } from 'hono';
import sql from '../db.js';
import { session } from '../middleware/session.js';
import { reducer } from '../../src/lib/goal.js';

const goals = new Hono();
goals.use('*', session);

// List goals (active or archived)
goals.get('/', async (c) => {
  const user = c.get('user');
  const archived = c.req.query('archived') === 'true';

  const rows = archived
    ? await sql`
        SELECT id, name, img_url, cols, rows, seed, tasks, archived_at, created_at, updated_at
        FROM goals WHERE user_id = ${user.id} AND archived_at IS NOT NULL
        ORDER BY archived_at DESC
      `
    : await sql`
        SELECT id, name, img_url, cols, rows, seed, tasks, archived_at, created_at, updated_at
        FROM goals WHERE user_id = ${user.id} AND archived_at IS NULL
        ORDER BY updated_at DESC
      `;

  const summaries = rows.map((r) => ({
    id: r.id,
    name: r.name,
    img_url: r.img_url,
    cols: r.cols,
    rows: r.rows,
    pieces: r.cols * r.rows,
    placed: (r.tasks || []).filter((t) => t.done).length,
    totalSteps: (r.tasks || []).length,
    doneSteps: (r.tasks || []).filter((t) => t.done).length,
    archived_at: r.archived_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  return c.json({ goals: summaries });
});

// Create goal
goals.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name, img_url, cols, rows, seed, start_hint, tasks, schema_ver } = body;

  if (!name || !img_url || !cols || !rows || !tasks) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const [row] = await sql`
    INSERT INTO goals (user_id, name, img_url, cols, rows, seed, start_hint, tasks, schema_ver)
    VALUES (${user.id}, ${name}, ${img_url}, ${cols}, ${rows}, ${seed}, ${JSON.stringify(start_hint)}, ${JSON.stringify(tasks)}, ${schema_ver || 1})
    RETURNING *
  `;

  return c.json({ goal: rowToGoal(row) }, 201);
});

// Get single goal
goals.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const rows = await sql`SELECT * FROM goals WHERE id = ${id} AND user_id = ${user.id}`;
  if (!rows.length) return c.json({ error: 'Not found' }, 404);

  return c.json({ goal: rowToGoal(rows[0]) });
});

// Patch goal (apply a reducer action)
goals.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const action = await c.req.json();

  const rows = await sql`SELECT * FROM goals WHERE id = ${id} AND user_id = ${user.id}`;
  if (!rows.length) return c.json({ error: 'Not found' }, 404);

  const current = rowToGoal(rows[0]);
  const next = reducer(current, action);

  if (!next) return c.json({ error: 'Invalid action' }, 400);

  await sql`
    UPDATE goals SET
      name = ${next.name},
      img_url = ${next.img},
      cols = ${next.cols},
      rows = ${next.rows},
      seed = ${next.seed},
      start_hint = ${JSON.stringify(next.startHint)},
      tasks = ${JSON.stringify(next.tasks)},
      schema_ver = ${next.schema || 1},
      updated_at = now()
    WHERE id = ${id} AND user_id = ${user.id}
  `;

  return c.json({ goal: next });
});

// Delete goal
goals.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const result = await sql`DELETE FROM goals WHERE id = ${id} AND user_id = ${user.id} RETURNING id`;
  if (!result.length) return c.json({ error: 'Not found' }, 404);
  return c.body(null, 204);
});

// Archive
goals.post('/:id/archive', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const rows = await sql`
    UPDATE goals SET archived_at = now(), updated_at = now()
    WHERE id = ${id} AND user_id = ${user.id} AND archived_at IS NULL
    RETURNING *
  `;
  if (!rows.length) return c.json({ error: 'Not found or already archived' }, 404);
  return c.json({ goal: rowToGoal(rows[0]) });
});

// Unarchive
goals.post('/:id/unarchive', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const rows = await sql`
    UPDATE goals SET archived_at = NULL, updated_at = now()
    WHERE id = ${id} AND user_id = ${user.id} AND archived_at IS NOT NULL
    RETURNING *
  `;
  if (!rows.length) return c.json({ error: 'Not found or not archived' }, 404);
  return c.json({ goal: rowToGoal(rows[0]) });
});

/** Map a DB row to the goal shape the client expects */
function rowToGoal(r) {
  return {
    id: r.id,
    schema: r.schema_ver,
    name: r.name,
    img: r.img_url,
    cols: r.cols,
    rows: r.rows,
    seed: Number(r.seed),
    startHint: r.start_hint,
    tasks: r.tasks || [],
    archived_at: r.archived_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export default goals;
