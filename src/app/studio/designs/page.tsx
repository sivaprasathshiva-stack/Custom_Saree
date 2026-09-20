import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { StudioSignInGate } from "@/components/studio/studio-sign-in-gate";
import { DesignsList, type DesignRow } from "@/components/studio/designs-list";

export const metadata = { title: "My Designs — VELVOREA" };

export default async function MyDesignsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-6 py-16 text-ivory">
        <p className="text-sm text-stone-light">Studio backend is not configured in this environment.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <StudioSignInGate redirectTo="/studio/designs" />;

  const { data } = await supabase
    .from("designs")
    .select("id, name, updated_at, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 text-ivory">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">My Designs</p>
          <h1 className="mt-2 font-serif text-3xl">Your saree concepts</h1>
        </div>
        <Link
          href="/studio/new"
          className="bg-brass-bright px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-charcoal hover:bg-ivory"
        >
          Create Design
        </Link>
      </div>
      <DesignsList initialDesigns={(data ?? []) as DesignRow[]} />
    </main>
  );
}
