import { describe, expect, it } from "vitest";
import { createDefaultDesign, designReducer } from "./design-reducer";

describe("createDefaultDesign", () => {
  it("applies preset fields when a valid preset id is given", () => {
    const design = createDefaultDesign("bridal");
    expect(design.materialId).toBe("kan");
    expect(design.borderId).toBe("temple");
    expect(design.zariId).toBe("premium");
  });

  it("falls back to plain defaults for an unknown preset id", () => {
    const design = createDefaultDesign("not-a-real-preset");
    expect(design.name).toBe("Untitled design");
  });
});

describe("designReducer", () => {
  it("SET_COLOUR only changes the targeted slot", () => {
    const state = createDefaultDesign();
    const next = designReducer(state, { type: "SET_COLOUR", slot: "border", hex: "#111111" });
    expect(next.paletteHexBySlot.border).toBe("#111111");
    expect(next.paletteHexBySlot.base).toBe(state.paletteHexBySlot.base);
  });

  it("SET_COLOUR supports the Phase 3 motif and blouse slots", () => {
    const state = createDefaultDesign();
    const withMotif = designReducer(state, { type: "SET_COLOUR", slot: "motif", hex: "#222222" });
    expect(withMotif.paletteHexBySlot.motif).toBe("#222222");
    const withBlouse = designReducer(withMotif, { type: "SET_COLOUR", slot: "blouse", hex: "#333333" });
    expect(withBlouse.paletteHexBySlot.blouse).toBe("#333333");
    // Untouched slots stay as-is.
    expect(withBlouse.paletteHexBySlot.motif).toBe("#222222");
  });

  it("SET_WEAVE changes only the weave", () => {
    const state = createDefaultDesign();
    const next = designReducer(state, { type: "SET_WEAVE", weaveId: "brocade" });
    expect(next.weaveId).toBe("brocade");
    expect(next.materialId).toBe(state.materialId);
  });

  it("SET_MATERIAL re-picks a compatible weave when the current one no longer applies", () => {
    const state = { ...createDefaultDesign(), materialId: "kan", weaveId: "brocade" };
    // Tussar silk doesn't support brocade (studio-data.ts weaveFamily).
    const next = designReducer(state, { type: "SET_MATERIAL", materialId: "tus" });
    expect(next.materialId).toBe("tus");
    expect(next.weaveId).not.toBe("brocade");
  });

  it("SET_MATERIAL keeps the current weave when the new material still supports it", () => {
    const state = { ...createDefaultDesign(), materialId: "kan", weaveId: "jacquard" };
    const next = designReducer(state, { type: "SET_MATERIAL", materialId: "mys" });
    expect(next.weaveId).toBe("jacquard");
  });

  it("ARTWORK_READY appends a layer and makes it active", () => {
    const state = createDefaultDesign();
    const layer = {
      id: "l1",
      name: "Motif",
      visible: true,
      placement: "body" as const,
      dataUrl: "data:image/png;base64,",
      fileName: "motif.png",
      transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    };
    const next = designReducer(state, { type: "ARTWORK_READY", layer });
    expect(next.artwork.layers).toHaveLength(1);
    expect(next.artwork.activeLayerId).toBe("l1");
    expect(next.artwork.status).toBe("ready");
  });

  it("ARTWORK_REMOVE clears status back to empty when the last layer is removed", () => {
    const state = createDefaultDesign();
    const layer = {
      id: "l1",
      name: "Motif",
      visible: true,
      placement: "body" as const,
      dataUrl: "data:image/png;base64,",
      fileName: "motif.png",
      transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    };
    const withLayer = designReducer(state, { type: "ARTWORK_READY", layer });
    const removed = designReducer(withLayer, { type: "ARTWORK_REMOVE", layerId: "l1" });
    expect(removed.artwork.layers).toHaveLength(0);
    expect(removed.artwork.status).toBe("empty");
  });

  it("an unknown action type returns the same state unchanged", () => {
    const state = createDefaultDesign();
    // @ts-expect-error — deliberately testing the default branch with an invalid action
    const next = designReducer(state, { type: "NOT_A_REAL_ACTION" });
    expect(next).toBe(state);
  });
});
