import Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export function runMigrations(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT    PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000)
    )
  `);

  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const version = file.replace('.sql', '');
    const already = sqlite.prepare('SELECT 1 FROM schema_migrations WHERE version = ?').get(version);
    if (!already) {
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      sqlite.exec(sql);
      sqlite.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(version);
      console.log(`Applied migration: ${file}`);
    }
  }
}

// CLI entry point: tsx server/src/db/migrate.ts
if (require.main === module) {
  const { sqlite } = require('../db/client');
  runMigrations(sqlite);
  console.log('Migrations complete.');
  process.exit(0);
}
