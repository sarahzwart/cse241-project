// Read-only verification of the hosted Supabase database against the locally
// tested schema + seed (PGlite). Checks that:
//   1. every table's contents are identical (row count + md5 of ordered rows)
//   2. row level security is enabled on every table
//   3. the public anon key cannot read table data through the REST API
//
// Usage: npm run verify:remote   (needs SUPABASE_ACCESS_TOKEN in .env.local
// and a linked project in supabase/.temp/project-ref)

import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const file = join(ROOT, '.env.local');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const token = process.env.SUPABASE_ACCESS_TOKEN;
const refFile = join(ROOT, 'supabase', '.temp', 'project-ref');
const ref = process.env.SUPABASE_PROJECT_REF ?? (existsSync(refFile) ? readFileSync(refFile, 'utf8').trim() : null);
if (!token || !ref) {
  console.error('Missing SUPABASE_ACCESS_TOKEN or linked project ref (run `npx supabase link`).');
  process.exit(1);
}

const api = async (path, init = {}) => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
};
const remoteQuery = (query) => api('/database/query', { method: 'POST', body: JSON.stringify({ query, read_only: true }) });

// Primary key ordering so both sides hash rows in the same order.
const TABLES = {
  customer: 'customer_id', branch: 'branch_id', account: 'account_id', checking: 'account_id',
  savings: 'account_id', account_ownership: 'account_id, customer_id', card: 'card_id', credit: 'card_id',
  debit: 'card_id', vendor: 'vendor_id', purchase: 'purchase_id', loan: 'loan_id', transaction: 'transaction_id',
};
const fingerprintSql = Object.entries(TABLES)
  .map(([t, pk]) => `select '${t}' as table_name, count(*)::int as n, md5(coalesce(string_agg(x::text, '|' order by ${pk}), '')) as hash from ${t} x`)
  .join('\nunion all\n');

// Local reference: migrations + seed in PGlite, exactly as the test suite does.
const local = new PGlite();
const migrationsDir = join(ROOT, 'supabase', 'migrations');
for (const f of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
  await local.exec(readFileSync(join(migrationsDir, f), 'utf8'));
}
await local.exec(readFileSync(join(ROOT, 'supabase', 'seed.sql'), 'utf8'));
const expected = Object.fromEntries((await local.query(fingerprintSql)).rows.map((r) => [r.table_name, r]));

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

console.log(`Verifying project ${ref}\n`);

const remote = await remoteQuery(fingerprintSql);
for (const r of remote) {
  const e = expected[r.table_name];
  check(r.n === e.n && r.hash === e.hash, `data matches seed: ${r.table_name}`, `${r.n} rows`);
}

const rls = await remoteQuery(`
  select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' order by 1`);
const unprotected = rls.filter((r) => !r.relrowsecurity).map((r) => r.relname);
check(rls.length === 13 && unprotected.length === 0, 'RLS enabled on all 13 tables', unprotected.join(', '));

// Business functions (migration 20261026000004) are callable by the server's
// service role only - never by the public anon or authenticated roles.
const OPERATIONS = ['deposit(text,text,text,numeric)', 'withdraw(text,text,text,numeric,boolean)',
  'open_account(text,text,numeric)', 'open_credit_card(text,numeric)', 'open_debit_card(text,text)',
  'take_loan(text,text,numeric)', 'pay_loan(text,text,text,numeric)', 'purchase(text,text,text,numeric)'];
const grants = await remoteQuery(OPERATIONS.map((f) => `select '${f}' fn,
  has_function_privilege('anon', '${f}', 'execute') or has_function_privilege('authenticated', '${f}', 'execute') public_access,
  has_function_privilege('service_role', '${f}', 'execute') service_access`).join(' union all '));
const exposed = grants.filter((g) => g.public_access || !g.service_access).map((g) => g.fn);
check(grants.length === OPERATIONS.length && exposed.length === 0, 'business functions executable by service role only', exposed.join(', '));

const keys = await api('/api-keys');
const anon = keys.find((k) => k.name === 'anon')?.api_key;
if (!anon) {
  check(false, 'anon key found');
} else {
  const res = await fetch(`https://${ref}.supabase.co/rest/v1/customer?select=customer_id&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  const body = await res.json().catch(() => null);
  const blocked = !res.ok || (Array.isArray(body) && body.length === 0);
  check(blocked, 'anon REST API cannot read customer data', `HTTP ${res.status}`);
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
