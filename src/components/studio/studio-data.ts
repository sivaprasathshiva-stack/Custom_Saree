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

export const materials = [
  { id: "kan", name: "Kanchipuram Pure Silk", weight: "220 GSM", width: "46 in", drape: "Structured", sheen: "High" },
  { id: "ban", name: "Banarasi Silk", weight: "180 GSM", width: "44 in", drape: "Fluid", sheen: "Medium-High" },
  { id: "tus", name: "Tussar Silk", weight: "140 GSM", width: "44 in", drape: "Textured", sheen: "Matte" },
  { id: "mys", name: "Mysore Silk", weight: "160 GSM", width: "45 in", drape: "Soft", sheen: "High" },
];

export const palette = [
  { slot: "Base", name: "Deep Maroon", hex: "#5c1a2b" },
  { slot: "Border", name: "Antique Gold", hex: "#a9812f" },
  { slot: "Pallu", name: "Warm Ivory", hex: "#f6f2ea" },
  { slot: "Accent", name: "Dark Indigo", hex: "#232a4d" },
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
  { name: string; materialId: string; borderId: string; palluId: string; zariId: string }
> = {
  bridal: {
    name: "Bridal Kanchipuram — Temple & Premium Zari",
    materialId: "kan",
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
