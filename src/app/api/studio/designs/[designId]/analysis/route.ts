import { requireOwnedDesign, withAuthedRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { getAnalysis, listAssets } from "@/lib/studio/repository";

/**
 * Saree analysis status (§8.4).
 *
 * The customer sees readiness and plain-language advisories — never the
 * region geometry, confidence scores or model output that drive them (§8.4:
 * "do not expose low-level model output"). The regions are returned only as
 * booleans so the UI can show its checklist.
 */

type Params = { designId: string };

export const GET = withAuthedRoute<Params>(
  "GET /api/studio/designs/[designId]/analysis",
  async (context) => {
    const design = await requireOwnedDesign(context, context.params.designId);

    const [analysis, references] = await Promise.all([
      getAnalysis(design.id),
      listAssets(design.id, "SAREE_REFERENCE"),
    ]);

    const result = analysis?.analysis_json ?? null;
    const ready = analysis?.status === "SUCCEEDED" && result !== null;

    return ok(
      {
        status: analysis?.status ?? "PENDING",
        ready,
        photoCount: references.length,
        // The §8.4 checklist, as booleans rather than geometry.
        detected: result
          ? {
              saree: result.sareeDetected,
              colour: result.dominantColours.length > 0,
              border: result.border !== null,
              pallu: result.pallu !== null,
              pattern: result.motifs.length > 0,
            }
          : null,
        advisories: result?.advisories ?? [],
        message: ready ? "Your saree is ready." : null,
      },
      context.requestId,
    );
  },
);

export const dynamic = "force-dynamic";
