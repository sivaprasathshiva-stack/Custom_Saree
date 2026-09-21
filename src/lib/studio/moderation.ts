/**
 * Content moderation (requirements §36).
 *
 * Screens customer-supplied images and text before they can become a woven
 * concept or reach VELVOREA's design team.
 *
 * Two rules shape this module:
 *  - §36 says not to reveal moderation internals, so a rejected customer sees
 *    one fixed sentence. The category and the model's rationale go to the
 *    audit log, where staff can see them.
 *  - A moderation outage must not block the studio. If the check itself
 *    fails, content is allowed through and the failure is logged loudly —
 *    the alternative is a provider hiccup rejecting every wedding saree in
 *    the country.
 */

import { DomainError } from "@/domain/errors";
import { providers } from "@/lib/ai/registry";
import { callProvider } from "@/lib/ai/registry";
import type { SourceImage } from "@/lib/ai/types";
import { recordAudit } from "@/lib/audit/audit-log";
import { logger } from "@/lib/observability/logger";

export interface ModerationContext {
  designId: string;
  userId: string;
  /** What is being screened, for the audit trail. */
  subject: "IDEA_IMAGE" | "TEXT";
  entityId?: string | null;
}

/**
 * Screens content and throws CONTENT_REJECTED if it must not be used.
 *
 * Returns normally both when the content is fine and when the check could not
 * run — callers should treat a normal return as "not blocked", not as
 * "verified safe".
 */
export async function assertContentAllowed(
  input: { text?: string | null; image?: SourceImage | null },
  context: ModerationContext,
): Promise<void> {
  const hasText = typeof input.text === "string" && input.text.trim().length > 0;
  if (!hasText && !input.image) return;

  const provider = providers().moderation;

  let verdict;
  try {
    const result = await callProvider(provider.name, "Content moderation", (signal) =>
      provider.moderate({ text: input.text ?? null, image: input.image ?? null }, signal),
    );
    verdict = result.data;
  } catch (error) {
    // Fail open, but make the gap visible.
    logger.error("Moderation check failed — allowing content through", {
      designId: context.designId,
      subject: context.subject,
      error,
    });
    return;
  }

  if (verdict.allowed) return;

  // The rejection detail is recorded internally, never returned (§36).
  await recordAudit({
    action: "ASSET_DELETED",
    entityType: context.subject === "IDEA_IMAGE" ? "asset" : "design",
    entityId: context.entityId ?? context.designId,
    actorUserId: context.userId,
    metadata: {
      designId: context.designId,
      moderation: "REJECTED",
      subject: context.subject,
      categories: verdict.categories,
      reason: verdict.reason,
    },
  });

  logger.warn("Content rejected by moderation", {
    designId: context.designId,
    subject: context.subject,
    categories: verdict.categories,
  });

  throw new DomainError("CONTENT_REJECTED", {
    message:
      context.subject === "TEXT"
        ? "These words can't be used in the studio."
        : "This image cannot be used in the studio.",
  });
}
