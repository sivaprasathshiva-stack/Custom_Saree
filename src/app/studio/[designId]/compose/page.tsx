import { notFound, redirect } from "next/navigation";
import { ComposePanel } from "@/components/studio/compose-panel";
import { StudioFrame } from "@/components/studio/studio-frame";
import { isCustomerEditable } from "@/domain/design-state";
import type { DesignStatus } from "@/domain/types";
import { signedUrlsFor } from "@/lib/storage/design-assets";
import { currentComposition, getAnalysis, listAssets } from "@/lib/studio/repository";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Compose — VELVOREA" };

export default async function ComposePage({
  params,
}: {
  params: Promise<{ designId: string }>;
}) {
  const { designId } = await params;
  if (!isSupabaseConfigured()) redirect("/studio");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/studio");

  const { data: design } = await supabase
    .from("designs")
    .select("id, name, status, public_id")
    .eq("id", designId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; name: string; status: DesignStatus; public_id: string | null }>();

  if (!design) notFound();
  if (!isCustomerEditable(design.status)) redirect(`/studio/${designId}/woven`);

  const [references, ideaAssets, composition, analysis] = await Promise.all([
    listAssets(design.id, "SAREE_REFERENCE"),
    listAssets(design.id, "IDEA_IMAGE"),
    currentComposition(design.id),
    getAnalysis(design.id),
  ]);

  // Can't compose against a saree that was never uploaded.
  if (references.length === 0) redirect(`/studio/${designId}/upload`);

  const keys = [...references, ...ideaAssets].map((asset) => asset.storage_key);
  const urls = await signedUrlsFor(keys);

  const idea = ideaAssets[0];

  return (
    <StudioFrame step="compose" conceptId={design.public_id}>
      <ComposePanel
        designId={design.id}
        backgroundUrl={urls.get(references[0].storage_key) ?? null}
        initialComposition={composition}
        initialIdeaAsset={idea ? { id: idea.id, url: urls.get(idea.storage_key) ?? null } : null}
        analysisReady={analysis?.status === "SUCCEEDED"}
      />
    </StudioFrame>
  );
}
