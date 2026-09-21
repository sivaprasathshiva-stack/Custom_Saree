import { isEnabled } from "@/config/feature-flags";
import { SUPPORTED_DRAPE_STYLES } from "@/config/limits";
import { DomainError } from "@/domain/errors";
import { readJson, requireOwnedDesign, withAuthedRoute } from "@/lib/api/handler";
import { accepted, ok } from "@/lib/api/response";
import { recordAudit } from "@/lib/audit/audit-log";
import { enqueueJob, hasActiveJob } from "@/lib/jobs/queue";
import { kickWorker } from "@/lib/jobs/worker";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { loadDrapes } from "@/lib/studio/drape-service";
import { getConceptVersion } from "@/lib/studio/repository";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * NILA drape (§19).
 *
 * Drapes are cached per (concept version, style): re-selecting a style the
 * customer already viewed is free and instant, and the unique constraint in
 * schema.sql makes that true even under concurrent requests.
 */

type Params = { designId: string };

export const GET = withAuthedRoute<Params>(
  "GET /api/studio/designs/[designId]/drapes",
  async (context) => {
    const design = await requireOwnedDesign(context, context.params.designId);
    return ok(await loadDrapes(design.id), context.requestId);
  },
);

export const POST = withAuthedRoute<Params>(
  "POST /api/studio/designs/[designId]/drapes",
  async (context) => {
    if (!isEnabled("ENABLE_NILA_DRAPE")) throw new DomainError("FEATURE_DISABLED");
    await enforceRateLimit("drape", context.userId);

    const design = await requireOwnedDesign(context, context.params.designId);
    const body = await readJson<{ style?: unknown; conceptVersionId?: unknown }>(context.request);

    const style = String(body.style ?? "");
    if (!SUPPORTED_DRAPE_STYLES.includes(style)) {
      throw new DomainError("VALIDATION_FAILED", {
        message: "That drape style isn't available.",
        details: { supported: SUPPORTED_DRAPE_STYLES },
      });
    }

    const versionId =
      typeof body.conceptVersionId === "string" ? body.conceptVersionId : design.current_version_id;
    if (!versionId) throw new DomainError("CONCEPT_NOT_READY");

    const version = await getConceptVersion(versionId);
    if (!version || version.design_id !== design.id) throw new DomainError("VERSION_NOT_FOUND");
    if (!version.woven_asset_id) throw new DomainError("CONCEPT_NOT_READY");

    const supabase = createAdminClient();

    // Already generated for this version and style — hand it straight back.
    const { data: existing } = await supabase
      .from("drapes")
      .select("id, status")
      .eq("concept_version_id", versionId)
      .eq("style", style)
      .maybeSingle<{ id: string; status: string }>();

    if (existing?.status === "SUCCEEDED") {
      return ok({ drapeId: existing.id, status: existing.status, cached: true }, context.requestId);
    }
    if (existing && (existing.status === "PENDING" || existing.status === "RUNNING")) {
      return accepted({ drapeId: existing.id, status: existing.status }, context.requestId);
    }

    const drapeId = existing?.id ?? crypto.randomUUID();
    if (!existing) {
      const { error } = await supabase.from("drapes").insert({
        id: drapeId,
        design_id: design.id,
        user_id: context.userId,
        concept_version_id: versionId,
        style,
        status: "PENDING",
        mode: "IMAGE_SEQUENCE",
      });
      if (error) throw new DomainError("INTERNAL_ERROR", { cause: error });
    } else {
      // A previously failed drape is retried in place rather than duplicated.
      await supabase.from("drapes").update({ status: "PENDING" }).eq("id", drapeId);
    }

    if (await hasActiveJob(design.id, "DRAPE")) {
      return accepted({ drapeId, status: "PENDING" }, context.requestId);
    }

    const { job } = await enqueueJob({
      designId: design.id,
      userId: context.userId,
      jobType: "DRAPE",
      idempotencyKey: `drape:${versionId}:${style}`,
      input: { drapeId, style },
    });

    await recordAudit({
      action: "DRAPE_STARTED",
      entityType: "drape",
      entityId: drapeId,
      actorUserId: context.userId,
      metadata: { designId: design.id, style },
    });

    kickWorker();

    return accepted({ drapeId, jobId: job.id, status: "PENDING" }, context.requestId);
  },
);

export const dynamic = "force-dynamic";
