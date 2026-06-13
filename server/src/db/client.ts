import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import * as schema from './schema';
import { DB_PATH } from '../config';
import { runMigrations } from './migrate';

mkdirSync(dirname(DB_PATH), { recursive: true });

const rawDb = new BetterSqlite3(DB_PATH);
rawDb.pragma('journal_mode = WAL');
rawDb.pragma('foreign_keys = ON');
rawDb.pragma('busy_timeout = 5000');

runMigrations(rawDb);

export const sqlite: BetterSqlite3.Database = rawDb;
export const db = drizzle(rawDb, { schema });
