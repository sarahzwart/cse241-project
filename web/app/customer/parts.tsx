import type { Account, CreditCard, DebitCard } from '@/lib/bank';
import { Table, rate, usd } from '../ui';

// Tables shared by several customer pages (the original printAccounts /
// showCardInformation output).

export function AccountsTable({ accounts }: { accounts: Account[] }) {
  return (
    <Table
      rows={accounts}
      empty="You do not have any accounts yet."
      columns={[
        { label: 'Account ID', render: (a) => a.account_id },
        { label: 'Type', render: (a) => a.account_type },
        { label: 'Balance', render: (a) => usd(a.balance), numeric: true },
        { label: 'Interest', render: (a) => rate(a.interest_rate), numeric: true },
        {
          label: 'Minimum / penalty',
          render: (a) => (a.minimum_balance === undefined ? '—' : `${usd(a.minimum_balance)} / ${usd(a.penalty ?? 0)}`),
        },
      ]}
    />
  );
}

export function CardsTables({ debit, credit }: { debit: DebitCard[]; credit: CreditCard[] }) {
  return (
    <>
      <h2>Debit cards</h2>
      <Table
        rows={debit}
        empty="No debit cards."
        columns={[
          { label: 'Card ID', render: (c) => c.card_id },
          { label: 'Linked account', render: (c) => c.account_id },
          { label: 'Account balance', render: (c) => usd(c.balance), numeric: true },
        ]}
      />
      <h2>Credit cards</h2>
      <Table
        rows={credit}
        empty="No credit cards."
        columns={[
          { label: 'Card ID', render: (c) => c.card_id },
          { label: 'Interest', render: (c) => rate(c.interest_rate), numeric: true },
          { label: 'Limit', render: (c) => usd(c.limit), numeric: true },
          { label: 'Running balance', render: (c) => usd(c.running_balance), numeric: true },
          { label: 'Balance due', render: (c) => usd(c.balance_due), numeric: true },
        ]}
      />
    </>
  );
}
