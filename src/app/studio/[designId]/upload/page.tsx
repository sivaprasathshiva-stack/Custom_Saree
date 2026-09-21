import { notFound, redirect } from "next/navigation";
import { StudioFrame } from "@/components/studio/studio-frame";
import { UploadPanel } from "@/components/studio/upload-panel";
import { isCustomerEditable } from "@/domain/design-state";
import type { DesignStatus } from "@/domain/types";
import { signedUrlsFor } from "@/lib/storage/design-assets";
import { listAssets } from "@/lib/studio/repository";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Upload your saree — VELVOREA" };

export default async function UploadPage({
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

  // The user-scoped client means RLS enforces ownership here; the explicit
  // user_id filter makes that intent readable rather than implicit.
  const { data: design } = await supabase
    .from("designs")
    .select("id, name, status, public_id")
    .eq("id", designId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; name: string; status: DesignStatus; public_id: string | null }>();

  if (!design) notFound();
  if (!isCustomerEditable(design.status)) redirect(`/studio/${designId}/woven`);

  const assets = await listAssets(design.id, "SAREE_REFERENCE");
  const urls = await signedUrlsFor(assets.map((asset) => asset.storage_key));

  return (
    <StudioFrame step="upload" conceptId={design.public_id}>
      <UploadPanel
        designId={design.id}
        initialAssets={assets.map((asset) => ({
          id: asset.id,
          type: asset.type,
          url: urls.get(asset.storage_key) ?? null,
          originalFilename: asset.original_filename,
        }))}
      />
    </StudioFrame>
  );
}
