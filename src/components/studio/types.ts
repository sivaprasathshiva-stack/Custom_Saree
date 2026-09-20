export interface ArtworkTransform {
  x: number; // percentage offset within its placement area, -50..50
  y: number;
  scale: number; // 0.25..3
  rotation: number; // degrees, 0..359
}

// Where this layer sits on the saree (PRD §13/§17 "Place On: Body / Border /
// Pallu"). Defaults to "body" for every layer created before this field
// existed (see design-reducer.ts ADD_ARTWORK_LAYER and cloud-design-store.ts
// fromPersisted, both of which backfill it). This does not yet drive a full
// per-region canvas/repeat engine (that is Phase 6/7 scope) — for
// border/pallu it centers the layer in that region's strip with the same
// scale/rotation controls; only "body" placement supports free dragging.
export type ArtworkPlacement = "body" | "border" | "pallu";

export interface ArtworkLayer {
  id: string;
  name: string;
  visible: boolean;
  placement: ArtworkPlacement;
  // Empty string means "no pixel data available" — happens for a layer
  // reloaded from cloud storage (see PersistedSareeDesign below); the local
  // store always keeps the real data URL since it never leaves the device.
  dataUrl: string;
  fileName: string;
  transform: ArtworkTransform;
}

export type ArtworkStatus = "empty" | "uploading" | "processing" | "ready" | "error";

export interface ArtworkState {
  status: ArtworkStatus;
  error?: string;
  layers: ArtworkLayer[];
  activeLayerId?: string;
}

export type RepeatType = "straight" | "half-drop" | "mirror" | "brick";

export interface RepeatConfig {
  type: RepeatType;
  widthCm: number;
  heightCm: number;
}

export type PaletteSlot = "base" | "border" | "pallu" | "accent" | "motif" | "blouse";

export interface SareeDesign {
  name: string;
  materialId: string;
  // Which weave (see studio-data.ts `weaves`) this material is being woven
  // with. Phase 3 addition (docs/textile-studio/03-domain-model.md
  // `MaterialSelection`: "materialId + weaveId") — alongside `materialId`,
  // not replacing it, since a material can support more than one weave.
  weaveId: string;
  // Phase 3 adds `motif`/`blouse` to the original 4-slot palette
  // (base/border/pallu/accent), per `03-domain-model.md`'s
  // `ColourConfiguration`.
  paletteHexBySlot: Record<PaletteSlot, string>;
  artwork: ArtworkState;
  repeat: RepeatConfig;
  borderId: string;
  palluId: string;
  zariId: string;
}

/**
 * The shape actually written to `designs.design` / `design_versions.design`
 * in Supabase (Phase 2 — see docs/textile-studio/04-database-schema.md).
 * Identical to SareeDesign except artwork layers never carry pixel data
 * (`dataUrl`) — only ids/scalars/metadata. This is the "reference structure,
 * no inline binary/base64" migration: it keeps large uploads out of the
 * jsonb blob and every autosave write. Real per-layer asset storage
 * (`artwork_assets` table + Supabase Storage) is Phase 4 scope — until then,
 * artwork pixel data is device-local only (localStorage) and a design
 * reloaded from the cloud on another device shows layers as placeholders
 * with their original file name, prompting re-upload.
 */
export type PersistedArtworkLayer = Omit<ArtworkLayer, "dataUrl">;

export interface PersistedArtworkState {
  status: ArtworkStatus;
  error?: string;
  layers: PersistedArtworkLayer[];
  activeLayerId?: string;
}

export type PersistedSareeDesign = Omit<SareeDesign, "artwork"> & {
  artwork: PersistedArtworkState;
};

export interface DesignVersion {
  id: string;
  label: string;
  createdAt: string;
  design: SareeDesign;
}

export type ManufacturabilityStatus = "ready" | "review" | "blocked";

export interface ManufacturabilityCheck {
  label: string;
  status: ManufacturabilityStatus;
  note?: string;
}

export interface PriceLine {
  label: string;
  amount: number;
}

export interface PriceResult {
  lines: PriceLine[];
  total: number;
  leadTimeDaysMin: number;
  leadTimeDaysMax: number;
}
