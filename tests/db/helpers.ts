import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SUPABASE_DIR = join(import.meta.dirname, '..', '..', 'supabase');

/**
 * An in-process PostgreSQL database (PGlite) with every migration in
 * supabase/migrations applied in filename order, optionally plus seed.sql.
 * Mirrors what `supabase db reset` does, without needing Docker.
 */
export async function createDatabase({ seed = false } = {}): Promise<PGlite> {
  const db = new PGlite();
  const migrationsDir = join(SUPABASE_DIR, 'migrations');
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
  }
  if (seed) await db.exec(readFileSync(join(SUPABASE_DIR, 'seed.sql'), 'utf8'));
  return db;
}

/** Run `fn` inside a transaction that is always rolled back. */
export async function rollback<T>(db: PGlite, fn: () => Promise<T>): Promise<T> {
  await db.exec('begin');
  try {
    return await fn();
  } finally {
    await db.exec('rollback');
  }
}

export const num = (v: unknown) => Number(v);
