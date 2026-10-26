// Generates supabase/seed.sql: realistic, deterministic demo data for NSL Bank.
//
// Every row is produced by replaying a year of customer activity in date
// order and applying the same rules the original app enforces (App.java), so
// the final balances are ones the app itself could have produced:
//   - account creation: savings 1.25% with min-balance/penalty tiers, checking 0%
//   - deposits only at 'Full Service' branches, recorded as transactions
//   - checking withdrawals / debit purchases rejected if balance - amount <= 0
//   - savings withdrawals stay above minimum_balance and leave at least $50
//   - credit purchases rejected if amount > limit - running_balance
//   - loans priced by the amount tiers in getLoan(); payments reduce the loan
//     and the paying account, with no transaction row (as in payLoan())
//   - purchases are not recorded as transactions; balance_due is never updated
//
// Output is fully deterministic (fixed faker seed, UTC-only date math), so
// `npm run seed:check` can verify the committed seed.sql is up to date.

import { faker } from '@faker-js/faker';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

faker.seed(241);

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'seed.sql');
const START = Date.UTC(2025, 10, 1); // 2025-11-01
const END = Date.UTC(2026, 9, 24);   // 2026-10-24
const DAY = 86_400_000;

// ---------------------------------------------------------------------------
// Rules mirrored from App.java (amounts in cents)
// ---------------------------------------------------------------------------

// App.java:636-646 - tier chosen from the opening balance. Note the boundaries:
// exactly $1000.00 or $2000.00 falls through to the lowest tier.
function savingsTier(openingCents) {
  const amount = openingCents / 100;
  if (amount > 2000) return { minimum: 100_000, penalty: 5_000 };
  if (amount > 1000 && amount < 2000) return { minimum: 50_000, penalty: 5_000 };
  return { minimum: 10_000, penalty: 2_500 };
}

// App.java:312-337 - exact boundary amounts fall through to the final tier.
function loanTier(amountCents) {
  const amount = amountCents / 100;
  if (amount > 100000) return { rate: 5.0, monthly: 50_000 };
  if (amount < 100000 && amount > 50000) return { rate: 4.0, monthly: 40_000 };
  if (amount < 50000 && amount > 25000) return { rate: 3.75, monthly: 35_000 };
  if (amount < 25000 && amount > 10000) return { rate: 5.0, monthly: 25_000 };
  if (amount < 10000 && amount > 1000) return { rate: 5.0, monthly: 10_000 };
  return { rate: 6.0, monthly: 5_000 };
}

const CREDIT_INTEREST = 18.0; // Database.java:270
const SAVINGS_INTEREST = 1.25; // App.java:637
const CHECKING_INTEREST = 0;   // App.java:649
const SAVINGS_FLOOR = 5_000;   // App.java:564 - balance must stay >= $50

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const counters = {};
const nextId = (prefix) => prefix + String((counters[prefix] = (counters[prefix] ?? 0) + 1)).padStart(5, '0');

const int = (min, max) => faker.number.int({ min, max });
const cents = (minDollars, maxDollars) => int(minDollars * 100, maxDollars * 100);
const chance = (p) => faker.number.float({ min: 0, max: 1 }) < p;
const pick = (arr) => arr[int(0, arr.length - 1)];

// A timestamp on the given day between 07:00 and 21:00 UTC (stored without tz).
const timeOnDay = (dayMs) => dayMs + int(7 * 3600, 21 * 3600) * 1000;
const randomDay = (fromMs, toMs) => fromMs + int(0, Math.floor((toMs - fromMs) / DAY)) * DAY;

const pad = (n) => String(n).padStart(2, '0');
function fmtDate(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function fmtTimestamp(ms) {
  const d = new Date(ms);
  return `${fmtDate(ms)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
const money = (c) => (c / 100).toFixed(2);
const sqlStr = (s) => (s === null ? 'null' : `'${String(s).replaceAll("'", "''")}'`);

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const LEHIGH_VALLEY = [
  ['Bethlehem', ['18015', '18017', '18018', '18020']],
  ['Allentown', ['18101', '18102', '18103', '18104']],
  ['Easton', ['18042', '18045']],
  ['Whitehall', ['18052']],
  ['Emmaus', ['18049']],
  ['Nazareth', ['18064']],
  ['Hellertown', ['18055']],
  ['Macungie', ['18062']],
];

// Curated rather than faker's defaults, which read as obviously fake.
const FIRST_NAMES = [
  'James', 'Mary', 'Michael', 'Jennifer', 'David', 'Linda', 'Robert', 'Patricia', 'John', 'Elizabeth',
  'William', 'Susan', 'Richard', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Emily',
  'Matthew', 'Nancy', 'Anthony', 'Lisa', 'Mark', 'Ashley', 'Steven', 'Megan', 'Andrew', 'Rachel',
  'Joshua', 'Lauren', 'Kevin', 'Nicole', 'Brian', 'Hannah', 'Ryan', 'Olivia', 'Jacob', 'Madison',
  'Ethan', 'Sophia', 'Nathan', 'Grace', 'Tyler', 'Chloe', 'Luis', 'Maria', 'Carlos', 'Ana',
  'Wei', 'Mei', 'Raj', 'Priya', 'Omar', 'Fatima', 'Marcus', 'Aaliyah', 'Kenji', 'Yuki',
];
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson',
  'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
  'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott',
  'Kowalski', 'Nowak', 'Schmidt', 'Mueller', 'Reinhart', 'Kline', 'Fenstermacher', 'Hartzell', 'Snyder', 'Bauer',
  'Rivera', 'Torres', 'Nguyen', 'Patel', 'Chen', 'Kim', 'Okafor', 'Murphy', 'Sullivan', 'Russo',
];
const STREETS = [
  'Main St', 'Broad St', 'New St', 'Market St', 'Linden St', 'Union Blvd', 'Hamilton St', 'Tilghman St',
  'Cedar Crest Blvd', 'Walnut St', 'Chestnut St', 'Maple Ave', 'Oak St', 'Elm St', 'Church St', 'High St',
  'Center St', 'Northampton St', 'Ferry St', 'Wyandotte St', 'Fillmore St', 'Catasauqua Rd', 'Schoenersville Rd',
  'Easton Ave', 'Stefko Blvd', 'Macada Rd', 'Chew St', 'Liberty St', 'Lafayette St', 'Green Pond Rd',
];

const BRANCH_TYPES = [
  'Full Service', 'Full Service', 'ATM', 'Full Service',
  'ATM', 'Full Service', 'Full Service', 'ATM',
];

// [name, category]; category drives realistic purchase amounts.
const VENDORS = [
  ['Wegmans', 'grocery'], ['Giant', 'grocery'], ['ALDI', 'grocery'], ['Trader Joe\'s', 'grocery'],
  ['Wawa', 'gas'], ['Sheetz', 'gas'], ['Shell', 'gas'],
  ['Starbucks', 'coffee'], ['Dunkin\'', 'coffee'], ['Saxbys', 'coffee'],
  ['Chipotle', 'dining'], ['Panera Bread', 'dining'], ['Bethlehem Brew Works', 'dining'], ['Molly\'s Irish Grille', 'dining'],
  ['Target', 'retail'], ['Walmart', 'retail'], ['The Home Depot', 'retail'], ['Lowe\'s', 'retail'], ['Best Buy', 'retail'],
  ['Amazon', 'online'], ['Netflix', 'subscription'], ['Spotify', 'subscription'],
  ['PPL Electric Utilities', 'utility'], ['CVS Pharmacy', 'pharmacy'], ['Lehigh University Bookstore', 'retail'],
];

const PURCHASE_RANGE = {
  grocery: [18, 240], gas: [25, 80], coffee: [4, 16], dining: [12, 140], retail: [9, 320],
  online: [8, 260], subscription: [8, 23], utility: [70, 260], pharmacy: [6, 90],
};

// ---------------------------------------------------------------------------
// Static entities
// ---------------------------------------------------------------------------

const branches = BRANCH_TYPES.map((branch_type) => ({ branch_id: nextId('B'), branch_type }));
const fullService = branches.filter((b) => b.branch_type === 'Full Service');
const vendors = VENDORS.map(([vendor_name, category]) => ({ vendor_id: nextId('V'), vendor_name, category }));

const customers = [];
const usedNames = new Set();
function makeCustomer({ lastName, address } = {}) {
  let name;
  do {
    name = `${pick(FIRST_NAMES)} ${lastName ?? pick(LAST_NAMES)}`;
  } while (usedNames.has(name)); // login is by exact name (App.java:916), so names must be unique
  usedNames.add(name);
  const [city, zips] = pick(LEHIGH_VALLEY);
  const c = {
    customer_id: nextId('C'),
    customer_name: name,
    birthday: fmtDate(randomDay(Date.UTC(1948, 0, 1), Date.UTC(2004, 11, 31))),
    address: address ?? `${int(12, 3899)} ${pick(STREETS)}, ${city}, PA ${pick(zips)}`,
    paycheck: cents(1100, 4200),
  };
  customers.push(c);
  return c;
}

const accounts = [];
const ownership = [];
const cards = [];
const loans = [];
const events = [];

function openAccount(type, owners, dayMs, openingCents) {
  const a = {
    account_id: nextId('A'),
    account_type: type,
    balance: openingCents,
    interest_rate: type === 'savings' ? SAVINGS_INTEREST : CHECKING_INTEREST,
    owners,
    opened: dayMs,
  };
  if (type === 'savings') Object.assign(a, savingsTier(openingCents));
  accounts.push(a);
  for (const o of owners) ownership.push({ account_id: a.account_id, customer_id: o.customer_id });
  return a;
}

function openDebit(customer, account) {
  const card = { card_id: nextId('D'), card_type: 'debit', account_id: account.account_id, account, customer };
  cards.push(card);
  return card;
}

function openCredit(customer, limitDollars) {
  const card = {
    card_id: nextId('D'), card_type: 'credit', account_id: null, customer,
    limit: limitDollars * 100, running_balance: 0,
  };
  cards.push(card);
  return card;
}

function takeLoan(customer, type, amountCents, dayMs, payFrom) {
  const tier = loanTier(amountCents);
  const loan = {
    loan_id: nextId('L'), loan_type: type, amount: amountCents,
    interest_rate: tier.rate, monthly_payment: tier.monthly, customer, opened: dayMs,
  };
  loans.push(loan);
  // Monthly payments from the borrower's checking account, starting next month.
  for (let t = dayMs + 30 * DAY; t < END; t += 30 * DAY) {
    events.push({ t: timeOnDay(t), kind: 'loanPayment', loan, account: payFrom, customer });
  }
}

// ---------------------------------------------------------------------------
// Customers, households and products
// ---------------------------------------------------------------------------

// Demo customer with extensive data (the README's "user with a lot of data").
const demo = makeCustomer();
demo.paycheck = 3850_00;
{
  const d = START;
  const chk1 = openAccount('checking', [demo], d, 4250_00);
  const chk2 = openAccount('checking', [demo], d + 3 * DAY, 1200_00);
  openAccount('savings', [demo], d, 18500_00);
  openAccount('savings', [demo], d + 10 * DAY, 1500_00);
  openDebit(demo, chk1);
  openDebit(demo, chk2);
  openCredit(demo, 10000);
  openCredit(demo, 2500);
  takeLoan(demo, 'mortgage', 285000_00, d + 14 * DAY, chk1);
  takeLoan(demo, 'unsecured', 18000_00, d + 120 * DAY, chk1);
}

// Households of two sharing a joint checking account.
for (let h = 0; h < 6; h++) {
  const first = makeCustomer();
  const lastName = first.customer_name.split(' ').slice(1).join(' ');
  const second = makeCustomer({ lastName, address: first.address });
  const day = randomDay(START, START + 45 * DAY);
  const joint = openAccount('checking', [first, second], day, cents(800, 7000));
  openDebit(first, joint);
  openDebit(second, joint);
  for (const p of [first, second]) {
    if (chance(0.6)) openAccount('savings', [p], day + int(0, 20) * DAY, cents(250, 22000));
    if (chance(0.5)) openCredit(p, pick([1000, 2500, 5000, 7500]));
  }
  if (chance(0.5)) takeLoan(first, 'mortgage', cents(95000, 420000), day + int(5, 60) * DAY, joint);
}

// Individual customers.
for (let i = 0; i < 24; i++) {
  const c = makeCustomer();
  const day = randomDay(START, START + 75 * DAY);
  const chk = openAccount('checking', [c], day, cents(300, 6000));
  openDebit(c, chk);
  if (chance(0.55)) openAccount('savings', [c], day + int(0, 30) * DAY, cents(150, 25000));
  if (chance(0.5)) openCredit(c, pick([500, 1000, 2000, 3000, 5000]));
  if (chance(0.15)) openCredit(c, pick([7500, 10000, 15000]));
  if (chance(0.3)) {
    const unsecured = chance(0.7);
    takeLoan(c, unsecured ? 'unsecured' : 'mortgage',
      unsecured ? cents(800, 45000) : cents(110000, 380000),
      randomDay(day + 10 * DAY, END - 60 * DAY), chk);
  }
}

// ---------------------------------------------------------------------------
// Activity events
// ---------------------------------------------------------------------------

const ownedBy = (c) => accounts.filter((a) => a.owners.includes(c));

for (const c of customers) {
  const mine = ownedBy(c);
  const checking = mine.filter((a) => a.account_type === 'checking');
  const savings = mine.filter((a) => a.account_type === 'savings');
  const activity = c === demo ? 1.6 : 1;

  for (const acct of checking) {
    // Bi-weekly paychecks deposited at a Full Service branch.
    for (let t = acct.opened + int(1, 13) * DAY; t < END; t += 14 * DAY) {
      events.push({ t: timeOnDay(t), kind: 'deposit', account: acct, customer: c,
        amount: Math.round(c.paycheck * faker.number.float({ min: 0.97, max: 1.03 })) });
    }
    // Cash withdrawals, any branch.
    for (let t = acct.opened; t < END; t += 30 * DAY) {
      for (let k = 0; k < Math.round(int(1, 3) * activity); k++) {
        events.push({ t: timeOnDay(randomDay(t, Math.min(t + 29 * DAY, END))), kind: 'withdrawal',
          account: acct, customer: c, amount: pick([20, 40, 60, 80, 100, 120, 200, 300]) * 100 });
      }
    }
  }

  for (const acct of savings) {
    for (let t = acct.opened + int(5, 25) * DAY; t < END; t += 30 * DAY) {
      events.push({ t: timeOnDay(t), kind: 'deposit', account: acct, customer: c, amount: cents(50, 600) });
    }
    for (let k = 0; k < int(0, 3); k++) {
      events.push({ t: timeOnDay(randomDay(acct.opened + DAY, END)), kind: 'withdrawal',
        account: acct, customer: c, amount: cents(100, 2500) });
    }
  }

  for (const card of cards.filter((k) => k.customer === c)) {
    const opened = card.account ? card.account.opened : START;
    const perMonth = card.card_type === 'debit' ? [5, 11] : [2, 5];
    for (let t = opened; t < END; t += 30 * DAY) {
      for (let k = 0; k < Math.round(int(...perMonth) * activity); k++) {
        const vendor = pick(vendors);
        const [lo, hi] = PURCHASE_RANGE[vendor.category];
        events.push({ t: timeOnDay(randomDay(t, Math.min(t + 29 * DAY, END))), kind: 'purchase',
          card, vendor, customer: c, amount: cents(lo, hi) });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Replay in date order, applying the app's rules
// ---------------------------------------------------------------------------

events.forEach((e, i) => (e.seq = i));
events.sort((a, b) => a.t - b.t || a.seq - b.seq);

const transactions = [];
const purchases = [];
const skipped = { withdrawal: 0, purchase: 0, loanPayment: 0 };

for (const e of events) {
  switch (e.kind) {
    case 'deposit': {
      e.account.balance += e.amount;
      transactions.push({ type: 'deposit', t: e.t, amount: e.amount, customer: e.customer,
        account: e.account, branch: pick(fullService) });
      break;
    }
    case 'withdrawal': {
      const a = e.account;
      const after = a.balance - e.amount;
      // Checking: App.java:585. Savings: App.java:552 and 564 (penalty path not generated).
      const ok = a.account_type === 'checking' ? after > 0 : after >= a.minimum && after >= SAVINGS_FLOOR;
      if (!ok) { skipped.withdrawal++; break; }
      a.balance = after;
      transactions.push({ type: 'withdrawal', t: e.t, amount: e.amount, customer: e.customer,
        account: a, branch: pick(branches) });
      break;
    }
    case 'purchase': {
      const { card } = e;
      if (card.card_type === 'debit') {
        // App.java:796 - rejected when balance - amount <= 0. Keep a small cushion for realism.
        if (card.account.balance - e.amount <= 2500) { skipped.purchase++; break; }
        card.account.balance -= e.amount;
      } else {
        // App.java:768 - rejected when amount > limit - running_balance.
        if (e.amount > card.limit - card.running_balance) { skipped.purchase++; break; }
        card.running_balance += e.amount;
      }
      purchases.push({ card, vendor: e.vendor, amount: e.amount, t: e.t });
      break;
    }
    case 'loanPayment': {
      const { loan, account } = e;
      const payment = Math.min(loan.monthly_payment, loan.amount);
      // The app does not check either balance (App.java:390-391); the seed only
      // generates payments a sensible customer could make.
      if (payment <= 0 || account.balance - payment <= 0) { skipped.loanPayment++; break; }
      loan.amount -= payment;
      account.balance -= payment;
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// SQL output
// ---------------------------------------------------------------------------

function insert(table, columns, rows) {
  if (rows.length === 0) return '';
  const chunks = [];
  for (let i = 0; i < rows.length; i += 200) {
    const values = rows.slice(i, i + 200).map((r) => `  (${r.join(', ')})`).join(',\n');
    chunks.push(`insert into ${table} (${columns.join(', ')}) values\n${values};\n`);
  }
  return chunks.join('\n');
}

const sql = [
  '-- Generated by scripts/generate-seed.mjs - do not edit by hand.',
  '-- Regenerate with: npm run seed:generate',
  `-- ${customers.length} customers, ${accounts.length} accounts, ${cards.length} cards, ${loans.length} loans,`,
  `-- ${transactions.length} transactions, ${purchases.length} purchases (${fmtDate(START)} to ${fmtDate(END)})`,
  '',
  insert('customer', ['customer_id', 'customer_name', 'birthday', 'address'],
    customers.map((c) => [sqlStr(c.customer_id), sqlStr(c.customer_name), sqlStr(c.birthday), sqlStr(c.address)])),
  insert('branch', ['branch_id', 'branch_type'],
    branches.map((b) => [sqlStr(b.branch_id), sqlStr(b.branch_type)])),
  insert('account', ['account_id', 'account_type', 'balance', 'interest_rate'],
    accounts.map((a) => [sqlStr(a.account_id), sqlStr(a.account_type), money(a.balance), a.interest_rate.toFixed(2)])),
  insert('checking', ['account_id'],
    accounts.filter((a) => a.account_type === 'checking').map((a) => [sqlStr(a.account_id)])),
  insert('savings', ['account_id', 'minimum_balance', 'penalty'],
    accounts.filter((a) => a.account_type === 'savings').map((a) => [sqlStr(a.account_id), money(a.minimum), money(a.penalty)])),
  insert('account_ownership', ['account_id', 'customer_id'],
    ownership.map((o) => [sqlStr(o.account_id), sqlStr(o.customer_id)])),
  insert('card', ['card_id', 'card_type', 'account_id', 'customer_id', 'customer_name'],
    cards.map((k) => [sqlStr(k.card_id), sqlStr(k.card_type), sqlStr(k.account_id), sqlStr(k.customer.customer_id), sqlStr(k.customer.customer_name)])),
  insert('credit', ['card_id', 'interest_rate', '"limit"', 'running_balance', 'balance_due'],
    cards.filter((k) => k.card_type === 'credit').map((k) => [sqlStr(k.card_id), CREDIT_INTEREST.toFixed(2), money(k.limit), money(k.running_balance), '0.00'])),
  insert('debit', ['card_id'],
    cards.filter((k) => k.card_type === 'debit').map((k) => [sqlStr(k.card_id)])),
  insert('vendor', ['vendor_id', 'vendor_name'],
    vendors.map((v) => [sqlStr(v.vendor_id), sqlStr(v.vendor_name)])),
  insert('loan', ['loan_id', 'loan_type', 'amount', 'interest_rate', 'monthly_payment', 'customer_id'],
    loans.map((l) => [sqlStr(l.loan_id), sqlStr(l.loan_type), money(l.amount), l.interest_rate.toFixed(2), money(l.monthly_payment), sqlStr(l.customer.customer_id)])),
  insert('purchase', ['purchase_id', 'card_id', 'vendor_id', 'amount', 'purchase_date'],
    purchases.map((p, i) => [i + 1, sqlStr(p.card.card_id), sqlStr(p.vendor.vendor_id), money(p.amount), sqlStr(fmtTimestamp(p.t))])),
  insert('transaction', ['transaction_id', 'transaction_type', 'transaction_date', 'amount', 'customer_id', 'account_id', 'branch_id'],
    transactions.map((x) => [sqlStr(nextId('T')), sqlStr(x.type), sqlStr(fmtTimestamp(x.t)), money(x.amount), sqlStr(x.customer.customer_id), sqlStr(x.account.account_id), sqlStr(x.branch.branch_id)])),
  '-- Advance ID generators past the seeded rows.',
  ...[['customer_id_seq', 'C'], ['branch_id_seq', 'B'], ['account_id_seq', 'A'], ['card_id_seq', 'D'],
    ['vendor_id_seq', 'V'], ['loan_id_seq', 'L'], ['transaction_id_seq', 'T']]
    .map(([seq, prefix]) => `select setval('${seq}', ${counters[prefix]});`),
  `select setval(pg_get_serial_sequence('purchase', 'purchase_id'), ${purchases.length});`,
  '',
].join('\n');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, sql);

console.log(`Wrote ${OUT}`);
console.log(`  ${customers.length} customers (demo: ${demo.customer_name}), ${accounts.length} accounts, ${cards.length} cards, ${loans.length} loans`);
console.log(`  ${transactions.length} transactions, ${purchases.length} purchases`);
console.log(`  skipped by business rules: ${JSON.stringify(skipped)}`);
