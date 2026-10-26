import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Service-role client: bypasses RLS, so it must never reach the browser.
// Tables are deny-all for the public anon key (migration 20261026000002), and
// only this role may execute the business functions (migration 20261026000004).
//
// Created on first use rather than at import time, so `next build` doesn't
// need the secrets (the build imports this module while collecting pages).
let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see web/.env.example).');
    }
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}
