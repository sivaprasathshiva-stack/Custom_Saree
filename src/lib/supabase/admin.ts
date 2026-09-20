import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — server-only, never imported from a Client
 * Component or route that runs in the browser. Used for operations RLS
 * cannot express as a user action, e.g. deleting an `auth.users` row (which
 * cascades to `profiles`/`designs`/`design_versions` via existing FKs).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (Project Settings > API > service_role
 * in the Supabase dashboard) — not yet configured in this environment. Until
 * it's set, `isAdminConfigured()` returns false and callers should fail
 * gracefully rather than throwing.
 */
export function isAdminConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-role-key",
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
