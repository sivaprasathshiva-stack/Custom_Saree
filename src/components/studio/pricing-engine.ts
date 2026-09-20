import { materials, borders, pallus, zariOptions, weaves } from "./studio-data";
import type { PriceResult, SareeDesign } from "./types";

/**
 * DEMO pricing engine. Deterministic and pure — the Studio UI never derives
 * a price by itself, it always calls this function. Every number here is
 * placeholder/demo data (see silk-design + requirements: pricing must be
 * rule-based, versioned and never hardcoded in UI components — this is the
 * "rule-based module" the requirements ask for, populated with demo rules
 * until real manufacturing pricing is supplied).
 */
export function computePrice(design: SareeDesign): PriceResult {
  const material = materials.find((m) => m.id === design.materialId) ?? materials[0];
  const weave = weaves.find((w) => w.id === design.weaveId) ?? weaves[0];
  const border = borders.find((b) => b.id === design.borderId) ?? borders[0];
  const pallu = pallus.find((p) => p.id === design.palluId) ?? pallus[0];
  const zari = zariOptions.find((z) => z.id === design.zariId) ?? zariOptions[0];

  const baseSilkByMaterial: Record<string, number> = {
    kan: 12400,
    ban: 10800,
    tus: 7200,
    mys: 8600,
  };

  // Demo weave-complexity multiplier: plain weave is the base loom setup,
  // jacquard/brocade/tissue require progressively more loom configuration.
  // Placeholder figures, same status as every other line here — see the
  // module doc comment.
  const weaveComplexityByFamily: Record<string, number> = {
    plain: 3200,
    jacquard: 4400,
    brocade: 5600,
    tissue: 4000,
  };

  const artworkLayers = design.artwork.layers.length;
  const artworkComplexity = artworkLayers > 0 ? 1400 + artworkLayers * 350 : 0;

  const repeatComplexity =
    design.repeat.type === "brick" || design.repeat.type === "mirror" ? 900 : 500;

  const lines = [
    { label: "Base silk", amount: baseSilkByMaterial[material.id] ?? 8000 },
    { label: "Weave complexity", amount: weaveComplexityByFamily[weave.family] ?? 3200 },
    { label: "Artwork complexity", amount: artworkComplexity },
    { label: "Repeat setup", amount: repeatComplexity },
    { label: "Border", amount: 1200 + border.widthCm * 150 },
    { label: "Pallu", amount: pallu.id.includes("floral") ? 2600 : 2200 },
    { label: "Zari", amount: Math.round(4900 * zari.multiplier) },
    { label: "Manufacturing", amount: 4600 },
  ];

  const total = lines.reduce((sum, l) => sum + l.amount, 0);

  const leadBase = 22;
  const leadArtwork = artworkLayers > 0 ? 4 : 0;
  const leadZari = zari.id === "premium" ? 6 : zari.id === "standard" ? 3 : 0;

  return {
    lines,
    total,
    leadTimeDaysMin: leadBase + leadArtwork,
    leadTimeDaysMax: leadBase + leadArtwork + leadZari + 6,
  };
}
