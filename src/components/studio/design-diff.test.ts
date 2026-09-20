import { describe, expect, it } from "vitest";
import { diffDesigns } from "./design-diff";
import { createDefaultDesign } from "./design-reducer";

describe("diffDesigns", () => {
  it("reports no changes for two identical designs", () => {
    const a = createDefaultDesign();
    const b = createDefaultDesign();
    const rows = diffDesigns(a, b);
    expect(rows.every((r) => !r.changed)).toBe(true);
  });

  it("flags only the fields that differ", () => {
    const a = createDefaultDesign();
    const b = { ...createDefaultDesign(), borderId: `${a.borderId}-alt`, name: "Renamed" };
    const rows = diffDesigns(a, b);
    const changed = rows.filter((r) => r.changed).map((r) => r.label);
    expect(changed).toEqual(expect.arrayContaining(["Name", "Border"]));
    expect(changed).not.toContain("Material");
  });
});
