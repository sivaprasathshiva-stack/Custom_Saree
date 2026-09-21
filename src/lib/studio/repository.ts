/**
 * Data access for the Studio (requirements §60).
 *
 * Route handlers and job processors talk to this module, never to the database
 * client directly, so query shape and row-to-domain mapping live in one place.
 *
 * These functions use the service-role client and therefore bypass RLS. Every
 * caller is responsible for having authorized the request first — the helpers
 * in `src/lib/api/handler.ts` do that through the user-scoped client, which is
 * the layer RLS actually protects.
 */

import {
  type Composition,
  COMPOSITION_SCHEMA_VERSION,
  emptyComposition,
} from "@/domain/composition";
import { DomainError } from "@/domain/errors";
import type {
  AnalysisStatus,
  AssetType,
  DesignStatus,
  SareeAnalysisResult,
  VersionType,
} from "@/domain/types";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";

function admin() {
  if (!isAdminConfigured()) {
    throw new DomainError("NOT_CONFIGURED", { message: "The studio database is not configured." });
  }
  return createAdminClient();
}

// --- designs ---------------------------------------------------------------

export interface DesignRow {
  id: string;
  user_id: string;
  name: string;
  status: DesignStatus;
  public_id: string | null;
  current_version_id: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Creates a design and allocates its concept id in the same step.
 *
 * The id comes from `allocate_concept_id()` rather than being composed here,
 * because only the database can guarantee two simultaneous creations get
 * different numbers (§21).
 */
export async function createDesign(params: { userId: string; name: string }): Promise<DesignRow> {
  const supabase = admin();

  const { data: conceptId, error: idError } = await supabase.rpc("allocate_concept_id");
  if (idError || typeof conceptId !== "string") {
    logger.error("Concept id allocation failed", { error: idError });
    throw new DomainError("INTERNAL_ERROR", { cause: idError });
  }

  const { data, error } = await supabase
    .from("designs")
    .insert({
      user_id: params.userId,
      name: params.name,
      public_id: conceptId,
      status: "DRAFT" satisfies DesignStatus,
      // The legacy configurator column is NOT NULL; the new Studio keeps no
      // state here, so an empty object satisfies it without implying content.
      design: {},
    })
    .select("*")
    .single<DesignRow>();

  if (error || !data) {
    logger.error("Design creation failed", { error });
    throw new DomainError("INTERNAL_ERROR", { cause: error });
  }
  return data;
}

export async function getDesign(designId: string): Promise<DesignRow | null> {
  const { data } = await admin().from("designs").select("*").eq("id", designId).maybeSingle<DesignRow>();
  return data ?? null;
}

export async function updateDesignStatus(
  designId: string,
  status: DesignStatus,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await admin()
    .from("designs")
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq("id", designId);
  if (error) throw new DomainError("INTERNAL_ERROR", { cause: error });
}

export async function renameDesign(designId: string, name: string): Promise<void> {
  await admin().from("designs").update({ name, updated_at: new Date().toISOString() }).eq("id", designId);
}

// --- assets ----------------------------------------------------------------

export interface AssetRow {
  id: string;
  design_id: string;
  user_id: string;
  type: AssetType;
  storage_key: string;
  original_filename: string | null;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  checksum: string | null;
  created_at: string;
  deleted_at: string | null;
}

export async function insertAsset(params: {
  id: string;
  designId: string;
  userId: string;
  type: AssetType;
  storageKey: string;
  originalFilename: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  checksum: string | null;
}): Promise<AssetRow> {
  const { data, error } = await admin()
    .from("design_assets")
    .insert({
      id: params.id,
      design_id: params.designId,
      user_id: params.userId,
      type: params.type,
      storage_key: params.storageKey,
      original_filename: params.originalFilename,
      mime_type: params.mimeType,
      size_bytes: params.sizeBytes,
      width: params.width,
      height: params.height,
      checksum: params.checksum,
    })
    .select("*")
    .single<AssetRow>();

  if (error || !data) throw new DomainError("INTERNAL_ERROR", { cause: error });
  return data;
}

/** Live assets only — a soft-deleted asset is invisible to every caller. */
export async function listAssets(designId: string, type?: AssetType): Promise<AssetRow[]> {
  let query = admin()
    .from("design_assets")
    .select("*")
    .eq("design_id", designId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw new DomainError("INTERNAL_ERROR", { cause: error });
  return (data ?? []) as AssetRow[];
}

export async function getAsset(assetId: string): Promise<AssetRow | null> {
  const { data } = await admin()
    .from("design_assets")
    .select("*")
    .eq("id", assetId)
    .is("deleted_at", null)
    .maybeSingle<AssetRow>();
  return data ?? null;
}

export async function softDeleteAsset(assetId: string): Promise<void> {
  await admin()
    .from("design_assets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", assetId);
}

export async function countAssets(designId: string, type: AssetType): Promise<number> {
  const { count, error } = await admin()
    .from("design_assets")
    .select("id", { count: "exact", head: true })
    .eq("design_id", designId)
    .eq("type", type)
    .is("deleted_at", null);

  if (error) throw new DomainError("INTERNAL_ERROR", { cause: error });
  return count ?? 0;
}

// --- compositions ----------------------------------------------------------

export interface CompositionRow {
  id: string;
  design_id: string;
  version: number;
  composition_json: Composition;
  created_at: string;
}

/**
 * Appends a composition revision.
 *
 * Autosave writes a new row rather than updating one, so the customer's work
 * is recoverable even if a later save is wrong or partial (§2.5).
 */
export async function saveComposition(params: {
  designId: string;
  userId: string;
  composition: Composition;
}): Promise<CompositionRow> {
  const supabase = admin();

  const { data: latest } = await supabase
    .from("compositions")
    .select("version")
    .eq("design_id", params.designId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<{ version: number }>();

  const nextVersion = (latest?.version ?? 0) + 1;

  const { data, error } = await supabase
    .from("compositions")
    .insert({
      design_id: params.designId,
      user_id: params.userId,
      version: nextVersion,
      canvas_schema_version: COMPOSITION_SCHEMA_VERSION,
      composition_json: params.composition,
    })
    .select("id, design_id, version, composition_json, created_at")
    .single<CompositionRow>();

  if (error || !data) {
    // A unique-violation here means a concurrent save took this version
    // number. Last-write-wins is acceptable for V1 (§46.2, one customer per
    // design), so report it as a conflict the client can resolve by reloading
    // rather than losing the newer write.
    if (error?.code === "23505") throw new DomainError("CONFLICT");
    throw new DomainError("INTERNAL_ERROR", { cause: error });
  }
  return data;
}

export async function getLatestComposition(designId: string): Promise<CompositionRow | null> {
  const { data } = await admin()
    .from("compositions")
    .select("id, design_id, version, composition_json, created_at")
    .eq("design_id", designId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<CompositionRow>();
  return data ?? null;
}

export async function getComposition(compositionId: string): Promise<CompositionRow | null> {
  const { data } = await admin()
    .from("compositions")
    .select("id, design_id, version, composition_json, created_at")
    .eq("id", compositionId)
    .maybeSingle<CompositionRow>();
  return data ?? null;
}

export async function currentComposition(designId: string): Promise<Composition> {
  const row = await getLatestComposition(designId);
  return row?.composition_json ?? emptyComposition();
}

// --- analysis --------------------------------------------------------------

export interface AnalysisRow {
  id: string;
  design_id: string;
  status: AnalysisStatus;
  analysis_json: SareeAnalysisResult | null;
  confidence: number | null;
  error_code: string | null;
  completed_at: string | null;
}

export async function upsertAnalysis(params: {
  designId: string;
  userId: string;
  status: AnalysisStatus;
  analysis?: SareeAnalysisResult;
  provider?: string;
  model?: string;
  modelVersion?: string;
  errorCode?: string;
}): Promise<void> {
  const { error } = await admin()
    .from("saree_analysis")
    .upsert(
      {
        design_id: params.designId,
        user_id: params.userId,
        status: params.status,
        analysis_json: params.analysis ?? null,
        provider: params.provider ?? null,
        model: params.model ?? null,
        model_version: params.modelVersion ?? null,
        confidence: params.analysis?.confidence ?? null,
        error_code: params.errorCode ?? null,
        completed_at:
          params.status === "SUCCEEDED" || params.status === "FAILED"
            ? new Date().toISOString()
            : null,
      },
      { onConflict: "design_id" },
    );

  if (error) throw new DomainError("INTERNAL_ERROR", { cause: error });
}

export async function getAnalysis(designId: string): Promise<AnalysisRow | null> {
  const { data } = await admin()
    .from("saree_analysis")
    .select("id, design_id, status, analysis_json, confidence, error_code, completed_at")
    .eq("design_id", designId)
    .maybeSingle<AnalysisRow>();
  return data ?? null;
}

// --- concept versions ------------------------------------------------------

export interface ConceptVersionRow {
  id: string;
  design_id: string;
  version_number: number;
  version_type: VersionType;
  source_version_id: string | null;
  woven_asset_id: string | null;
  thumbnail_asset_id: string | null;
  provider: string | null;
  model: string | null;
  model_version: string | null;
  prompt_version: string | null;
  label: string | null;
  created_at: string;
}

const CONCEPT_VERSION_COLUMNS =
  "id, design_id, version_number, version_type, source_version_id, woven_asset_id, thumbnail_asset_id, provider, model, model_version, prompt_version, label, created_at";

export async function listConceptVersions(designId: string): Promise<ConceptVersionRow[]> {
  const { data, error } = await admin()
    .from("concept_versions")
    .select(CONCEPT_VERSION_COLUMNS)
    .eq("design_id", designId)
    .order("version_number", { ascending: false });

  if (error) throw new DomainError("INTERNAL_ERROR", { cause: error });
  return (data ?? []) as ConceptVersionRow[];
}

export async function getConceptVersion(versionId: string): Promise<ConceptVersionRow | null> {
  const { data } = await admin()
    .from("concept_versions")
    .select(CONCEPT_VERSION_COLUMNS)
    .eq("id", versionId)
    .maybeSingle<ConceptVersionRow>();
  return data ?? null;
}

// --- generation quota (§65) ------------------------------------------------

export async function generationQuota(
  designId: string,
  userId: string,
): Promise<{ designConcepts: number; userJobsToday: number }> {
  const { data, error } = await admin()
    .rpc("generation_quota", { p_design_id: designId, p_user_id: userId })
    .single<{ design_concepts: number; user_jobs_today: number }>();

  if (error || !data) {
    logger.warn("Quota check unavailable", { designId, error });
    // Fail closed on quota: an unknown spend is worse than a blocked request.
    throw new DomainError("INTERNAL_ERROR", { cause: error });
  }
  return { designConcepts: data.design_concepts, userJobsToday: data.user_jobs_today };
}
