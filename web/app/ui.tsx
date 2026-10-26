import type { ReactNode } from 'react';

// Presentation helpers only: formatting and layout, no business logic.

export const usd = (n: number) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
export const rate = (n: number) => `${Number(n).toFixed(2)}%`;
export const when = (timestamp: string) => timestamp.replace(/^(\d{4}-\d{2}-\d{2})T/, '$1 ').slice(0, 16);

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const param = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Success / error banner from the ?ok= and ?error= query params set by server actions. */
export async function Flash({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const ok = param(query.ok);
  const error = param(query.error);
  if (error) return <p className="flash error" role="alert">{error}</p>;
  if (ok) return <p className="flash ok" role="status">{ok}</p>;
  return null;
}

export type Column<T> = { label: string; render: (row: T) => ReactNode; numeric?: boolean };

export function Table<T>({ columns, rows, empty }: { columns: Column<T>[]; rows: T[]; empty: string }) {
  if (rows.length === 0) return <p className="muted">{empty}</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c.label} className={c.numeric ? 'num' : undefined}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => <td key={c.label} className={c.numeric ? 'num' : undefined}>{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Loading() {
  return <p className="muted">Loading…</p>;
}
