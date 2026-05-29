import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client — bypasses RLS.
 * Only call from server-side code (server actions, API routes).
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
