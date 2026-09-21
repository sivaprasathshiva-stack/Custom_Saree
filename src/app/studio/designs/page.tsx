import Link from "next/link";
import { redirect } from "next/navigation";
import { DesignsList, type DesignRow } from "@/components/studio/designs-list";
import { StudioFrame } from "@/components/studio/studio-frame";
import type { DesignStatus } from "@/domain/types";
import { signedUrlsFor } from "@/lib/storage/design-assets";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "My Designs — VELVOREA" };
export const dynamic = "force-dynamic";

interface DesignRecord {
  id: string;
  name: string;
  updated_at: string;
  status: DesignStatus;
  public_id: string | null;
  current_version_id: string | null;
}

/**
 * Resolves each design's thumbnail in one round trip rather than per card.
 *
 * Uses the THUMBNAIL derivative (§30.3), falling back to nothing rather than
 * the full-size concept — a grid of 2K images would be far worse than a grid
 * of placeholders.
 */
async function thumbnailsFor(designs: DesignRecord[]): Promise<Map<string, string>> {
  const versionIds = designs
    .map((design) => design.current_version_id)
    .filter((id): id is string => Boolean(id));

  if (versionIds.length === 0 || !isAdminConfigured()) return new Map();

  const supabase = createAdminClient();

  const { data: versions } = await supabase
    .from("concept_versions")
    .select("id, design_id, thumbnail_asset_id")
    .in("id", versionIds)
    .returns<Array<{ id: string; design_id: string; thumbnail_asset_id: string | null }>>();

  const assetIds = (versions ?? [])
    .map((version) => version.thumbnail_asset_id)
    .filter((id): id is string => Boolean(id));

  if (assetIds.length === 0) return new Map();

  const { data: assets } = await supabase
    .from("design_assets")
    .select("id, storage_key")
    .in("id", assetIds)
    .returns<Array<{ id: string; storage_key: string }>>();

  const urls = await signedUrlsFor((assets ?? []).map((asset) => asset.storage_key));
  const urlByAssetId = new Map(
    (assets ?? []).map((asset) => [asset.id, urls.get(asset.storage_key) ?? null]),
  );

  const byDesign = new Map<string, string>();
  for (const version of versions ?? []) {
    const url = version.thumbnail_asset_id
      ? urlByAssetId.get(version.thumbnail_asset_id)
      : null;
    if (url) byDesign.set(version.design_id, url);
  }
  return byDesign;
}

export default async function MyDesignsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <StudioFrame>
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <p className="text-sm text-gray">
            The studio isn&apos;t available in this environment.
          </p>
        </div>
      </StudioFrame>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/studio");

  // Everything except archived. The old filter looked for status = 'active',
  // a value no design carries since the lifecycle migration.
  const { data } = await supabase
    .from("designs")
    .select("id, name, updated_at, status, public_id, current_version_id")
    .eq("user_id", user.id)
    .neq("status", "ARCHIVED")
    .order("updated_at", { ascending: false })
    .returns<DesignRecord[]>();

  const designs = data ?? [];
  const thumbnails = await thumbnailsFor(designs);

  const rows: DesignRow[] = designs.map((design) => ({
    id: design.id,
    name: design.name,
    updated_at: design.updated_at,
    status: design.status,
    public_id: design.public_id,
    thumbnailUrl: thumbnails.get(design.id) ?? null,
  }));

  return (
    <StudioFrame>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl">My Designs</h1>
          <Link
            href="/studio/new"
            className="rounded-sm bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-soft"
          >
            Create Design
          </Link>
        </div>

        <DesignsList initialDesigns={rows} />
      </div>
    </StudioFrame>
  );
}
