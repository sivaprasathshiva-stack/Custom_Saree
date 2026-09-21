import { customerStatusLabel } from "@/domain/design-state";
import type { DesignStatus } from "@/domain/types";
import { withAuthedRoute } from "@/lib/api/handler";
import { created, ok } from "@/lib/api/response";
import { recordAudit } from "@/lib/audit/audit-log";
import { createDesign } from "@/lib/studio/repository";

/**
 * GET /api/studio/designs — My Designs (§22).
 * POST /api/studio/designs — start a new design (§4.2).
 */

interface DesignListRow {
  id: string;
  name: string;
  status: DesignStatus;
  public_id: string | null;
  created_at: string;
  updated_at: string;
}

export const GET = withAuthedRoute("GET /api/studio/designs", async (context) => {
  const { data, error } = await context.supabase
    .from("designs")
    .select("id, name, status, public_id, created_at, updated_at")
    .eq("user_id", context.userId)
    .neq("status", "ARCHIVED")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const designs = (data ?? []).map((row: DesignListRow) => ({
    id: row.id,
    name: row.name,
    conceptId: row.public_id,
    status: row.status,
    statusLabel: customerStatusLabel(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return ok({ designs }, context.requestId);
});

export const POST = withAuthedRoute("POST /api/studio/designs", async (context) => {
  const design = await createDesign({ userId: context.userId, name: "Untitled design" });

  await recordAudit({
    action: "DESIGN_CREATED",
    entityType: "design",
    entityId: design.id,
    actorUserId: context.userId,
    request: context.clientInfo,
  });

  return created(
    {
      id: design.id,
      name: design.name,
      conceptId: design.public_id,
      status: design.status,
      statusLabel: customerStatusLabel(design.status),
    },
    context.requestId,
  );
});

export const dynamic = "force-dynamic";
