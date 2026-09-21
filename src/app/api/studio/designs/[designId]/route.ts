import { MAX_DESIGNS_PER_CUSTOMER } from "@/config/limits";
import { DomainError } from "@/domain/errors";
import { readJson, requireOwnedDesign, withAuthedRoute } from "@/lib/api/handler";
import { noContent, ok } from "@/lib/api/response";
import { recordAudit } from "@/lib/audit/audit-log";
import { countDesigns, deleteDesignCompletely, renameDesign } from "@/lib/studio/repository";

/**
 * A single design: rename and delete (§22.1).
 *
 * Delete is permanent and removes the customer's uploads and concepts from
 * storage as well as the database — it is how they free a slot against the
 * per-customer design limit.
 */

type Params = { designId: string };

export const PATCH = withAuthedRoute<Params>(
  "PATCH /api/studio/designs/[designId]",
  async (context) => {
    const design = await requireOwnedDesign(context, context.params.designId);
    const body = await readJson<{ name?: unknown }>(context.request);

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length === 0 || name.length > 120) {
      throw new DomainError("VALIDATION_FAILED", {
        message: "A design name must be between 1 and 120 characters.",
      });
    }

    await renameDesign(design.id, name);
    return ok({ id: design.id, name }, context.requestId);
  },
);

export const DELETE = withAuthedRoute<Params>(
  "DELETE /api/studio/designs/[designId]",
  async (context) => {
    // Ownership first: the repository re-checks, but a clean 404 here means
    // the API never confirms an id exists to someone without access (§34.4).
    const design = await requireOwnedDesign(context, context.params.designId);

    await deleteDesignCompletely(design.id, context.userId);

    await recordAudit({
      action: "ASSET_DELETED",
      entityType: "design",
      entityId: design.id,
      actorUserId: context.userId,
      metadata: { conceptId: design.public_id, status: design.status },
      request: context.clientInfo,
    });

    context.log.info("Design deleted", { designId: design.id });
    return noContent();
  },
);

export const GET = withAuthedRoute<Params>(
  "GET /api/studio/designs/[designId]",
  async (context) => {
    const design = await requireOwnedDesign(context, context.params.designId);
    const used = await countDesigns(context.userId);

    return ok(
      {
        id: design.id,
        name: design.name,
        conceptId: design.public_id,
        status: design.status,
        slots: { used, maximum: MAX_DESIGNS_PER_CUSTOMER },
      },
      context.requestId,
    );
  },
);

export const dynamic = "force-dynamic";
