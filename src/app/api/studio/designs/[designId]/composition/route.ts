import { validateComposition } from "@/domain/composition";
import { DomainError } from "@/domain/errors";
import { readJson, requireEditableDesign, requireOwnedDesign, withAuthedRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { recordAudit } from "@/lib/audit/audit-log";
import { currentComposition, listAssets, saveComposition } from "@/lib/studio/repository";
import { referencedAssetIds } from "@/domain/composition";

/**
 * Composition read/write — the autosave endpoint (§9.3, §46).
 *
 * A save is an append, never an overwrite, so no customer edit is ever lost
 * to a bad write (§2.4, §2.5).
 */

type Params = { designId: string };

export const GET = withAuthedRoute<Params>(
  "GET /api/studio/designs/[designId]/composition",
  async (context) => {
    // Readable even once submitted — the customer can still view what they sent.
    const design = await requireOwnedDesign(context, context.params.designId);
    const composition = await currentComposition(design.id);
    return ok({ composition }, context.requestId);
  },
);

export const PUT = withAuthedRoute<Params>(
  "PUT /api/studio/designs/[designId]/composition",
  async (context) => {
    const design = await requireEditableDesign(context, context.params.designId);

    const body = await readJson<{ composition?: unknown }>(context.request);
    const result = validateComposition(body.composition);

    if (!result.valid || !result.composition) {
      throw new DomainError("COMPOSITION_INVALID", {
        details: { errors: result.errors.slice(0, 20) },
      });
    }

    // An object may only reference an asset that exists, belongs to this
    // design and has not been deleted (§13). Without this, a stale client
    // could pin a composition to another customer's asset id.
    const referenced = referencedAssetIds(result.composition);
    if (referenced.length > 0) {
      const assets = await listAssets(design.id, "IDEA_IMAGE");
      const available = new Set(assets.map((asset) => asset.id));
      const missing = referenced.filter((assetId) => !available.has(assetId));
      if (missing.length > 0) {
        throw new DomainError("COMPOSITION_INVALID", {
          message: "An image in this design is no longer available.",
          details: { missingAssetIds: missing },
        });
      }
    }

    const saved = await saveComposition({
      designId: design.id,
      userId: context.userId,
      composition: result.composition,
    });

    await recordAudit({
      action: "COMPOSITION_UPDATED",
      entityType: "design",
      entityId: design.id,
      actorUserId: context.userId,
      metadata: { version: saved.version, objects: result.composition.objects.length },
    });

    return ok(
      { compositionId: saved.id, version: saved.version, savedAt: saved.created_at },
      context.requestId,
    );
  },
);

export const dynamic = "force-dynamic";
