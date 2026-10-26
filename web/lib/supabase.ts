import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client: bypasses RLS, so it must never reach the browser.
// Tables are deny-all for the public anon key (migration 20261026000002), and
// only this role may execute the business functions (migration 20261026000004).
export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
