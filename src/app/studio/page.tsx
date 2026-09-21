import Link from "next/link";
import { redirect } from "next/navigation";
import { StudioFrame } from "@/components/studio/studio-frame";
import { StudioSignInGate } from "@/components/studio/studio-sign-in-gate";
import { customerStatusLabel } from "@/domain/design-state";
import type { DesignStatus } from "@/domain/types";
import { recordAudit } from "@/lib/audit/audit-log";
import { createDesign } from "@/lib/studio/repository";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = {
  title: "Textile Studio — VELVOREA",
};

/**
 * Welcome (§7.1).
 *
 * "Start Designing" is a server action rather than a client fetch, so it works
 * before hydration and without JavaScript — the first click into the Studio
 * should never depend on a bundle having loaded.
 */
async function startDesigning() {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/studio");

  const design = await createDesign({ userId: user.id, name: "Untitled design" });
  await recordAudit({
    action: "DESIGN_CREATED",
    entityType: "design",
    entityId: design.id,
    actorUserId: user.id,
  });

  redirect(`/studio/${design.id}/upload`);
}

interface RecentDesign {
  id: string;
  name: string;
  status: DesignStatus;
  public_id: string | null;
  updated_at: string;
}

export default async function StudioWelcomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <StudioFrame>
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <h1 className="font-display text-3xl">The Studio isn&apos;t available here.</h1>
          <p className="mt-3 text-sm text-gray">
            This environment has no studio backend configured.
          </p>
        </div>
      </StudioFrame>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const params = await searchParams;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") query.set(key, value);
    }
    const redirectTo = query.size > 0 ? `/studio?${query.toString()}` : "/studio";
    return <StudioSignInGate redirectTo={redirectTo} />;
  }

  // §7.1 — if they have designs already, offer them rather than making them
  // start from scratch every visit.
  const { data: recent } = await supabase
    .from("designs")
    .select("id, name, status, public_id, updated_at")
    .eq("user_id", user.id)
    .neq("status", "ARCHIVED")
    .order("updated_at", { ascending: false })
    .limit(3)
    .returns<RecentDesign[]>();

  const hasDesigns = (recent?.length ?? 0) > 0;

  return (
    <StudioFrame>
      <div className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray">
          Textile Studio
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          Create Your Saree
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-gray">
          Turn a saree you love into a new woven concept.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <form action={startDesigning}>
            <button
              type="submit"
              className="rounded-sm bg-ink px-7 py-3.5 text-sm font-semibold text-paper transition hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Start Designing
            </button>
          </form>
          <Link
            href="/studio/designs"
            className="rounded-sm border border-line px-6 py-3.5 text-sm font-semibold transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            My Designs
          </Link>
        </div>

        {hasDesigns && (
          <section className="mt-16 border-t border-line pt-8">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray">
              Pick up where you left off
            </h2>
            <ul className="mt-4 divide-y divide-line">
              {recent!.map((design) => (
                <li key={design.id}>
                  <Link
                    href={`/studio/${design.id}/compose`}
                    className="flex items-center justify-between gap-4 py-4 transition hover:text-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{design.name}</span>
                      {design.public_id && (
                        <span className="mt-0.5 block font-mono text-[11px] text-gray">
                          {design.public_id}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-gray">
                      {customerStatusLabel(design.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </StudioFrame>
  );
}
