import { afterAll, describe, expect, it } from "vitest";
import { addObject, createTextObject, emptyComposition } from "@/domain/composition";
import { generationIdempotencyKey, hashComposition, isConceptId } from "@/domain/ids";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { storeUploadedImage } from "@/lib/storage/design-assets";
import {
  createDesign,
  getAnalysis,
  insertAsset,
  listConceptVersions,
  saveComposition,
} from "@/lib/studio/repository";
import { enqueueJob, getJob } from "./queue";
import { runWorkerTick } from "./worker";

/**
 * Real end-to-end pipeline test (§70.2).
 *
 * Runs the whole asynchronous path — design, asset, analysis, composition,
 * generation, immutable version — against a live Supabase project using the
 * mock AI provider, so it exercises real storage, real RLS-bypassing service
 * writes and the real §54 transactional commit without spending anything.
 *
 * Self-skips when the project isn't configured, so `npm test` stays green on
 * a machine with no credentials (the pattern rls-isolation.test.ts uses).
 */

const configured = isAdminConfigured();
const describeIf = configured ? describe : describe.skip;

/** A minimal but genuinely valid PNG, so upload validation passes for real. */
function png(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0, 0, 0, 13], 8);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

const createdUserIds: string[] = [];
const createdStorageKeys: string[] = [];

afterAll(async () => {
  if (!configured) return;
  const supabase = createAdminClient();

  // Storage objects are not cascaded by the user delete, so clear them first.
  if (createdStorageKeys.length > 0) {
    await supabase.storage.from("design-assets").remove(createdStorageKeys);
  }
  // Deleting the auth user cascades designs -> assets/jobs/versions via FKs.
  for (const userId of createdUserIds) {
    await supabase.auth.admin.deleteUser(userId).catch(() => undefined);
  }
});

describeIf("woven concept pipeline (live Supabase, mock AI)", () => {
  it("runs upload -> analysis -> composition -> generation -> version", async () => {
    const supabase = createAdminClient();

    // --- a real, isolated user -------------------------------------------
    const email = `pipeline-${crypto.randomUUID()}@velvorea-test.invalid`;
    const { data: created, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: true,
    });
    expect(userError).toBeNull();
    const userId = created!.user!.id;
    createdUserIds.push(userId);

    // --- design, with a real allocated concept id (§21) -------------------
    const design = await createDesign({ userId, name: "Pipeline test" });
    expect(design.public_id).toBeTruthy();
    expect(isConceptId(design.public_id!)).toBe(true);
    expect(design.status).toBe("DRAFT");

    // --- saree reference upload through the real validation path ----------
    const assetId = crypto.randomUUID();
    const stored = await storeUploadedImage({
      userId,
      designId: design.id,
      assetId,
      bytes: png(1200, 1800),
      declaredMimeType: "image/png",
    });
    createdStorageKeys.push(stored.storageKey);
    expect(stored.width).toBe(1200);
    expect(stored.checksum).toMatch(/^[0-9a-f]{64}$/);

    await insertAsset({
      id: assetId,
      designId: design.id,
      userId,
      type: "SAREE_REFERENCE",
      storageKey: stored.storageKey,
      originalFilename: "saree.png",
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      width: stored.width,
      height: stored.height,
      checksum: stored.checksum,
    });

    // --- analysis job ------------------------------------------------------
    const analysisJob = await enqueueJob({
      designId: design.id,
      userId,
      jobType: "SAREE_ANALYSIS",
      idempotencyKey: `analysis:${design.id}:1`,
    });
    expect(analysisJob.created).toBe(true);

    // The same key must not create a second job (§14.6).
    const duplicate = await enqueueJob({
      designId: design.id,
      userId,
      jobType: "SAREE_ANALYSIS",
      idempotencyKey: `analysis:${design.id}:1`,
    });
    expect(duplicate.created).toBe(false);
    expect(duplicate.job.id).toBe(analysisJob.job.id);

    let tick = await runWorkerTick({ maxJobs: 5 });
    expect(tick.succeeded).toBeGreaterThanOrEqual(1);

    const analysis = await getAnalysis(design.id);
    expect(analysis?.status).toBe("SUCCEEDED");
    expect(analysis?.analysis_json?.sareeDetected).toBe(true);
    expect(analysis?.analysis_json?.pallu).not.toBeNull();

    // --- composition -------------------------------------------------------
    const composition = addObject(
      emptyComposition(),
      createTextObject({ id: crypto.randomUUID(), text: "SEYAAN" }),
    );
    const savedComposition = await saveComposition({
      designId: design.id,
      userId,
      composition,
    });
    expect(savedComposition.version).toBe(1);

    // --- generation --------------------------------------------------------
    const conceptJob = await enqueueJob({
      designId: design.id,
      userId,
      jobType: "WOVEN_CONCEPT",
      idempotencyKey: generationIdempotencyKey(
        design.id,
        hashComposition({ composition, refinement: null }),
      ),
      compositionId: savedComposition.id,
    });
    expect(conceptJob.created).toBe(true);

    tick = await runWorkerTick({ maxJobs: 5 });

    const finished = await getJob(conceptJob.job.id);
    // Surface the real reason in the assertion message — otherwise cleanup
    // deletes the row and the failure is undiagnosable after the fact.
    expect(
      `${finished?.status} ${finished?.error_code ?? ""} ${finished?.error_message_safe ?? ""}`.trim(),
    ).toBe("SUCCEEDED");
    expect(finished?.provider).toBe("mock");
    expect(finished?.prompt_version).toBeTruthy();

    // --- the §54 atomic commit landed completely --------------------------
    const versions = await listConceptVersions(design.id);
    expect(versions).toHaveLength(1);
    expect(versions[0].version_number).toBe(1);
    expect(versions[0].woven_asset_id).toBeTruthy();
    expect(versions[0].prompt_version).toBeTruthy();

    const { data: refreshed } = await supabase
      .from("designs")
      .select("status, current_version_id")
      .eq("id", design.id)
      .single<{ status: string; current_version_id: string | null }>();

    expect(refreshed?.status).toBe("WOVEN_CONCEPT");
    expect(refreshed?.current_version_id).toBe(versions[0].id);

    // The generated image really exists in storage and is non-empty.
    const { data: conceptAsset } = await supabase
      .from("design_assets")
      .select("storage_key, size_bytes, type")
      .eq("id", versions[0].woven_asset_id!)
      .single<{ storage_key: string; size_bytes: number; type: string }>();

    expect(conceptAsset?.type).toBe("WOVEN_CONCEPT");
    expect(conceptAsset!.size_bytes).toBeGreaterThan(0);
    createdStorageKeys.push(conceptAsset!.storage_key);

    const download = await supabase.storage
      .from("design-assets")
      .download(conceptAsset!.storage_key);
    expect(download.error).toBeNull();
    const svg = await download.data!.text();
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("SEYAAN");

    // --- thumbnail derivative (§30.3) -------------------------------------
    const { data: withThumbnail } = await supabase
      .from("concept_versions")
      .select("thumbnail_asset_id")
      .eq("id", versions[0].id)
      .single<{ thumbnail_asset_id: string | null }>();

    expect(withThumbnail?.thumbnail_asset_id).toBeTruthy();

    const { data: thumbnailAsset } = await supabase
      .from("design_assets")
      .select("storage_key, mime_type, width, size_bytes")
      .eq("id", withThumbnail!.thumbnail_asset_id!)
      .single<{ storage_key: string; mime_type: string; width: number; size_bytes: number }>();

    expect(thumbnailAsset?.mime_type).toBe("image/webp");
    expect(thumbnailAsset!.width).toBeLessThanOrEqual(480);
    // The whole point: materially smaller than the full concept.
    expect(thumbnailAsset!.size_bytes).toBeLessThan(conceptAsset!.size_bytes);
    createdStorageKeys.push(thumbnailAsset!.storage_key);

    // --- lifecycle history was recorded (§29.13) --------------------------
    const { data: history } = await supabase
      .from("design_status_history")
      .select("from_status, to_status")
      .eq("design_id", design.id)
      .returns<Array<{ from_status: string | null; to_status: string }>>();

    expect(history?.some((row) => row.to_status === "WOVEN_CONCEPT")).toBe(true);

    // --- an empty queue must not yield a phantom job ----------------------
    const idle = await runWorkerTick({ maxJobs: 3 });
    expect(idle.claimed).toBe(0);
  }, 120_000);
});
