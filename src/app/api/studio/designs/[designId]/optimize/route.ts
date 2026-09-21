import { isEnabled } from "@/config/feature-flags";
import { isEmpty } from "@/domain/composition";
import { DomainError } from "@/domain/errors";
import { requireEditableDesign, withAuthedRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { providers } from "@/lib/ai/registry";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { currentComposition, getAnalysis } from "@/lib/studio/repository";

/**
 * Optimize for weaving (§12).
 *
 * Guidance, not manufacturing validation. The response is a *proposal* — the
 * customer chooses whether to apply it, and applying it is an ordinary,
 * undoable composition edit (§12.3).
 */

type Params = { designId: string };

export const POST = withAuthedRoute<Params>(
  "POST /api/studio/designs/[designId]/optimize",
  async (context) => {
    if (!isEnabled("ENABLE_WEAVE_OPTIMIZATION")) throw new DomainError("FEATURE_DISABLED");
    await enforceRateLimit("optimize", context.userId);

    const design = await requireEditableDesign(context, context.params.designId);
    const composition = await currentComposition(design.id);

    if (isEmpty(composition)) {
      return ok(
        { warnings: [], proposed: composition, alreadyOptimal: true, disclaimer: WEAVE_DISCLAIMER },
        context.requestId,
      );
    }

    const analysisRow = await getAnalysis(design.id);
    const result = await providers().optimization.optimizeForWeaving({
      designId: design.id,
      analysis: analysisRow?.status === "SUCCEEDED" ? analysisRow.analysis_json : null,
      composition,
    });

    return ok(
      {
        warnings: result.data.warnings,
        proposed: result.data.proposed,
        alreadyOptimal: result.data.alreadyOptimal,
        disclaimer: WEAVE_DISCLAIMER,
      },
      context.requestId,
    );
  },
);

/** §12.4 — required wording, so the customer is never told this is final. */
const WEAVE_DISCLAIMER =
  "This optimization is a visual guidance step. Final production feasibility will be determined during VELVOREA's technical review.";

export const dynamic = "force-dynamic";
