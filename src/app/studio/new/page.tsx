import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { StudioSignInGate } from "@/components/studio/studio-sign-in-gate";
import { NewDesignBasePicker } from "@/components/studio/new-design-base-picker";

export const metadata = { title: "Create Design — VELVOREA" };

/**
 * Saree base selection (PRD §9). Reuses the existing `materials` catalog
 * from studio-data.ts — no new material claims are introduced here.
 */
export default async function NewDesignPage() {
  if (!isSupabaseConfigured()) redirect("/studio");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <StudioSignInGate redirectTo="/studio/new" />;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16 text-ivory">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">Create Design</p>
      <h1 className="mt-2 font-serif text-3xl">Choose a saree base</h1>
      <p className="mt-2 max-w-lg text-sm text-stone-light">
        Pick a starting material. You can change weave, colour, and everything else once you&rsquo;re
        in the editor.
      </p>
      <NewDesignBasePicker />
    </main>
  );
}
