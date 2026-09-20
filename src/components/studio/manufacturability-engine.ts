import { borders, zariOptions, materials, weavesForMaterial } from "./studio-data";
import type { ManufacturabilityCheck, SareeDesign } from "./types";

/**
 * DEMO manufacturability engine. Deterministic rules only — AI has no input
 * into these results (requirements 25/113: AI may suggest, never decide
 * feasibility). Real rule thresholds must come from manufacturing before
 * launch; the shape (rule -> ready/review/blocked + explanation) is what
 * production data plugs into.
 */
export function checkManufacturability(design: SareeDesign): ManufacturabilityCheck[] {
  const border = borders.find((b) => b.id === design.borderId) ?? borders[0];
  const zari = zariOptions.find((z) => z.id === design.zariId) ?? zariOptions[0];
  const material = materials.find((m) => m.id === design.materialId) ?? materials[0];
  const checks: ManufacturabilityCheck[] = [];

  // Not every weave suits every material (studio-data.ts `weaveFamily`) —
  // this mainly catches an older/imported design saved before Phase 3 added
  // `weaveId`, or a design edited outside the normal Studio UI flow.
  const weaveCompatible = weavesForMaterial(material.id).some((w) => w.id === design.weaveId);
  checks.push({
    label: "Weave compatible with material",
    status: weaveCompatible ? "ready" : "review",
    note: weaveCompatible
      ? undefined
      : `${material.name} does not list this weave as supported — confirm with the loom before production`,
  });

  if (design.artwork.layers.length === 0) {
    checks.push({
      label: "Artwork uploaded",
      status: "review",
      note: "No artwork uploaded yet — body will use palette only",
    });
  } else {
    const oversizedOrTiny = design.artwork.layers.some(
      (l) => l.transform.scale < 0.3 || l.transform.scale > 2.6
    );
    checks.push({
      label: "Artwork scale",
      status: oversizedOrTiny ? "review" : "ready",
      note: oversizedOrTiny ? "Scale outside the recommended 30%–260% range" : undefined,
    });
  }

  checks.push({
    label: "Repeat dimensions",
    status:
      design.repeat.widthCm >= 6 && design.repeat.widthCm <= 40 ? "ready" : "blocked",
    note:
      design.repeat.widthCm < 6 || design.repeat.widthCm > 40
        ? "Repeat width must be between 6 cm and 40 cm for this weave"
        : undefined,
  });

  checks.push({
    label: "Border width",
    status: border.widthCm <= 10 ? "ready" : "review",
    note: border.widthCm > 10 ? "Wide borders require a manual loom check" : undefined,
  });

  checks.push({
    label: "Colour count",
    status: "ready",
  });

  checks.push({
    label: "Zari density",
    status: zari.id === "premium" ? "review" : "ready",
    note: zari.id === "premium" ? "Premium zari requires dye-house validation" : undefined,
  });

  return checks;
}

export function overallStatus(
  checks: ManufacturabilityCheck[]
): "ready" | "review" | "blocked" {
  if (checks.some((c) => c.status === "blocked")) return "blocked";
  if (checks.some((c) => c.status === "review")) return "review";
  return "ready";
}
