import Link from 'next/link';
import { Suspense } from 'react';
import { EMPLOYEE_VIEWS, listForEmployee, type EmployeeView } from '@/lib/bank';
import { Loading, Table, param } from '../ui';

// Employee actions (App.java:418-450): read-only views of every table.
export default function EmployeePage(props: PageProps<'/employee'>) {
  return (
    <>
      <h1>Employee view</h1>
      <Suspense fallback={<Loading />}>
        <EmployeeTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function EmployeeTable({ searchParams }: { searchParams: PageProps<'/employee'>['searchParams'] }) {
  const requested = param((await searchParams).view);
  const view: EmployeeView = requested && requested in EMPLOYEE_VIEWS ? (requested as EmployeeView) : 'customers';
  const rows = await listForEmployee(view);
  const columns = Object.keys(rows[0] ?? {}).map((key) => ({
    label: key,
    numeric: typeof rows[0]?.[key] === 'number',
    render: (row: Record<string, unknown>) => {
      const value = row[key];
      if (value === null || value === undefined) return '—';
      // Only reformat ISO timestamps (2025-11-05T11:38:30) - IDs like T00001 also contain a "T".
      return typeof value === 'number' ? value.toFixed(2) : String(value).replace(/^(\d{4}-\d{2}-\d{2})T/, '$1 ');
    },
  }));

  return (
    <>
      <nav className="tabs" aria-label="Tables">
        {(Object.keys(EMPLOYEE_VIEWS) as EmployeeView[]).map((key) => (
          <Link key={key} href={`/employee?view=${key}`} aria-current={key === view ? 'page' : undefined}>
            {EMPLOYEE_VIEWS[key].title}
          </Link>
        ))}
      </nav>
      <p className="muted">{rows.length} rows</p>
      <Table columns={columns} rows={rows} empty="No rows." />
    </>
  );
}
