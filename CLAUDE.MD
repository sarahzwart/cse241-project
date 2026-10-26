## Existing Functionality Preservation

### Core Requirement

The existing CSE241 banking application is the source of truth for its database functionality, business rules, and expected behavior.

The goal is to build a new Next.js frontend and connect it to Supabase while preserving the existing functionality as closely as possible.

**Do not change existing database functionality or business logic unless a specific bug is identified and I approve the fix.**

### Database Migration Rules

- Inspect the existing database schema, SQL statements, data models, queries, and related application code before designing the Supabase implementation.
- Document the existing tables, relationships, constraints, queries, and database-dependent behavior.
- Reproduce the existing schema and relationships in Supabase PostgreSQL as closely as the target platform allows.
- Preserve existing field meanings, data types where compatible, primary keys, foreign keys, constraints, and business rules.
- Do not add, remove, rename, or reinterpret fields or tables without explaining the reason and receiving my approval.
- Do not change how deposits, withdrawals, purchases, loans, card operations, account balances, or transaction records behave.
- Do not simplify, replace, or redesign existing business logic merely because another approach appears cleaner.
- If the existing application uses a particular calculation, validation rule, query, or transaction sequence, preserve its behavior.
- If an exact migration is impossible because of differences between the original database and PostgreSQL, explain the incompatibility and propose the smallest possible change for approval.
- Do not delete or overwrite existing data during migration.
- Use version-controlled SQL migrations and verify schema changes before applying them to any database containing data that must be preserved.

### Bug Handling

If a potential bug is discovered:

1. Identify the affected code, query, schema element, or business rule.
2. Explain the observed behavior and why it appears incorrect.
3. Describe the expected behavior based on the existing requirements or evidence.
4. Explain the proposed fix and any potential side effects.
5. Wait for my explicit approval before changing the existing functionality.

Do not silently fix, refactor, or reinterpret existing database behavior.

You may add tests that document existing behavior without changing it. If the correct behavior is unclear, ask me rather than making assumptions.

### Frontend Integration

- Build the Next.js frontend around the existing application's functionality.
- Treat frontend redesign as separate from database redesign.
- Connect UI actions to the equivalent existing operations and business rules.
- Keep database access and business logic separate from presentation components.
- Add only the integration code required to connect the frontend and Supabase.
- Do not use frontend calculations as a replacement for existing authoritative business logic.
- Ensure that Supabase authentication and Row Level Security protect access without unintentionally changing legitimate application behavior.
- If security requirements or platform constraints require a behavior change, explain the issue and obtain my approval before implementing it.

### Completion Criteria

A successful migration preserves the original application's expected behavior while making its functionality accessible through the new web interface.

Before declaring the migration complete, compare the original and migrated implementations and report any differences, unresolved compatibility issues, and tests performed.