/**
 * Weave-feasibility rules (requirements §12).
 *
 * These are deterministic thresholds, not a model call. A motif that is too
 * small to survive the loom is too small regardless of which AI vendor is
 * configured, and a customer pressing "Optimize" twice should get the same
 * answer both times. Shared by every provider set.
 *
 * §12.1 is explicit that this is guidance, not manufacturing validation —
 * final feasibility is decided at VELVOREA's technical review.
 */

import type { Composition } from "@/domain/composition";
import type { WeaveOptimization, WeaveWarning } from "./types";

/** Below these scales, detail stops surviving the weave. */
export const MIN_WEAVABLE_TEXT_SCALE = 0.6;
export const MIN_WEAVABLE_IMAGE_SCALE = 0.25;

/** How far artwork must stay from the selvedge. */
export const EDGE_MARGIN = 0.04;

export function optimizeForWeaving(composition: Composition): WeaveOptimization {
  const warnings: WeaveWarning[] = [];

  const objects = composition.objects.map((object) => {
    let { x, y, scale } = object;

    if (object.type === "text" && scale < MIN_WEAVABLE_TEXT_SCALE) {
      warnings.push({
        objectId: object.id,
        severity: "warning",
        message: "Your text may be difficult to weave at this size.",
      });
      scale = MIN_WEAVABLE_TEXT_SCALE;
    }

    if (object.type === "image" && scale < MIN_WEAVABLE_IMAGE_SCALE) {
      warnings.push({
        objectId: object.id,
        severity: "warning",
        message: "Fine detail at this size may be lost on the loom.",
      });
      scale = MIN_WEAVABLE_IMAGE_SCALE;
    }

    const clampedX = Math.min(1 - EDGE_MARGIN, Math.max(EDGE_MARGIN, x));
    const clampedY = Math.min(1 - EDGE_MARGIN, Math.max(EDGE_MARGIN, y));
    if (clampedX !== x || clampedY !== y) {
      warnings.push({
        objectId: object.id,
        severity: "info",
        message: "Moved slightly inward so the design clears the selvedge.",
      });
      x = clampedX;
      y = clampedY;
    }

    return { ...object, x, y, scale };
  });

  return {
    warnings,
    // A proposal — never applied without the customer choosing to (§12.3).
    proposed: { ...composition, objects },
    alreadyOptimal: warnings.length === 0,
  };
}
