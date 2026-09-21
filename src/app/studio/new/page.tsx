import { redirect } from "next/navigation";
import { recordAudit } from "@/lib/audit/audit-log";
import { createDesign } from "@/lib/studio/repository";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Create a design.
 *
 * The Textile Studio no longer starts from a base-style picker — a design
 * starts from the customer's own saree photograph (§8). This route stays as a
 * stable entry point (My Designs links here) and simply creates the design and
 * drops the customer at Upload.
 */
export default async function NewDesignPage() {
  if (!isSupabaseConfigured()) redirect("/studio");

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
