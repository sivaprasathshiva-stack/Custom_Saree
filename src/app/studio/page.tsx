import { StudioShell } from "@/components/studio/studio-shell";
import { StudioSignInGate } from "@/components/studio/studio-sign-in-gate";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = {
  title: "Textile Studio — VELVOREA",
};

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // If Supabase isn't configured in this environment, fail open rather than
  // stranding every visitor behind a sign-in that can't work — matches the
  // fallback approach already used on /account.
  if (!isSupabaseConfigured()) {
    return <StudioShell />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Preserve ?preset=/?material= handoff from the marketing site through
    // the sign-in round trip, so a bridal/material CTA doesn't silently
    // drop its starting point after Google auth completes.
    const params = await searchParams;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") query.set(key, value);
    }
    const redirectTo = query.size > 0 ? `/studio?${query.toString()}` : "/studio";
    return <StudioSignInGate redirectTo={redirectTo} />;
  }

  return <StudioShell />;
}
