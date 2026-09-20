import { describe, expect, it } from "vitest";
import { toPersisted, fromPersisted } from "./cloud-design-store";
import { createDefaultDesign } from "./design-reducer";
import type { ArtworkLayer } from "./types";

describe("toPersisted / fromPersisted (Phase 2 reference-structure jsonb)", () => {
  it("strips dataUrl (base64 artwork) out of the persisted shape", () => {
    const design = createDefaultDesign();
    const layer: ArtworkLayer = {
      id: "l1",
      name: "Motif",
      visible: true,
      placement: "body",
      dataUrl: "data:image/png;base64,AAAA",
      fileName: "motif.png",
      transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    };
    design.artwork = { status: "ready", layers: [layer], activeLayerId: "l1" };

    const persisted = toPersisted(design);
    expect(JSON.stringify(persisted)).not.toContain("base64");
    expect(persisted.artwork.layers[0]).not.toHaveProperty("dataUrl");
    expect(persisted.artwork.layers[0].id).toBe("l1");
    expect(persisted.artwork.layers[0].fileName).toBe("motif.png");
  });

  it("round-trips through fromPersisted with an empty dataUrl placeholder", () => {
    const design = createDefaultDesign();
    const layer: ArtworkLayer = {
      id: "l1",
      name: "Motif",
      visible: true,
      placement: "body",
      dataUrl: "data:image/png;base64,AAAA",
      fileName: "motif.png",
      transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    };
    design.artwork = { status: "ready", layers: [layer], activeLayerId: "l1" };

    const restored = fromPersisted(toPersisted(design));
    expect(restored.artwork.layers[0].dataUrl).toBe("");
    expect(restored.artwork.layers[0].fileName).toBe("motif.png");
    expect(restored.artwork.activeLayerId).toBe("l1");
  });

  it("does not affect designs with no artwork", () => {
    const design = createDefaultDesign();
    const persisted = toPersisted(design);
    expect(persisted.artwork.layers).toHaveLength(0);
    const restored = fromPersisted(persisted);
    expect(restored.artwork.layers).toHaveLength(0);
  });
});
