export type StudioStep =
  | "material"
  | "colour"
  | "artwork"
  | "repeat"
  | "border"
  | "pallu"
  | "zari";

export const steps: { id: StudioStep; index: string; label: string; hint: string }[] = [
  { id: "material", index: "01", label: "Material", hint: "Choose the silk." },
  { id: "colour", index: "02", label: "Colour", hint: "Build your palette." },
  { id: "artwork", index: "03", label: "Artwork", hint: "Create or upload your motif." },
  { id: "repeat", index: "04", label: "Repeat", hint: "Control the rhythm." },
  { id: "border", index: "05", label: "Border", hint: "Define the edge." },
  { id: "pallu", index: "06", label: "Pallu", hint: "Design the focal point." },
  { id: "zari", index: "07", label: "Zari", hint: "Choose the metallic detail." },
];

/**
 * Weaves — the structural technique a material is woven with (see the
 * marketing copy at /materials/weaves, reused here verbatim rather than
 * restated, so the Studio and the marketing site never disagree). Phase 3
 * (docs/textile-studio/16-implementation-plan.md) introduces these as a
 * `weaveId` alongside `materialId` per `03-domain-model.md`'s
 * `MaterialSelection` shape. No density/thread-count numbers are included —
 * those aren't published anywhere on the live site, so per the project's
 * hard rule against fabricating technical facts they stay unset rather than
 * invented; `checkManufacturability` and the marketing weaves page already
 * describe density limits qualitatively, not numerically.
 */
export type WeaveFamily = "plain" | "jacquard" | "brocade" | "tissue";

export const weaves: {
  id: string;
  name: string;
  family: WeaveFamily;
  description: string;
}[] = [
  {
    id: "plain",
    name: "Plain weave",
    family: "plain",
    description:
      "The simplest structure — warp and weft cross one over one. Lightweight, flexible, and the base for most solid-colour or lightly patterned body fabric.",
  },
  {
    id: "jacquard",
    name: "Jacquard weave",
    family: "jacquard",
    description:
      "Individually controlled warp threads let complex motifs and repeats be woven directly into the fabric rather than printed or embroidered on.",
  },
  {
    id: "brocade",
    name: "Brocade",
    family: "brocade",
    description:
      "Supplementary weft threads (often zari) create a raised, textured pattern on top of the base weave. Denser and heavier than plain jacquard.",
  },
  {
    id: "tissue",
    name: "Tissue weave",
    family: "tissue",
    description:
      "A fine metallic weft woven through the entire body, giving the fabric an overall shimmer rather than pattern confined to specific motifs.",
  },
];

/**
 * Materials, extended per Phase 3 with `weaveFamily` (which weaves this silk
 * actually supports — matches the marketing copy at /materials/weaves: "Every
 * material in the Silk Library is paired with weaves it actually supports"),
 * `availableColours` (demo palette options offered for this material — a UI
 * default, not a manufacturing constraint, until real colour-availability
 * data exists), `compatibleZari` (all three demo zari options, since nothing
 * in the current manufacturing data restricts zari by material yet), and
 * `technicalProperties`. `technicalProperties` only restates weight/width/
 * sheen/drape already shown on /materials (same source of truth, no new
 * numbers invented) plus fields that are genuinely unknown and explicitly
 * `null` rather than fabricated — per the project's hard rule, never guess
 * silk GSM/weave-density/zari-composition numbers.
 */
export const materials = [
  {
    id: "kan",
    name: "Kanchipuram Pure Silk",
    weight: "220 GSM",
    width: "46 in",
    drape: "Structured",
    sheen: "High",
    weaveFamily: ["plain", "jacquard", "brocade"] as WeaveFamily[],
    availableColours: ["#5c1a2b", "#a9812f", "#f6f2ea", "#232a4d", "#0f3d2e"],
    compatibleZari: ["premium", "standard", "imitation"],
    technicalProperties: {
      weight: "220 GSM",
      width: "46 in",
      drape: "Structured",
      sheen: "High",
      threadCount: null,
      weaveDensity: null,
      zariComposition: null,
    },
  },
  {
    id: "ban",
    name: "Banarasi Silk",
    weight: "180 GSM",
    width: "44 in",
    drape: "Fluid",
    sheen: "Medium-High",
    weaveFamily: ["jacquard", "brocade", "tissue"] as WeaveFamily[],
    availableColours: ["#5c1a2b", "#a9812f", "#f6f2ea", "#232a4d", "#0f3d2e"],
    compatibleZari: ["premium", "standard", "imitation"],
    technicalProperties: {
      weight: "180 GSM",
      width: "44 in",
      drape: "Fluid",
      sheen: "Medium-High",
      threadCount: null,
      weaveDensity: null,
      zariComposition: null,
    },
  },
  {
    id: "tus",
    name: "Tussar Silk",
    weight: "140 GSM",
    width: "44 in",
    drape: "Textured",
    sheen: "Matte",
    weaveFamily: ["plain", "tissue"] as WeaveFamily[],
    availableColours: ["#5c1a2b", "#a9812f", "#f6f2ea", "#232a4d", "#0f3d2e"],
    compatibleZari: ["standard", "imitation"],
    technicalProperties: {
      weight: "140 GSM",
      width: "44 in",
      drape: "Textured",
      sheen: "Matte",
      threadCount: null,
      weaveDensity: null,
      zariComposition: null,
    },
  },
  {
    id: "mys",
    name: "Mysore Silk",
    weight: "160 GSM",
    width: "45 in",
    drape: "Soft",
    sheen: "High",
    weaveFamily: ["plain", "jacquard"] as WeaveFamily[],
    availableColours: ["#5c1a2b", "#a9812f", "#f6f2ea", "#232a4d", "#0f3d2e"],
    compatibleZari: ["premium", "standard", "imitation"],
    technicalProperties: {
      weight: "160 GSM",
      width: "45 in",
      drape: "Soft",
      sheen: "High",
      threadCount: null,
      weaveDensity: null,
      zariComposition: null,
    },
  },
];

/**
 * Weaves compatible with a given material id, in the fixed `weaves` order.
 * Used by the Studio UI to only offer weaves that material's `weaveFamily`
 * actually lists, and by `checkManufacturability` to flag an incompatible
 * combination (e.g. a saved/older design that predates this constraint).
 */
export function weavesForMaterial(materialId: string) {
  const material = materials.find((m) => m.id === materialId);
  if (!material) return weaves;
  return weaves.filter((w) => material.weaveFamily.includes(w.family));
}

export const palette = [
  { slot: "Base", name: "Deep Maroon", hex: "#5c1a2b" },
  { slot: "Motif", name: "Antique Gold", hex: "#a9812f" },
  { slot: "Border", name: "Antique Gold", hex: "#a9812f" },
  { slot: "Pallu", name: "Warm Ivory", hex: "#f6f2ea" },
  { slot: "Accent", name: "Dark Indigo", hex: "#232a4d" },
  { slot: "Blouse", name: "Deep Maroon", hex: "#5c1a2b" },
];

export const borders = [
  { id: "temple", name: "Temple Geometry", widthCm: 6 },
  { id: "floral", name: "Floral Trellis", widthCm: 5 },
  { id: "checked", name: "Checked Rudraksha", widthCm: 4 },
];

export const pallus = [
  { id: "temple-pallu", name: "Temple Geometry Pallu" },
  { id: "floral-pallu", name: "Contemporary Floral Pallu" },
  { id: "peacock-pallu", name: "Peacock Motif Pallu" },
];

export const zariOptions = [
  { id: "premium", name: "Premium Zari", multiplier: 1.8 },
  { id: "standard", name: "Standard Zari", multiplier: 1.2 },
  { id: "imitation", name: "Imitation Zari", multiplier: 1.0 },
];

export type ManufacturabilityStatus = "pass" | "warning" | "review" | "fail";

export const manufacturabilityChecks: {
  label: string;
  status: ManufacturabilityStatus;
  note?: string;
}[] = [
  { label: "Artwork resolution", status: "pass" },
  { label: "Repeat compatible with weave", status: "pass" },
  { label: "Border width within loom limits", status: "pass" },
  { label: "Zari density", status: "warning", note: "Requires dye-house validation" },
  { label: "Colour count", status: "pass" },
];

/**
 * Named starting configurations the marketing site can link into via
 * /studio?preset=<id>. Each preset only sets material/border/pallu/zari —
 * the same fields createDefaultDesign() sets — so it's a variant of the
 * default, not a parallel data model.
 */
export const studioPresets: Record<
  string,
  {
    name: string;
    materialId: string;
    weaveId?: string;
    borderId: string;
    palluId: string;
    zariId: string;
  }
> = {
  bridal: {
    name: "Bridal Kanchipuram — Temple & Premium Zari",
    materialId: "kan",
    weaveId: "brocade",
    borderId: "temple",
    palluId: "temple-pallu",
    zariId: "premium",
  },
};

export const priceBreakdown = [
  { label: "Base Silk", amount: 12400 },
  { label: "Weave Complexity", amount: 3200 },
  { label: "Zari", amount: 8900 },
  { label: "Artwork Complexity", amount: 2100 },
  { label: "Border", amount: 1800 },
  { label: "Pallu", amount: 2400 },
  { label: "Manufacturing", amount: 4600 },
];
