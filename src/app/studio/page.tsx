import Link from "next/link";
import { StudioFrame } from "@/components/studio/studio-frame";
import { StudioSignInGate } from "@/components/studio/studio-sign-in-gate";
import { MAX_DESIGNS_PER_CUSTOMER } from "@/config/limits";
import { customerStatusLabel, isCustomerEditable } from "@/domain/design-state";
import type { DesignStatus } from "@/domain/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = {
  title: "Textile Studio — VELVOREA",
};

interface RecentDesign {
  id: string;
  name: string;
  status: DesignStatus;
  public_id: string | null;
  updated_at: string;
}

/** Where an existing design should resume, given how far it has got. */
function resumeHref(design: RecentDesign): string {
  if (!isCustomerEditable(design.status)) return `/studio/${design.id}/woven`;
  return design.status === "WOVEN_CONCEPT"
    ? `/studio/${design.id}/woven`
    : `/studio/${design.id}/upload`;
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

  const { data: recent } = await supabase
    .from("designs")
    .select("id, name, status, public_id, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .returns<RecentDesign[]>();

  const designs = recent ?? [];
  const atLimit = designs.length >= MAX_DESIGNS_PER_CUSTOMER;

  return (
    <StudioFrame>
      <div className="mx-auto max-w-2xl px-5 py-14 sm:px-6 sm:py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray">
          Textile Studio
        </p>
        <h1 className="mt-4 font-display text-[2.5rem] leading-[1.08] sm:text-5xl">
          Create Your Saree
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-gray">
          Turn a saree you love into a new woven concept.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* A plain navigation, not a form action: a link survives a redeploy
              with a stale tab open, works before hydration, and lets the
              browser show its own progress indicator while the design is
              created. */}
          {atLimit ? (
            <span className="inline-flex cursor-not-allowed items-center justify-center rounded-sm bg-ink/30 px-7 py-3.5 text-sm font-semibold text-paper">
              Start Designing
            </span>
          ) : (
            <Link
              href="/studio/new"
              prefetch={false}
              className="inline-flex items-center justify-center rounded-sm bg-ink px-7 py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Start Designing
            </Link>
          )}

          <Link
            href="/studio/designs"
            className="inline-flex items-center justify-center rounded-sm border border-line px-6 py-3.5 text-sm font-semibold transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            My Designs
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray">
          {atLimit ? (
            <>
              You&apos;re using all {MAX_DESIGNS_PER_CUSTOMER} design slots.{" "}
              <Link href="/studio/designs" className="underline underline-offset-2">
                Delete one
              </Link>{" "}
              to start another.
            </>
          ) : (
            `${designs.length} of ${MAX_DESIGNS_PER_CUSTOMER} design slots used.`
          )}
        </p>

        {designs.length > 0 && (
          <section className="mt-14 border-t border-line pt-8">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray">
              Pick up where you left off
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {designs.slice(0, 3).map((design) => (
                <li key={design.id}>
                  <Link
                    href={resumeHref(design)}
                    className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{design.name}</span>
                      {design.public_id && (
                        <span className="mt-0.5 block font-mono text-[11px] text-gray">
                          {design.public_id}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-full bg-paper-dim px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-gray">
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
