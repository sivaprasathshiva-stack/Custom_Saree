/**
 * Append-only audit log (requirements §50, §29.15).
 *
 * Writes go through the service-role client because `audit_logs` has no RLS
 * policy for anyone — that is deliberate. A table an actor can write directly
 * is a table they can forge, and one they can update is not an audit log.
 *
 * Recording an audit event must never fail the operation it is describing: a
 * customer's submission does not get rolled back because the log was briefly
 * unavailable. Failures are logged loudly and swallowed.
 */

import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";

/** The actions worth reconstructing after the fact (§50). */
export const AUDIT_ACTIONS = [
  "DESIGN_CREATED",
  "ASSET_UPLOADED",
  "ASSET_DELETED",
  "COMPOSITION_UPDATED",
  "ANALYSIS_STARTED",
  "ANALYSIS_COMPLETED",
  "GENERATION_STARTED",
  "GENERATION_COMPLETED",
  "GENERATION_FAILED",
  "REVISION_CREATED",
  "DRAPE_STARTED",
  "DRAPE_COMPLETED",
  "SUBMISSION_CREATED",
  "STATUS_CHANGED",
  "ADMIN_VIEWED_DESIGN",
  "INTERNAL_NOTE_CREATED",
  "USER_ROLE_CHANGED",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditEntityType = "design" | "asset" | "job" | "version" | "drape" | "submission" | "user";

export interface AuditEvent {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  actorUserId: string | null;
  metadata?: Record<string, unknown>;
  /** Raw request headers, hashed before storage — never persisted as-is. */
  request?: { ip?: string | null; userAgent?: string | null };
}

/**
 * One-way hash for IP and user-agent. §29.15 says store the minimum needed
 * for security and audit; a hash still lets you spot "same client, many
 * accounts" without retaining anything identifying.
 */
async function hash(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  const salt = process.env.AUDIT_HASH_SALT ?? "velvorea-audit";
  const bytes = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer as ArrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export async function recordAudit(event: AuditEvent): Promise<void> {
  if (!isAdminConfigured()) {
    logger.debug("Audit skipped — service role not configured", { action: event.action });
    return;
  }

  try {
    const [ipHash, userAgentHash] = await Promise.all([
      hash(event.request?.ip),
      hash(event.request?.userAgent),
    ]);

    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      actor_user_id: event.actorUserId,
      action: event.action,
      entity_type: event.entityType,
      entity_id: event.entityId,
      metadata_json: event.metadata ?? null,
      ip_hash: ipHash,
      user_agent_hash: userAgentHash,
    });

    if (error) {
      logger.error("Audit write failed", { action: event.action, error });
    }
  } catch (error) {
    // Never propagate: the audited operation has already succeeded.
    logger.error("Audit write threw", { action: event.action, error });
  }
}

/**
 * Records a lifecycle change in both the audit log and the design's own
 * timeline. The timeline is customer-visible (§22.3); the audit log is not.
 */
export async function recordStatusChange(params: {
  designId: string;
  fromStatus: string | null;
  toStatus: string;
  actorUserId: string | null;
  reason?: string;
}): Promise<void> {
  if (!isAdminConfigured()) return;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("design_status_history").insert({
      design_id: params.designId,
      from_status: params.fromStatus,
      to_status: params.toStatus,
      changed_by_user_id: params.actorUserId,
      reason: params.reason ?? null,
    });
    if (error) logger.error("Status history write failed", { designId: params.designId, error });
  } catch (error) {
    logger.error("Status history write threw", { designId: params.designId, error });
  }

  await recordAudit({
    action: "STATUS_CHANGED",
    entityType: "design",
    entityId: params.designId,
    actorUserId: params.actorUserId,
    metadata: { from: params.fromStatus, to: params.toStatus, reason: params.reason ?? null },
  });
}
