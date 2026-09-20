import { describe, expect, it } from "vitest";
import { checkManufacturability, overallStatus } from "./manufacturability-engine";
import { createDefaultDesign } from "./design-reducer";

describe("checkManufacturability", () => {
  it("flags a design with no artwork for review, not as blocked", () => {
    const checks = checkManufacturability(createDefaultDesign());
    const artworkCheck = checks.find((c) => c.label === "Artwork uploaded");
    expect(artworkCheck?.status).toBe("review");
  });

  it("blocks a repeat width outside the 6-40cm loom range", () => {
    const design = { ...createDefaultDesign(), repeat: { type: "straight" as const, widthCm: 60, heightCm: 18 } };
    const checks = checkManufacturability(design);
    const repeatCheck = checks.find((c) => c.label === "Repeat dimensions");
    expect(repeatCheck?.status).toBe("blocked");
  });

  it("passes a repeat width within the loom range", () => {
    const design = { ...createDefaultDesign(), repeat: { type: "straight" as const, widthCm: 18, heightCm: 18 } };
    const checks = checkManufacturability(design);
    const repeatCheck = checks.find((c) => c.label === "Repeat dimensions");
    expect(repeatCheck?.status).toBe("ready");
  });

  it("flags a weave the material doesn't list as supported for review", () => {
    const design = { ...createDefaultDesign(), materialId: "tus", weaveId: "brocade" };
    const checks = checkManufacturability(design);
    const weaveCheck = checks.find((c) => c.label === "Weave compatible with material");
    expect(weaveCheck?.status).toBe("review");
  });

  it("passes a weave the material lists as supported", () => {
    const design = { ...createDefaultDesign(), materialId: "kan", weaveId: "brocade" };
    const checks = checkManufacturability(design);
    const weaveCheck = checks.find((c) => c.label === "Weave compatible with material");
    expect(weaveCheck?.status).toBe("ready");
  });
});

describe("overallStatus", () => {
  it("is blocked if any check is blocked, even if others are ready", () => {
    const status = overallStatus([
      { label: "a", status: "ready" },
      { label: "b", status: "blocked" },
    ]);
    expect(status).toBe("blocked");
  });

  it("is review if nothing is blocked but something needs review", () => {
    const status = overallStatus([
      { label: "a", status: "ready" },
      { label: "b", status: "review" },
    ]);
    expect(status).toBe("review");
  });

  it("is ready only when every check is ready", () => {
    const status = overallStatus([
      { label: "a", status: "ready" },
      { label: "b", status: "ready" },
    ]);
    expect(status).toBe("ready");
  });
});
