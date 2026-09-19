import { describe, expect, it } from "vitest";
import { computePrice } from "./pricing-engine";
import { createDefaultDesign } from "./design-reducer";

describe("computePrice", () => {
  it("returns a total equal to the sum of its lines", () => {
    const price = computePrice(createDefaultDesign());
    const sum = price.lines.reduce((total, line) => total + line.amount, 0);
    expect(price.total).toBe(sum);
  });

  it("increases price as artwork layers are added", () => {
    const base = createDefaultDesign();
    const withArtwork = {
      ...base,
      artwork: {
        status: "ready" as const,
        layers: [
          {
            id: "a1",
            name: "Motif",
            visible: true,
            dataUrl: "data:image/png;base64,",
            fileName: "motif.png",
            transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          },
        ],
      },
    };
    expect(computePrice(withArtwork).total).toBeGreaterThan(computePrice(base).total);
  });

  it("charges more for premium zari than imitation zari", () => {
    const base = createDefaultDesign();
    const premium = computePrice({ ...base, zariId: "premium" });
    const imitation = computePrice({ ...base, zariId: "imitation" });
    expect(premium.total).toBeGreaterThan(imitation.total);
  });

  it("extends lead time when premium zari is selected", () => {
    const base = createDefaultDesign();
    const premium = computePrice({ ...base, zariId: "premium" });
    const imitation = computePrice({ ...base, zariId: "imitation" });
    expect(premium.leadTimeDaysMax).toBeGreaterThan(imitation.leadTimeDaysMax);
  });
});
