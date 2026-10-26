# NSL Bank — Migration Tracker

Turns the CSE241 Oracle/Java console bank into a Next.js + Supabase portfolio app,
**preserving existing behavior** (see [CLAUDE.md](../CLAUDE.MD) and
[existing-behavior.md](existing-behavior.md)).

**How to use this file**
- Check a box (`- [x]`) when an item is done *and verified*. Run `npm run status` for a progress summary.
- Anything that changes schema or business behavior goes in the **Approval queue** first and isn't built until it's approved.
- Record each approval or decision in the **Decision log** with the date.
- Before a phase is marked complete, `npm test` must pass and CI must be green.

---

## Approval queue

Decisions only the project owner can make. Check the box once a decision is recorded in the log.

- [x] **D1 — Reconstructed schema.** Approve the inferred ID prefixes, `numeric(12,2)` money, `timestamp` dates, and "PK/FK only, no extra constraints" ([details](existing-behavior.md#inferred-details-need-approval--decision-d1-in-the-tracker))
- [x] **D2 — Where business logic lives.** Recommended: one Postgres function per operation (atomic, authoritative, testable with PGlite), called from Next.js server actions
- [x] **D3 — Auth model for a public portfolio.** The original has a shared DB password plus pick-a-customer-by-name. Recommended: public "demo mode" that keeps pick-a-customer, plus deny-all RLS on tables, writes only through functions, and a scheduled reset of demo data
- [x] **D4 — Bug fixes.** Approve or reject each of BUG-01 … BUG-10 individually ([list](existing-behavior.md#3-potential-bugs-documented-not-fixed--awaiting-approval))
- [x] **D5 — Demo data identity.** The README's demo user was "Harry Styles". The seed uses a fictional demo customer (C00001). Keep fictional?
- [x] **D6 — Branch/vendor display.** Tables only hold IDs and types, so the UI would show "B00003 · ATM". Adding branch names or locations would be a schema change

## Decision log

| Date | ID | Decision | By |
|---|---|---|---|
| 2026-10-26 | — | Original DDL not found in repo or git history; schema reconstructed from Java code | Claude (documented) |
| 2026-10-26 | D1 | Approved as drafted: ID prefixes C/B/A/D/V/L/T + 5 digits, numeric(12,2) money, timestamp dates, PK/FK only | Sarah |
| 2026-10-26 | D2 | Business logic as Postgres functions (one per operation, atomic), called from Next.js server actions | Sarah |
| 2026-10-26 | D3 | Public demo mode (Employee or pick-a-customer), deny-all RLS on tables, writes only via functions, nightly reset to seed | Sarah |
| 2026-10-26 | D4 | **Fix:** BUG-01, 02, 04, 05, 06, 07 (balance + overpay checks only; still no transaction row), 08, 09, 10. **Keep as-is:** BUG-03 | Sarah |
| 2026-10-26 | D5 | Keep fictional names; C00001 is the showcase customer | Sarah |
| 2026-10-26 | D6 | Add nullable `branch_name` and `address` to `branch` (migration 20261026000003) | Sarah |
| 2026-10-26 | D3 (amended) | Add a site-wide **admin password gate** (password `demo`, env `DEMO_PASSWORD`) before anything is reachable, mirroring the original's initial password prompt; Employee / pick-a-customer demo mode stays behind it | Sarah |

---

## Phase 0 — Discovery & documentation
- [x] Inventory original code (App.java, Database.java, Row classes)
- [x] Confirm the original DDL and data are unavailable (not in repo, jar, or git history)
- [x] Document the reconstructed schema, operations, and business rules
- [x] Document potential bugs without fixing them (BUG-01 … BUG-10)
- [x] Document PostgreSQL incompatibilities (`limit` reserved word, generated keys)

## Phase 1 — Schema in PostgreSQL
- [x] Draft migration `20261026000001_initial_schema.sql`
- [x] Deny-by-default RLS migration `20261026000002_enable_rls.sql`
- [x] Schema verified locally against real Postgres (PGlite) — `tests/db/schema.test.ts`
- [x] D1 approved; migration adjusted if needed
- [x] D6 branch display columns — `20261026000003_branch_display_details.sql`
- [x] Create Supabase project (`vobgnourgfbxdlzjhitj`); credentials in `.env.local` (never committed)
- [x] `supabase link`, `supabase db push --include-seed` to the empty project (2026-10-26)
- [x] Hosted DB verified — `npm run verify:remote` (data identical to seed, RLS on, anon blocked)

## Phase 2 — Database tests & seed data
- [x] Every `Database.java` statement runs on the new schema — `tests/db/original-queries.test.ts`
- [x] Characterization tests for known bugs and incompatibilities
- [x] Deterministic, rule-following seed generator — `scripts/generate-seed.mjs` → `supabase/seed.sql`
- [x] Seed invariant tests (balances, tiers, ownership, branch rules) — `tests/db/seed.test.ts`
- [x] CI runs tests and checks that seed.sql is up to date — `.github/workflows/db-tests.yml`
- [x] Load seed into the hosted Supabase DB and verify it matches (checksums per table)

## Phase 3 — Business logic layer (after D2, D4)
One Postgres function per operation, each atomic (BUG-09). Tests reproduce App.java exactly, including boundaries,
**except** for the approved fixes: all amounts must be > 0 (BUG-06); loan/savings tiers use inclusive bounds (BUG-04/05);
the savings penalty is `amount + savings.penalty` with a transaction row and a $0 floor (BUG-02); loan payments are
checked against the remaining loan and the account balance (BUG-07); debit cards link to checking only (BUG-08).
BUG-03's unreachable check is kept.
Functions: `supabase/migrations/20261026000004_business_functions.sql`; tests: `tests/db/functions.test.ts` (applied to Supabase 2026-10-26).
- [x] View accounts / cards / loans (customer-scoped reads) — `web/lib/bank.ts`
- [x] Employee views (all customers, cards, accounts, transactions, loans)
- [x] Deposit (Full Service branch only) — `deposit()`
- [x] Withdraw — checking — `withdraw()`
- [x] Withdraw — savings (penalty confirmation step; BUG-02 fix) — `withdraw(..., p_accept_penalty)`
- [x] Open checking account — `open_account()`
- [x] Open savings account (tiers) — `open_account()`
- [x] Open credit card — `open_credit_card()`
- [x] Open debit card — `open_debit_card()`
- [x] Take loan (tiers) — `take_loan()`
- [x] Pay loan — `pay_loan()`
- [x] Purchase — debit — `purchase()`
- [x] Purchase — credit — `purchase()`

## Phase 4 — Auth & security (after D3)
- [x] Implement the chosen auth model — demo mode: pick a customer, httpOnly cookie (`web/lib/session.ts`); every action re-reads it
- [x] Admin password gate (`/login`, password from `DEMO_PASSWORD`): `web/proxy.ts` redirects, and every DB access in `web/lib/bank.ts` re-checks it
- [x] RLS + function grants; anon can't read tables or execute functions — checked by `npm run verify:remote`
- [ ] Demo-data reset job (nightly reset to `seed.sql`)
- [ ] Security review of server actions and functions

## Phase 5 — Next.js frontend
- [x] Scaffold Next.js 16 (App Router, TypeScript) in `web/`; service-role Supabase client in a server-only data layer
- [x] Landing / login page: Employee or Customer, then pick a customer
- [x] Employee dashboard (5 tables)
- [x] Customer dashboard (accounts, recent transactions, open account)
- [x] Deposit / withdrawal screens (incl. penalty confirmation)
- [x] Open account screen
- [x] Open card screens
- [x] Loan screens (view, take, pay)
- [x] Purchase screen (incl. purchase history)
- [x] Error messages come from the database functions; the UI does no authoritative calculation
- [ ] End-to-end tests for each operation (Playwright)

## Phase 6 — Deploy & portfolio
- [x] Netlify config — `netlify.toml` (base `web/`, Node 22, OpenNext adapter applied automatically)
- [ ] Deploy to Netlify from GitHub with env vars `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (secret), `DEMO_PASSWORD` (see `web/.env.example`)
- [ ] Smoke test the deployed site
- [ ] README: architecture, how the migration preserved behavior, screenshots
- [ ] Link from portfolio site

## Phase 7 — Completion report
- [ ] Original vs migrated comparison, operation by operation (parity matrix below fully "done")
- [ ] List of differences, unresolved compatibility issues, and tests performed

---

## Parity matrix

Original operation → new implementation. Update the status as work lands (`todo` → `logic` → `ui` → `done`).

| # | Operation | Original | DB layer | Tests | UI | Status |
|---|---|---|---|---|---|---|
| 1 | Employee: view all tables | App.java:418 | `listForEmployee` | smoke | `/employee` | ui |
| 2 | Login by customer name | App.java:904 | `listCustomers` + cookie | smoke | `/` | ui |
| 3 | View my accounts | App.java:399 | `getAccounts` | smoke | `/customer` | ui |
| 4 | Deposit | App.java:452 | `deposit()` | functions.test | `/customer/banking` | ui |
| 5 | Withdraw (checking) | App.java:575 | `withdraw()` | functions.test | `/customer/banking` | ui |
| 6 | Withdraw (savings) | App.java:541 | `withdraw()` | functions.test | `/customer/banking` | ui |
| 7 | Open checking | App.java:648 | `open_account()` | functions.test | `/customer` | ui |
| 8 | Open savings | App.java:636 | `open_account()` | functions.test | `/customer` | ui |
| 9 | View cards | App.java:846 | `getCards` | smoke | `/customer/cards` | ui |
| 10 | Open credit card | App.java:718 | `open_credit_card()` | functions.test | `/customer/cards` | ui |
| 11 | Open debit card | App.java:690 | `open_debit_card()` | functions.test | `/customer/cards` | ui |
| 12 | View loans | App.java:259 | `getLoans` | smoke | `/customer/loans` | ui |
| 13 | Take loan | App.java:287 | `take_loan()` | functions.test | `/customer/loans` | ui |
| 14 | Pay loan | App.java:341 | `pay_loan()` | functions.test | `/customer/loans` | ui |
| 15 | Purchase (debit) | App.java:783 | `purchase()` | functions.test | `/customer/purchases` | ui |
| 16 | Purchase (credit) | App.java:752 | `purchase()` | functions.test | `/customer/purchases` | ui |
