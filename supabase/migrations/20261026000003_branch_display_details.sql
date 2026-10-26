-- Decision D6 (approved 2026-10-26): add display details to branches so the
-- UI can show "Bethlehem - South Side" instead of only "B00001". Purely
-- additive and nullable; no original query or business rule reads these.

alter table branch add column branch_name text;
alter table branch add column address     text;
