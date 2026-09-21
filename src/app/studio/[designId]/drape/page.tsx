import { notFound, redirect } from "next/navigation";
import { DrapePanel } from "@/components/studio/drape-panel";
import { StudioFrame } from "@/components/studio/studio-frame";
import { isEnabled } from "@/config/feature-flags";
import type { DesignStatus } from "@/domain/types";
import { loadDrapes } from "@/lib/studio/drape-service";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "See your saree draped — VELVOREA" };

export default async function DrapePage({
  params,
}: {
  params: Promise<{ designId: string }>;
}) {
  const { designId } = await params;
  if (!isSupabaseConfigured()) redirect("/studio");
  // The flag is checked server-side too, so a disabled feature is not merely
  // hidden in the UI while its route stays reachable.
  if (!isEnabled("ENABLE_NILA_DRAPE")) redirect(`/studio/${designId}/woven`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/studio");

  const { data: design } = await supabase
    .from("designs")
    .select("id, status, public_id, current_version_id")
    .eq("id", designId)
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      status: DesignStatus;
      public_id: string | null;
      current_version_id: string | null;
    }>();

  if (!design) notFound();
  // Nothing to drape until a concept exists.
  if (!design.current_version_id) redirect(`/studio/${designId}/woven`);

  const drapes = await loadDrapes(design.id);

  return (
    <StudioFrame step="drape" conceptId={design.public_id}>
      <DrapePanel designId={design.id} initialData={drapes} />
    </StudioFrame>
  );
}
