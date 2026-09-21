import { MAX_CONCEPTS_PER_DESIGN, MAX_GENERATIONS_PER_USER_PER_DAY } from "@/config/limits";
import { isEmpty } from "@/domain/composition";
import { DomainError } from "@/domain/errors";
import { generationIdempotencyKey, hashComposition } from "@/domain/ids";
import { requireEditableDesign, requireOwnedDesign, readJson, withAuthedRoute } from "@/lib/api/handler";
import { accepted, ok } from "@/lib/api/response";
import { recordAudit } from "@/lib/audit/audit-log";
import { enqueueJob, hasActiveJob } from "@/lib/jobs/queue";
import { kickWorker } from "@/lib/jobs/worker";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { signedUrlsFor } from "@/lib/storage/design-assets";
import {
  generationQuota,
  getLatestComposition,
  listAssets,
  listConceptVersions,
  getAsset,
} from "@/lib/studio/repository";

/**
 * Woven concept generation (§13, §14) and history (§17).
 *
 * Generation is asynchronous: this route validates, creates exactly one
 * idempotent job, and returns 202 with a job id the client polls. It never
 * holds the request open across the AI call (§85 Rule 9).
 */

type Params = { designId: string };

export const POST = withAuthedRoute<Params>(
  "POST /api/studio/designs/[designId]/woven-concepts",
  async (context) => {
    await enforceRateLimit("generation", context.userId);

    const design = await requireEditableDesign(context, context.params.designId);
    // A body is optional here: generating a fresh concept sends nothing,
    // while a "Make it better" revision sends a refinement.
    const body = await readJson<{ refinement?: unknown }>(context.request).catch(
      () => ({}) as { refinement?: unknown },
    );
    const refinement =
      typeof body.refinement === "string" && body.refinement.trim().length > 0
        ? body.refinement.trim().slice(0, 200)
        : null;

    // --- pre-generation validation (§13) ---------------------------------
    const references = await listAssets(design.id, "SAREE_REFERENCE");
    if (references.length === 0) throw new DomainError("TOO_FEW_SAREE_IMAGES");

    const compositionRow = await getLatestComposition(design.id);
    if (!compositionRow || isEmpty(compositionRow.composition_json)) {
      throw new DomainError("COMPOSITION_EMPTY");
    }

    // --- cost controls (§65) ----------------------------------------------
    const quota = await generationQuota(design.id, context.userId);
    if (quota.designConcepts >= MAX_CONCEPTS_PER_DESIGN) {
      throw new DomainError("GENERATION_LIMIT_REACHED", {
        details: { maximum: MAX_CONCEPTS_PER_DESIGN },
      });
    }
    if (quota.userJobsToday >= MAX_GENERATIONS_PER_USER_PER_DAY) {
      throw new DomainError("GENERATION_LIMIT_REACHED", {
        message: "You've reached today's limit for new concepts. Please try again tomorrow.",
        details: { maximum: MAX_GENERATIONS_PER_USER_PER_DAY },
      });
    }

    // Only one generation per design at a time (§55) — otherwise two concepts
    // race to become the current version and the customer sees whichever won.
    if (await hasActiveJob(design.id, "WOVEN_CONCEPT")) {
      throw new DomainError("GENERATION_IN_PROGRESS");
    }

    // --- enqueue (§14.6) ---------------------------------------------------
    // The key covers the composition and the refinement, so an unchanged
    // double-click reuses the job while a real edit creates a new one.
    const idempotencyKey = generationIdempotencyKey(
      design.id,
      hashComposition({ composition: compositionRow.composition_json, refinement }),
    );

    const { job, created: isNew } = await enqueueJob({
      designId: design.id,
      userId: context.userId,
      jobType: "WOVEN_CONCEPT",
      idempotencyKey,
      compositionId: compositionRow.id,
      sourceVersionId: design.current_version_id,
      input: refinement ? { refinement } : {},
    });

    if (isNew) {
      await recordAudit({
        action: "GENERATION_STARTED",
        entityType: "job",
        entityId: job.id,
        actorUserId: context.userId,
        metadata: { designId: design.id, refinement },
        request: context.clientInfo,
      });
      kickWorker();
    }

    return accepted(
      { jobId: job.id, status: job.status, deduplicated: !isNew },
      context.requestId,
    );
  },
);

export const GET = withAuthedRoute<Params>(
  "GET /api/studio/designs/[designId]/woven-concepts",
  async (context) => {
    const design = await requireOwnedDesign(context, context.params.designId);
    const versions = await listConceptVersions(design.id);

    const assets = await Promise.all(
      versions.map((version) => (version.woven_asset_id ? getAsset(version.woven_asset_id) : null)),
    );
    const keys = assets.filter((asset) => asset !== null).map((asset) => asset.storage_key);
    const urls = await signedUrlsFor(keys);

    return ok(
      {
        currentVersionId: design.current_version_id,
        versions: versions.map((version, index) => {
          const asset = assets[index];
          return {
            id: version.id,
            versionNumber: version.version_number,
            versionType: version.version_type,
            label: version.label,
            createdAt: version.created_at,
            // Provenance (§64) — which model and prompt produced this.
            provider: version.provider,
            model: version.model,
            promptVersion: version.prompt_version,
            imageUrl: asset ? urls.get(asset.storage_key) ?? null : null,
            width: asset?.width ?? null,
            height: asset?.height ?? null,
          };
        }),
      },
      context.requestId,
    );
  },
);

export const dynamic = "force-dynamic";
