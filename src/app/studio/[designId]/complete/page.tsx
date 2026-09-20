import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { SareeDesign } from "@/components/studio/types";
import { fromPersisted } from "@/components/studio/cloud-design-store";

/**
 * Concept Review screen (PRD §23-24): the step between "Complete Design" in
 * the editor and the submission form. Shows what will be sent to VELVOREA
 * and offers Edit / View on NILA / Submit to VELVOREA / Save & Exit.
 *
 * NILA 3D drape is explicitly out of scope for this pass (no 3D asset
 * exists yet) — "View on NILA" is rendered as a disabled, honestly-labelled
 * "coming soon" control rather than a broken link or a fabricated feature.
 */
export default async function CompleteDesignPage({
  params,
}: {
  params: Promise<{ designId: string }>;
}) {
  const { designId } = await params;

  if (!isSupabaseConfigured()) {
    redirect("/studio");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/studio");

  const { data: row } = await supabase
    .from("designs")
    .select("id, name, design, updated_at")
    .eq("id", designId)
    .maybeSingle();

  if (!row) notFound();

  const design = fromPersisted(row.design) as SareeDesign;
  const conceptId = row.id.slice(0, 8).toUpperCase();
  const timestamp = new Date(row.updated_at).toLocaleString("en-IN");

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-ivory">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">Concept Review</p>
      <h1 className="mt-2 font-serif text-3xl">{design.name}</h1>
      <p className="mt-3 max-w-lg text-sm text-stone-light">
        This is your digital textile concept preview — not a guaranteed physical result. Our textile
        design team will refine and validate your concept for weaving after submission.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-4 border border-line-dark p-5 font-mono text-xs">
        <div>
          <dt className="text-stone">Concept ID</dt>
          <dd className="mt-1 text-ivory">{conceptId}</dd>
        </div>
        <div>
          <dt className="text-stone">Last updated</dt>
          <dd className="mt-1 text-ivory">{timestamp}</dd>
        </div>
        <div>
          <dt className="text-stone">Material</dt>
          <dd className="mt-1 text-ivory">{design.materialId}</dd>
        </div>
        <div>
          <dt className="text-stone">Weave</dt>
          <dd className="mt-1 text-ivory">{design.weaveId}</dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/studio"
          className="border border-line-dark px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-stone-light hover:border-brass hover:text-brass"
        >
          Edit
        </Link>
        <button
          disabled
          title="NILA 3D drape is not available yet — no 3D model asset has been sourced. This is not a bug, it's an explicitly deferred feature."
          className="cursor-not-allowed border border-line-dark px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-stone opacity-50"
        >
          View on NILA (coming soon)
        </button>
        <Link
          href={`/studio/${designId}/submit`}
          className="bg-brass-bright px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-charcoal hover:bg-ivory"
        >
          Submit to VELVOREA
        </Link>
        <Link
          href="/studio/designs"
          className="border border-line-dark px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-stone-light hover:border-brass hover:text-brass"
        >
          Save &amp; Exit
        </Link>
      </div>
    </main>
  );
}
