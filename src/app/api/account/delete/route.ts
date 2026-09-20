import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

/**
 * Deletes the signed-in user's Supabase auth account. `auth.users` has
 * `on delete cascade` FKs to `profiles`, `designs`, and `design_versions`
 * (see supabase/schema.sql), so this single admin call removes all of the
 * user's data, not just the auth row.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set — see src/lib/supabase/admin.ts.
 * Without it, this route returns 501 rather than silently no-op'ing.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Account deletion isn't wired to the database in this environment — SUPABASE_SERVICE_ROLE_KEY is not set.",
      },
      { status: 501 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
