import Link from "next/link";
import { redirect } from "next/navigation";
import { StudioFrame } from "@/components/studio/studio-frame";
import { MAX_DESIGNS_PER_CUSTOMER } from "@/config/limits";
import { isDomainError } from "@/domain/errors";
import { recordAudit } from "@/lib/audit/audit-log";
import { createDesign } from "@/lib/studio/repository";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "New design — VELVOREA" };
export const dynamic = "force-dynamic";

/**
 * Create a design.
 *
 * A design starts from the customer's own saree photograph (§8), so there is
 * no base-style picker any more. This route creates the design and drops the
 * customer at Upload — reached by an ordinary link, which is why it survives
 * a redeploy with a stale tab open where a server action would not.
 */
export default async function NewDesignPage() {
  if (!isSupabaseConfigured()) redirect("/studio");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/studio");

  let designId: string;
  try {
    const design = await createDesign({ userId: user.id, name: "Untitled design" });
    designId = design.id;

    // Not awaited into the redirect path: the audit write is not worth
    // delaying the customer's first screen for.
    void recordAudit({
      action: "DESIGN_CREATED",
      entityType: "design",
      entityId: design.id,
      actorUserId: user.id,
    });
  } catch (error) {
    if (isDomainError(error) && error.code === "DESIGN_LIMIT_REACHED") {
      return (
        <StudioFrame>
          <div className="mx-auto max-w-lg px-6 py-24 text-center">
            <h1 className="font-display text-3xl">You&apos;ve used all your design slots</h1>
            <p className="mt-4 text-sm leading-relaxed text-gray">
              You can keep {MAX_DESIGNS_PER_CUSTOMER} designs at a time. Delete one you no longer
              need and you can start a new saree straight away.
            </p>
            <Link
              href="/studio/designs"
              className="mt-8 inline-flex rounded-sm bg-ink px-6 py-3 text-sm font-semibold text-paper hover:bg-ink-soft"
            >
              Manage my designs
            </Link>
          </div>
        </StudioFrame>
      );
    }
    throw error;
  }

  // Outside the try: redirect() signals by throwing, and catching it here
  // would turn a successful creation into an error page.
  redirect(`/studio/${designId}/upload`);
}
