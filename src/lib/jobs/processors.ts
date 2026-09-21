/**
 * Job processors (requirements §14.5, §54, §63).
 *
 * Each processor drives one job type through its named stages, calls a
 * provider behind the abstraction, validates what comes back before trusting
 * it, and commits the result atomically.
 *
 * A processor never mutates the customer's composition and never deletes their
 * work on failure (§85 Rule 11) — a failed job leaves the design exactly as it
 * was, which is what makes retry safe.
 */

import { emptyComposition } from "@/domain/composition";
import { DomainError } from "@/domain/errors";
import type { SareeAnalysisResult } from "@/domain/types";
import { providers } from "@/lib/ai/registry";
import { ProviderError, type GeneratedImage, type SourceImage } from "@/lib/ai/types";
import { recordAudit } from "@/lib/audit/audit-log";
import { logger } from "@/lib/observability/logger";
import { signedUrlFor, storeGeneratedImage } from "@/lib/storage/design-assets";
import {
  getAnalysis,
  getComposition,
  getDesign,
  insertAsset,
  listAssets,
  upsertAnalysis,
  type AssetRow,
} from "@/lib/studio/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordJobProvider, setJobStage, type JobRow } from "./queue";

async function toSourceImage(asset: AssetRow): Promise<SourceImage> {
  return {
    assetId: asset.id,
    url: await signedUrlFor(asset.storage_key),
    mimeType: asset.mime_type,
    width: asset.width,
    height: asset.height,
  };
}

/**
 * Output validation (§63). Never trust a provider's response: confirm the
 * image exists, is non-empty, declares sane dimensions and carries a media
 * type we are willing to serve.
 */
const SERVABLE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

function assertUsableImage(image: GeneratedImage | undefined | null): asserts image is GeneratedImage {
  // ArrayBuffer.isView rather than `instanceof Uint8Array`: a typed array that
  // crossed a realm boundary — a worker, a vm context, or jsdom under test —
  // fails the instanceof check despite being a perfectly good buffer.
  if (!image || !ArrayBuffer.isView(image.bytes) || image.bytes.byteLength === 0) {
    throw new DomainError("AI_OUTPUT_INVALID", { message: "The generated image was empty." });
  }
  if (!SERVABLE_MIME_TYPES.has(image.mimeType)) {
    throw new DomainError("AI_OUTPUT_INVALID", {
      message: "The generated image was in an unexpected format.",
      details: { mimeType: image.mimeType },
    });
  }
  if (!Number.isFinite(image.width) || !Number.isFinite(image.height) || image.width <= 0 || image.height <= 0) {
    throw new DomainError("AI_OUTPUT_INVALID", { message: "The generated image had no dimensions." });
  }
}

// --- saree analysis --------------------------------------------------------

export async function processSareeAnalysis(job: JobRow): Promise<void> {
  const log = logger.child({ jobId: job.id, designId: job.design_id });

  await setJobStage(job.id, "VALIDATE_INPUT");
  const references = await listAssets(job.design_id, "SAREE_REFERENCE");
  if (references.length === 0) {
    throw new DomainError("TOO_FEW_SAREE_IMAGES");
  }

  await upsertAnalysis({ designId: job.design_id, userId: job.user_id, status: "RUNNING" });

  await setJobStage(job.id, "PREPARE_ASSETS");
  const images = await Promise.all(references.map(toSourceImage));

  await setJobStage(job.id, "ANALYSE_LAYOUT");
  const provider = providers().analysis;
  const result = await provider.analyseSaree({ designId: job.design_id, images });

  await recordJobProvider(job.id, result.metadata);
  await upsertAnalysis({
    designId: job.design_id,
    userId: job.user_id,
    status: "SUCCEEDED",
    analysis: result.data,
    provider: result.metadata.provider,
    model: result.metadata.model,
    modelVersion: result.metadata.modelVersion,
  });

  await recordAudit({
    action: "ANALYSIS_COMPLETED",
    entityType: "design",
    entityId: job.design_id,
    actorUserId: job.user_id,
    metadata: { confidence: result.data.confidence, imageCount: images.length },
  });

  log.info("Saree analysis complete", { confidence: result.data.confidence });
}

// --- woven concept ---------------------------------------------------------

export async function processWovenConcept(job: JobRow): Promise<void> {
  const log = logger.child({ jobId: job.id, designId: job.design_id });

  await setJobStage(job.id, "VALIDATE_INPUT");

  const design = await getDesign(job.design_id);
  if (!design) throw new DomainError("DESIGN_NOT_FOUND");

  const references = await listAssets(job.design_id, "SAREE_REFERENCE");
  if (references.length === 0) throw new DomainError("TOO_FEW_SAREE_IMAGES");

  // The job pins the exact composition it was created from, so a customer
  // editing while generation runs cannot change what is being produced.
  const compositionRow = job.composition_id ? await getComposition(job.composition_id) : null;
  const composition = compositionRow?.composition_json ?? emptyComposition();

  const ideaAssets = await listAssets(job.design_id, "IDEA_IMAGE");
  const analysisRow = await getAnalysis(job.design_id);
  const analysis: SareeAnalysisResult | null =
    analysisRow?.status === "SUCCEEDED" ? analysisRow.analysis_json : null;

  await setJobStage(job.id, "PREPARE_ASSETS");
  const sareeImages = await Promise.all(references.map(toSourceImage));
  const ideaImage = ideaAssets.length > 0 ? await toSourceImage(ideaAssets[0]) : null;

  await setJobStage(job.id, "GENERATE_CONCEPT");
  const refinement =
    typeof job.input_snapshot_json?.refinement === "string"
      ? (job.input_snapshot_json.refinement as string)
      : null;

  const result = await providers().concept.generateWovenConcept({
    designId: job.design_id,
    sareeImages,
    ideaImage,
    analysis,
    composition,
    refinement,
  });

  await setJobStage(job.id, "POST_PROCESS");
  assertUsableImage(result.data);
  await recordJobProvider(job.id, result.metadata);

  await setJobStage(job.id, "STORE_ASSET");
  const assetId = crypto.randomUUID();
  const stored = await storeGeneratedImage({
    userId: job.user_id,
    designId: job.design_id,
    assetId,
    bytes: result.data.bytes,
    mimeType: result.data.mimeType,
    width: result.data.width,
    height: result.data.height,
  });

  await setJobStage(job.id, "CREATE_VERSION");

  // One transaction: asset row, immutable version, design pointer, lifecycle
  // state, job closure and history (§54). Either all of it lands or none does.
  const { data: versionId, error } = await createAdminClient().rpc("complete_woven_concept_job", {
    p_job_id: job.id,
    p_asset_id: assetId,
    p_storage_key: stored.storageKey,
    p_mime_type: stored.mimeType,
    p_size_bytes: stored.sizeBytes,
    p_width: stored.width,
    p_height: stored.height,
    p_checksum: stored.checksum,
    p_provider: result.metadata.provider,
    p_model: result.metadata.model,
    p_model_version: result.metadata.modelVersion,
    p_prompt_version: result.metadata.promptVersion,
    p_version_type: refinement ? "AI_REVISION" : "INITIAL",
    p_label: refinement,
  });

  if (error) {
    log.error("Concept commit failed", { error });
    throw new DomainError("INTERNAL_ERROR", { cause: error });
  }

  await recordAudit({
    action: refinement ? "REVISION_CREATED" : "GENERATION_COMPLETED",
    entityType: "version",
    entityId: typeof versionId === "string" ? versionId : null,
    actorUserId: job.user_id,
    metadata: { designId: job.design_id, provider: result.metadata.provider, refinement },
  });

  log.info("Woven concept created", { versionId, latencyMs: result.metadata.latencyMs });
}

// --- drape -----------------------------------------------------------------

export async function processDrape(job: JobRow): Promise<void> {
  const log = logger.child({ jobId: job.id, designId: job.design_id });
  const supabase = createAdminClient();

  await setJobStage(job.id, "VALIDATE_INPUT");

  const drapeId = job.input_snapshot_json?.drapeId;
  const style = job.input_snapshot_json?.style;
  if (typeof drapeId !== "string" || typeof style !== "string") {
    throw new DomainError("VALIDATION_FAILED", { message: "The drape request was incomplete." });
  }

  const { data: drape } = await supabase
    .from("drapes")
    .select("id, concept_version_id")
    .eq("id", drapeId)
    .maybeSingle<{ id: string; concept_version_id: string }>();
  if (!drape) throw new DomainError("DRAPE_NOT_FOUND");

  const { data: version } = await supabase
    .from("concept_versions")
    .select("id, woven_asset_id")
    .eq("id", drape.concept_version_id)
    .maybeSingle<{ id: string; woven_asset_id: string | null }>();
  if (!version?.woven_asset_id) throw new DomainError("CONCEPT_NOT_READY");

  const { data: conceptAsset } = await supabase
    .from("design_assets")
    .select("*")
    .eq("id", version.woven_asset_id)
    .maybeSingle<AssetRow>();
  if (!conceptAsset) throw new DomainError("ASSET_NOT_FOUND");

  await supabase.from("drapes").update({ status: "RUNNING" }).eq("id", drapeId);

  await setJobStage(job.id, "PREPARE_ASSETS");
  const concept = await toSourceImage(conceptAsset);

  await setJobStage(job.id, "GENERATE_CONCEPT");
  const result = await providers().drape.generateDrape({
    designId: job.design_id,
    conceptVersionId: version.id,
    style,
    concept,
  });

  await setJobStage(job.id, "POST_PROCESS");
  await recordJobProvider(job.id, result.metadata);

  if (result.data.mode !== "IMAGE_SEQUENCE") {
    // 3D is behind a feature flag and has no asset pipeline yet; refuse
    // clearly rather than storing something the viewer cannot render.
    throw new DomainError("AI_OUTPUT_INVALID", { message: "This drape format isn't supported yet." });
  }

  for (const frame of result.data.frames) assertUsableImage(frame);
  assertUsableImage(result.data.preview);

  await setJobStage(job.id, "STORE_ASSET");

  const frameRows: Array<Record<string, unknown>> = [];
  for (const [index, frame] of result.data.frames.entries()) {
    const stored = await storeGeneratedImage({
      userId: job.user_id,
      designId: job.design_id,
      assetId: crypto.randomUUID(),
      bytes: frame.bytes,
      mimeType: frame.mimeType,
      width: frame.width,
      height: frame.height,
      variant: `drape/${drapeId}/frame-${String(index).padStart(4, "0")}`,
    });
    frameRows.push({
      drape_id: drapeId,
      user_id: job.user_id,
      asset_type: "FRAME",
      storage_key: stored.storageKey,
      frame_index: index,
      width: stored.width,
      height: stored.height,
      mime_type: stored.mimeType,
    });
  }

  const preview = await storeGeneratedImage({
    userId: job.user_id,
    designId: job.design_id,
    assetId: crypto.randomUUID(),
    bytes: result.data.preview.bytes,
    mimeType: result.data.preview.mimeType,
    width: result.data.preview.width,
    height: result.data.preview.height,
    variant: `drape/${drapeId}/preview`,
  });

  frameRows.push({
    drape_id: drapeId,
    user_id: job.user_id,
    asset_type: "PREVIEW",
    storage_key: preview.storageKey,
    frame_index: null,
    width: preview.width,
    height: preview.height,
    mime_type: preview.mimeType,
  });

  const { error: frameError } = await supabase.from("drape_assets").insert(frameRows);
  if (frameError) throw new DomainError("INTERNAL_ERROR", { cause: frameError });

  await supabase
    .from("drapes")
    .update({ status: "SUCCEEDED", mode: "IMAGE_SEQUENCE", provider: result.metadata.provider, completed_at: new Date().toISOString() })
    .eq("id", drapeId);

  // The concept asset is also registered as the drape's design-level preview
  // so My Designs can show a thumbnail without loading a frame sequence.
  await insertAsset({
    id: crypto.randomUUID(),
    designId: job.design_id,
    userId: job.user_id,
    type: "DRAPE_PREVIEW",
    storageKey: preview.storageKey,
    originalFilename: null,
    mimeType: preview.mimeType,
    sizeBytes: preview.sizeBytes,
    width: preview.width,
    height: preview.height,
    checksum: preview.checksum,
  });

  await recordAudit({
    action: "DRAPE_COMPLETED",
    entityType: "drape",
    entityId: drapeId,
    actorUserId: job.user_id,
    metadata: { style, frames: result.data.frames.length },
  });

  log.info("Drape complete", { drapeId, style, frames: result.data.frames.length });
}

// --- dispatch --------------------------------------------------------------

export async function processJob(job: JobRow): Promise<void> {
  switch (job.job_type) {
    case "SAREE_ANALYSIS":
      return processSareeAnalysis(job);
    case "WOVEN_CONCEPT":
      return processWovenConcept(job);
    case "DRAPE":
      return processDrape(job);
  }
}

/** Marks the side-effect rows a failed job left behind, so the UI can recover. */
export async function markJobSideEffectsFailed(job: JobRow, errorCode: string): Promise<void> {
  try {
    if (job.job_type === "SAREE_ANALYSIS") {
      await upsertAnalysis({
        designId: job.design_id,
        userId: job.user_id,
        status: "FAILED",
        errorCode,
      });
    }
    if (job.job_type === "DRAPE" && typeof job.input_snapshot_json?.drapeId === "string") {
      await createAdminClient()
        .from("drapes")
        .update({ status: "FAILED" })
        .eq("id", job.input_snapshot_json.drapeId as string);
    }
  } catch (error) {
    logger.error("Failed to mark job side effects", { jobId: job.id, error });
  }
}

export { ProviderError };
