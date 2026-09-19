import { materials, palette, borders, pallus, zariOptions } from "./studio-data";
import type { ArtworkLayer, ArtworkTransform, SareeDesign } from "./types";

export function createDefaultDesign(): SareeDesign {
  return {
    name: "Untitled design",
    materialId: materials[0].id,
    paletteHexBySlot: {
      base: palette[0].hex,
      border: palette[1].hex,
      pallu: palette[2].hex,
      accent: palette[3].hex,
    },
    artwork: { status: "empty", layers: [] },
    repeat: { type: "straight", widthCm: 18, heightCm: 18 },
    borderId: borders[0].id,
    palluId: pallus[0].id,
    zariId: zariOptions[0].id,
  };
}

export type DesignAction =
  | { type: "SET_NAME"; name: string }
  | { type: "SET_MATERIAL"; materialId: string }
  | { type: "SET_COLOUR"; slot: keyof SareeDesign["paletteHexBySlot"]; hex: string }
  | { type: "SET_REPEAT_TYPE"; repeatType: SareeDesign["repeat"]["type"] }
  | { type: "SET_REPEAT_SIZE"; widthCm: number; heightCm: number }
  | { type: "SET_BORDER"; borderId: string }
  | { type: "SET_PALLU"; palluId: string }
  | { type: "SET_ZARI"; zariId: string }
  | { type: "ARTWORK_UPLOAD_START" }
  | { type: "ARTWORK_UPLOAD_ERROR"; error: string }
  | { type: "ARTWORK_READY"; layer: ArtworkLayer }
  | { type: "ARTWORK_TRANSFORM"; layerId: string; transform: Partial<ArtworkTransform> }
  | { type: "ARTWORK_REMOVE"; layerId: string }
  | { type: "ARTWORK_TOGGLE_VISIBLE"; layerId: string }
  | { type: "ARTWORK_SET_ACTIVE"; layerId: string }
  | { type: "REPLACE_DESIGN"; design: SareeDesign };

export function designReducer(state: SareeDesign, action: DesignAction): SareeDesign {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.name };
    case "SET_MATERIAL":
      return { ...state, materialId: action.materialId };
    case "SET_COLOUR":
      return {
        ...state,
        paletteHexBySlot: { ...state.paletteHexBySlot, [action.slot]: action.hex },
      };
    case "SET_REPEAT_TYPE":
      return { ...state, repeat: { ...state.repeat, type: action.repeatType } };
    case "SET_REPEAT_SIZE":
      return {
        ...state,
        repeat: { ...state.repeat, widthCm: action.widthCm, heightCm: action.heightCm },
      };
    case "SET_BORDER":
      return { ...state, borderId: action.borderId };
    case "SET_PALLU":
      return { ...state, palluId: action.palluId };
    case "SET_ZARI":
      return { ...state, zariId: action.zariId };
    case "ARTWORK_UPLOAD_START":
      return { ...state, artwork: { ...state.artwork, status: "uploading", error: undefined } };
    case "ARTWORK_UPLOAD_ERROR":
      return { ...state, artwork: { ...state.artwork, status: "error", error: action.error } };
    case "ARTWORK_READY":
      return {
        ...state,
        artwork: {
          status: "ready",
          layers: [...state.artwork.layers, action.layer],
          activeLayerId: action.layer.id,
        },
      };
    case "ARTWORK_TRANSFORM":
      return {
        ...state,
        artwork: {
          ...state.artwork,
          layers: state.artwork.layers.map((l) =>
            l.id === action.layerId
              ? { ...l, transform: { ...l.transform, ...action.transform } }
              : l
          ),
        },
      };
    case "ARTWORK_REMOVE": {
      const layers = state.artwork.layers.filter((l) => l.id !== action.layerId);
      return {
        ...state,
        artwork: {
          status: layers.length > 0 ? "ready" : "empty",
          layers,
          activeLayerId: layers[layers.length - 1]?.id,
        },
      };
    }
    case "ARTWORK_TOGGLE_VISIBLE":
      return {
        ...state,
        artwork: {
          ...state.artwork,
          layers: state.artwork.layers.map((l) =>
            l.id === action.layerId ? { ...l, visible: !l.visible } : l
          ),
        },
      };
    case "ARTWORK_SET_ACTIVE":
      return { ...state, artwork: { ...state.artwork, activeLayerId: action.layerId } };
    case "REPLACE_DESIGN":
      return action.design;
    default:
      return state;
  }
}

/** Actions that represent a meaningful, undo-worthy design change (not every
 * intermediate drag/rotate tick — those are coalesced by the caller). */
export const HISTORY_SIGNIFICANT_ACTIONS = new Set<DesignAction["type"]>([
  "SET_NAME",
  "SET_MATERIAL",
  "SET_COLOUR",
  "SET_REPEAT_TYPE",
  "SET_REPEAT_SIZE",
  "SET_BORDER",
  "SET_PALLU",
  "SET_ZARI",
  "ARTWORK_READY",
  "ARTWORK_REMOVE",
  "REPLACE_DESIGN",
]);
