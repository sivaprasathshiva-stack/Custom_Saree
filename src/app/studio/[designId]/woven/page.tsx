import { notFound, redirect } from "next/navigation";
import { StudioFrame } from "@/components/studio/studio-frame";
import { WovenConceptPanel } from "@/components/studio/woven-concept-panel";
import { isEnabled } from "@/config/feature-flags";
import type { DesignStatus } from "@/domain/types";
import { signedUrlsFor } from "@/lib/storage/design-assets";
import { getAsset, listAssets, listConceptVersions } from "@/lib/studio/repository";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Your Woven Concept — VELVOREA" };

export default async function WovenPage({
  params,
  searchParams,
}: {
  params: Promise<{ designId: string }>;
  searchParams: Promise<{ job?: string }>;
}) {
  const { designId } = await params;
  const { job } = await searchParams;
  if (!isSupabaseConfigured()) redirect("/studio");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/studio");

  const { data: design } = await supabase
    .from("designs")
    .select("id, name, status, public_id, current_version_id")
    .eq("id", designId)
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      name: string;
      status: DesignStatus;
      public_id: string | null;
      current_version_id: string | null;
    }>();

  if (!design) notFound();

  const [versions, references] = await Promise.all([
    listConceptVersions(design.id),
    listAssets(design.id, "SAREE_REFERENCE"),
  ]);

  const conceptAssets = await Promise.all(
    versions.map((version) => (version.woven_asset_id ? getAsset(version.woven_asset_id) : null)),
  );

  const keys = [
    ...references.map((asset) => asset.storage_key),
    ...conceptAssets.filter((asset) => asset !== null).map((asset) => asset.storage_key),
  ];
  const urls = await signedUrlsFor(keys);

  return (
    <StudioFrame step="woven" conceptId={design.public_id}>
      <WovenConceptPanel
        designId={design.id}
        originalUrl={references[0] ? urls.get(references[0].storage_key) ?? null : null}
        currentVersionId={design.current_version_id}
        initialJobId={job ?? null}
        suggestionsEnabled={isEnabled("ENABLE_AI_SUGGESTIONS")}
        drapeEnabled={isEnabled("ENABLE_NILA_DRAPE")}
        initialVersions={versions.map((version, index) => {
          const asset = conceptAssets[index];
          return {
            id: version.id,
            versionNumber: version.version_number,
            versionType: version.version_type,
            label: version.label,
            createdAt: version.created_at,
            imageUrl: asset ? urls.get(asset.storage_key) ?? null : null,
          };
        })}
      />
    </StudioFrame>
  );
}
