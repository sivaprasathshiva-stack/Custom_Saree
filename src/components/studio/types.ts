export interface ArtworkTransform {
  x: number; // percentage offset within its placement area, -50..50
  y: number;
  scale: number; // 0.25..3
  rotation: number; // degrees, 0..359
}

export interface ArtworkLayer {
  id: string;
  name: string;
  visible: boolean;
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

export interface SareeDesign {
  name: string;
  materialId: string;
  paletteHexBySlot: Record<"base" | "border" | "pallu" | "accent", string>;
  artwork: ArtworkState;
  repeat: RepeatConfig;
  borderId: string;
  palluId: string;
  zariId: string;
}

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
