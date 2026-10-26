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

- [ ] **D1 — Reconstructed schema.** Approve the inferred ID prefixes, `numeric(12,2)` money, `timestamp` dates, and "PK/FK only, no extra constraints" ([details](existing-behavior.md#inferred-details-need-approval--decision-d1-in-the-tracker))
- [ ] **D2 — Where business logic lives.** Recommended: one Postgres function per operation (atomic, authoritative, testable with PGlite), called from Next.js server actions
- [ ] **D3 — Auth model for a public portfolio.** The original has a shared DB password plus pick-a-customer-by-name. Recommended: public "demo mode" that keeps pick-a-customer, plus deny-all RLS on tables, writes only through functions, and a scheduled reset of demo data
- [ ] **D4 — Bug fixes.** Approve or reject each of BUG-01 … BUG-10 individually ([list](existing-behavior.md#3-potential-bugs-documented-not-fixed--awaiting-approval))
- [ ] **D5 — Demo data identity.** The README's demo user was "Harry Styles". The seed uses a fictional demo customer (C00001). Keep fictional?
- [ ] **D6 — Branch/vendor display.** Tables only hold IDs and types, so the UI would show "B00003 · ATM". Adding branch names or locations would be a schema change

## Decision log

| Date | ID | Decision | By |
|---|---|---|---|
| 2026-10-26 | — | Original DDL not found in repo or git history; schema reconstructed from Java code | Claude (documented) |

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
- [ ] D1 approved; migration adjusted if needed
- [ ] Create Supabase project; save credentials in `.env.local` (never committed)
- [ ] Install Supabase CLI, `supabase link`, `supabase db push` to the empty project
- [ ] Re-run the schema checks against the hosted DB

## Phase 2 — Database tests & seed data
- [x] Every `Database.java` statement runs on the new schema — `tests/db/original-queries.test.ts`
- [x] Characterization tests for known bugs and incompatibilities
- [x] Deterministic, rule-following seed generator — `scripts/generate-seed.mjs` → `supabase/seed.sql`
- [x] Seed invariant tests (balances, tiers, ownership, branch rules) — `tests/db/seed.test.ts`
- [x] CI runs tests and checks that seed.sql is up to date — `.github/workflows/db-tests.yml`
- [ ] Load seed into the hosted Supabase DB and spot-check in the dashboard

## Phase 3 — Business logic layer (after D2, D4)
One item per operation. Each must have tests that reproduce App.java exactly, including boundaries.
- [ ] View accounts / cards / loans (customer-scoped reads)
- [ ] Employee views (all customers, cards, accounts, transactions, loans)
- [ ] Deposit (Full Service branch only)
- [ ] Withdraw — checking
- [ ] Withdraw — savings (incl. penalty path, as-is unless BUG-02 approved)
- [ ] Open checking account
- [ ] Open savings account (tiers)
- [ ] Open credit card
- [ ] Open debit card
- [ ] Take loan (tiers)
- [ ] Pay loan
- [ ] Purchase — debit
- [ ] Purchase — credit

## Phase 4 — Auth & security (after D3)
- [ ] Implement the chosen auth model
- [ ] RLS policies / function grants; test that anon can't read or write tables directly
- [ ] Demo-data reset job (if demo mode)
- [ ] Security review of server actions and functions

## Phase 5 — Next.js frontend
- [ ] Scaffold Next.js (App Router, TypeScript) in `web/`; Supabase client in a server-only data layer
- [ ] Landing / login page: Employee or Customer, then pick a customer
- [ ] Employee dashboard (5 tables)
- [ ] Customer dashboard (accounts, cards, loans overview)
- [ ] Deposit / withdrawal screens
- [ ] Open account screen
- [ ] Open card screens
- [ ] Loan screens (view, take, pay)
- [ ] Purchase screen
- [ ] Error and validation messages match the original rules (no client-side recalculation of authoritative values)
- [ ] End-to-end tests for each operation (Playwright)

## Phase 6 — Deploy & portfolio
- [ ] Deploy to Vercel with Supabase env vars
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
| 1 | Employee: view all tables | App.java:418 | | | | todo |
| 2 | Login by customer name | App.java:904 | | | | todo |
| 3 | View my accounts | App.java:399 | | | | todo |
| 4 | Deposit | App.java:452 | | | | todo |
| 5 | Withdraw (checking) | App.java:575 | | | | todo |
| 6 | Withdraw (savings) | App.java:541 | | | | todo |
| 7 | Open checking | App.java:648 | | | | todo |
| 8 | Open savings | App.java:636 | | | | todo |
| 9 | View cards | App.java:846 | | | | todo |
| 10 | Open credit card | App.java:718 | | | | todo |
| 11 | Open debit card | App.java:690 | | | | todo |
| 12 | View loans | App.java:259 | | | | todo |
| 13 | Take loan | App.java:287 | | | | todo |
| 14 | Pay loan | App.java:341 | | | | todo |
| 15 | Purchase (debit) | App.java:783 | | | | todo |
| 16 | Purchase (credit) | App.java:752 | | | | todo |
