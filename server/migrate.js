import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sql from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ddl = readFileSync(join(__dirname, 'migrate.sql'), 'utf8');

// Split on semicolons and run each statement
const statements = ddl
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  await sql.query(stmt);
}

console.log(`Ran ${statements.length} statements — schema is up to date.`);
