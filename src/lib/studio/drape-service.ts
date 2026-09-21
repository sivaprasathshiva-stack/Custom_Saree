import { SUPPORTED_DRAPE_STYLES } from "@/config/limits";
import { signedUrlsFor } from "@/lib/storage/design-assets";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Drape reads, shared by the drape page and its API route.
 *
 * One implementation so the server-rendered first paint and any later refresh
 * can never disagree about what the customer has.
 */

export interface DrapeView {
  id: string;
  style: string;
  mode: string;
  conceptVersionId: string;
  frames: string[];
  previewUrl: string | null;
}

export interface DrapesView {
  styles: readonly string[];
  drapes: DrapeView[];
  pending: Array<{ id: string; style: string; status: string }>;
  disclaimer: string;
}

/** §25 — shown beneath every drape, never paraphrased or omitted. */
export const DRAPE_DISCLAIMER =
  "The drape is a visual representation. Final textile behaviour may vary depending on weave, yarn, weight and production specifications.";

interface DrapeRow {
  id: string;
  concept_version_id: string;
  style: string;
  status: string;
  mode: string;
  created_at: string;
}

/**
 * Callers must have already authorized access to `designId` — this reads with
 * the service-role client and performs no ownership check of its own.
 */
export async function loadDrapes(designId: string): Promise<DrapesView> {
  const supabase = createAdminClient();

  const { data: drapes } = await supabase
    .from("drapes")
    .select("id, concept_version_id, style, status, mode, created_at")
    .eq("design_id", designId)
    .order("created_at", { ascending: false })
    .returns<DrapeRow[]>();

  const rows = drapes ?? [];
  const succeeded = rows.filter((drape) => drape.status === "SUCCEEDED");

  const withFrames = await Promise.all(
    succeeded.map(async (drape) => {
      const { data: assets } = await supabase
        .from("drape_assets")
        .select("storage_key, asset_type, frame_index")
        .eq("drape_id", drape.id)
        .order("frame_index", { ascending: true, nullsFirst: false })
        .returns<Array<{ storage_key: string; asset_type: string; frame_index: number | null }>>();

      const entries = assets ?? [];
      const urls = await signedUrlsFor(entries.map((asset) => asset.storage_key));

      return {
        id: drape.id,
        style: drape.style,
        mode: drape.mode,
        conceptVersionId: drape.concept_version_id,
        frames: entries
          .filter((asset) => asset.asset_type === "FRAME")
          .map((asset) => urls.get(asset.storage_key))
          .filter((url): url is string => Boolean(url)),
        previewUrl:
          entries
            .filter((asset) => asset.asset_type === "PREVIEW")
            .map((asset) => urls.get(asset.storage_key) ?? null)[0] ?? null,
      };
    }),
  );

  return {
    styles: SUPPORTED_DRAPE_STYLES,
    drapes: withFrames,
    pending: rows
      .filter((drape) => drape.status === "PENDING" || drape.status === "RUNNING")
      .map((drape) => ({ id: drape.id, style: drape.style, status: drape.status })),
    disclaimer: DRAPE_DISCLAIMER,
  };
}
