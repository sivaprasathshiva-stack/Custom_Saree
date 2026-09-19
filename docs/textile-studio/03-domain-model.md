# 03 — Domain Model

## Guiding rule (from requirements §63, kept verbatim as a hard constraint)

```
DIGITAL DESIGN ≠ TECHNICAL DESIGN ≠ DIGITAL DRAPE ≠ PHYSICAL SAMPLE ≠ PRODUCTION APPROVAL
```
Every entity below carries a `status` distinguishing digital-only state from anything that has touched a human review (manufacturability) or a physical process (sample/production). Never conflate these.

## Core entities (TypeScript shape, not final DB columns — see `04-database-schema.md`)

```ts
interface SareeDesign {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  status: "draft" | "review" | "approved" | "archived";
  currentVersionId: string;

  material: MaterialSelection;       // materialId + weaveId
  palette: ColourConfiguration;      // per-slot hex, see below
  artwork: ArtworkLayer[];
  repeat: RepeatConfiguration;
  body: BodyConfiguration;
  border: BorderConfiguration;
  pallu: PalluConfiguration;
  zari: ZariConfiguration;
  blouse: BlouseConfiguration;
  dimensions: SareeDimensions;       // lengthM, widthM

  selectedModelId?: string;
  drape?: DrapeConfiguration;

  pricing?: PricingEstimate;               // always status: "estimate" until real quote
  manufacturability?: ManufacturabilityResult;

  createdAt: string;
  updatedAt: string;
}

interface ColourConfiguration {
  body: string; motif: string; border: string; pallu: string; zari: string; blouse: string;
}

interface ArtworkLayer {
  id: string; name: string; assetId: string; // ref to artwork_assets, NOT a dataUrl
  position: { x: number; y: number };        // percentage-of-region, matches current transform model
  scale: number; rotation: number; opacity: number;
  visible: boolean; locked: boolean; zIndex: number;
  crop?: { x: number; y: number; width: number; height: number };
}

interface RepeatConfiguration {
  type: "grid" | "half-drop" | "brick" | "mirror" | "tossed" | "stripe" | "custom";
  widthCm: number; heightCm: number;
  offsetX: number; offsetY: number; scale: number; rotation: number;
  mirrorX: boolean; mirrorY: boolean; spacingCm: number;
}

interface BodyConfiguration {
  baseColourHex: string; artworkLayerIds: string[]; repeatId: string;
}

interface BorderConfiguration {
  enabled: boolean; widthCm: number; artworkLayerIds: string[]; repeatId?: string;
  colourHex: string; zariId: string; motifScale: number; symmetry: "mirrored" | "continuous";
}

interface PalluConfiguration {
  lengthCm: number; artworkLayerIds: string[]; centralMotifLayerId?: string;
  sideMotifLayerIds: string[]; colourHex: string; borderId?: string; zariId: string;
}

interface ZariConfiguration {
  type: "gold" | "antique-gold" | "silver" | "copper" | "custom";
  colourHex: string; density: "low" | "medium" | "high"; placement: string; widthMm: number;
}

interface BlouseConfiguration {
  colourHex: string; sleeve: "sleeveless" | "short" | "elbow" | "full";
  neckline: "round" | "v-neck" | "boat" | "high"; materialId?: string;
}

interface DrapeConfiguration {
  modelId: string; view: "front" | "three-quarter" | "side" | "back";
  renderingMode: "template" | "3d" | "ai"; previewAssetId?: string; generatedAt?: string;
  fidelity: { pattern: "high" | "medium" | "low"; colour: "high" | "medium" | "low";
              drape: "approximate"; material: "approximate" | "medium" }; // never "exact"
}

interface ManufacturabilityResult {
  status: "ready" | "review" | "blocked" | "requires_manufacturer_configuration";
  checks: { label: string; status: string; note?: string }[];
  evaluatedAt: string;
}

interface PricingEstimate {
  status: "estimate"; // literally never anything else until a real quote system exists
  lines: { label: string; amount: number }[];
  total: number; currency: "INR"; leadTimeDaysMin: number; leadTimeDaysMax: number;
}
```

## Mapping from what exists today

| New entity | Current equivalent | Gap |
|---|---|---|
| `MaterialSelection` | `materialId: string` | No `weaveId`; materials have no `availableColours`/`compatibleZari` |
| `ColourConfiguration` | `paletteHexBySlot` (4 slots: base/border/pallu/accent) | No `motif`/`blouse` slots |
| `ArtworkLayer` | exists, close shape | `dataUrl` inline instead of `assetId` → object storage |
| `RepeatConfiguration` | exists, 4 of 7 repeat types | Missing grid/tossed/stripe/custom; no offset/mirror/spacing fields |
| `BodyConfiguration` | implicit (palette.base only) | Doesn't exist as its own entity |
| `BorderConfiguration` | `borderId: string` (pick from 3 presets) | Not independently configurable at all |
| `PalluConfiguration` | `palluId: string` (pick from 3 presets) | Same |
| `ZariConfiguration` | `zariId: string` (pick from 3 presets) | No density/placement/width fields |
| `BlouseConfiguration` | doesn't exist | Net new |
| `DrapeConfiguration` | doesn't exist | Net new — see `08-drape-architecture.md` |
| `ManufacturabilityResult` | close shape, already good | Mostly reusable, extend status enum |
| `PricingEstimate` | close shape, already good | Mostly reusable, already `status`-conscious in spirit if not in type |

The existing `manufacturability-engine.ts` and `pricing-engine.ts` are the best-aligned pieces of the current codebase to this domain model — they're pure, deterministic, and already self-labeled as demo/estimate. Keep their approach, extend their input shape.
