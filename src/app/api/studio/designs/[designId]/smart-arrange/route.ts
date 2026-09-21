import { isEnabled } from "@/config/feature-flags";
import { DomainError } from "@/domain/errors";
import { requireEditableDesign, withAuthedRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { providers } from "@/lib/ai/registry";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { currentComposition, getAnalysis } from "@/lib/studio/repository";
import { isEmpty } from "@/domain/composition";

/**
 * Smart Arrange (§11).
 *
 * Returns suggestions only. Applying one is a client-side composition edit
 * that goes through the normal autosave path, which is what makes it undoable
 * (§11.4) — the server never silently rewrites the customer's canvas.
 */

type Params = { designId: string };

export const POST = withAuthedRoute<Params>(
  "POST /api/studio/designs/[designId]/smart-arrange",
  async (context) => {
    if (!isEnabled("ENABLE_SMART_ARRANGE")) throw new DomainError("FEATURE_DISABLED");
    await enforceRateLimit("smartArrange", context.userId);

    const design = await requireEditableDesign(context, context.params.designId);

    const analysisRow = await getAnalysis(design.id);
    if (!analysisRow || analysisRow.status !== "SUCCEEDED" || !analysisRow.analysis_json) {
      // Placement depends on knowing where the pallu and border are.
      throw new DomainError("ANALYSIS_NOT_READY");
    }

    const composition = await currentComposition(design.id);
    if (isEmpty(composition)) {
      return ok({ suggestions: [] }, context.requestId);
    }

    const result = await providers().placement.suggestPlacements({
      designId: design.id,
      analysis: analysisRow.analysis_json,
      composition,
    });

    return ok({ suggestions: result.data }, context.requestId);
  },
);

export const dynamic = "force-dynamic";
