-- Supabase exposes the public schema through its REST API. Enabling row level
-- security with no policies denies all access through the anon and
-- authenticated roles until the auth model is approved (see
-- docs/MIGRATION_TRACKER.md, decision D3). The service role and direct
-- database connections are unaffected, so no application behaviour changes.

alter table customer          enable row level security;
alter table branch            enable row level security;
alter table account           enable row level security;
alter table checking          enable row level security;
alter table savings           enable row level security;
alter table account_ownership enable row level security;
alter table card              enable row level security;
alter table credit            enable row level security;
alter table debit             enable row level security;
alter table vendor            enable row level security;
alter table purchase          enable row level security;
alter table loan              enable row level security;
alter table transaction       enable row level security;
