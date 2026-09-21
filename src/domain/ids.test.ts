import { describe, expect, it } from "vitest";
import {
  ConceptSequenceExhaustedError,
  formatConceptId,
  generationIdempotencyKey,
  hashComposition,
  isConceptId,
  MAX_CONCEPT_SEQUENCE,
  parseConceptId,
} from "./ids";

describe("formatConceptId", () => {
  it("produces the VL-YYYY-NNNNNN shape from §21", () => {
    expect(formatConceptId(2026, 123)).toBe("VL-2026-000123");
    expect(formatConceptId(2026, 1)).toBe("VL-2026-000001");
    expect(formatConceptId(2026, MAX_CONCEPT_SEQUENCE)).toBe("VL-2026-999999");
  });

  it("rejects non-positive and non-integer sequences", () => {
    expect(() => formatConceptId(2026, 0)).toThrow(TypeError);
    expect(() => formatConceptId(2026, -1)).toThrow(TypeError);
    expect(() => formatConceptId(2026, 1.5)).toThrow(TypeError);
  });

  it("fails loudly rather than wrapping when the year's sequence runs out", () => {
    expect(() => formatConceptId(2026, MAX_CONCEPT_SEQUENCE + 1)).toThrow(
      ConceptSequenceExhaustedError,
    );
  });
});

describe("parseConceptId", () => {
  it("round-trips a formatted id", () => {
    expect(parseConceptId(formatConceptId(2026, 123))).toEqual({ year: 2026, sequence: 123 });
  });

  it("tolerates casing and whitespace", () => {
    expect(parseConceptId("  vl-2026-000123 ")).toEqual({ year: 2026, sequence: 123 });
  });

  it("returns null for anything that isn't a concept id", () => {
    for (const value of ["", "VL-2026-123", "XX-2026-000123", "VL-26-000123", "nonsense"]) {
      expect(parseConceptId(value)).toBeNull();
      expect(isConceptId(value)).toBe(false);
    }
  });
});

describe("hashComposition", () => {
  it("is stable across key order", () => {
    expect(hashComposition({ a: 1, b: 2 })).toBe(hashComposition({ b: 2, a: 1 }));
  });

  it("changes when the composition actually changes", () => {
    expect(hashComposition({ a: 1 })).not.toBe(hashComposition({ a: 2 }));
  });

  it("distinguishes array order, which does matter", () => {
    expect(hashComposition([1, 2])).not.toBe(hashComposition([2, 1]));
  });

  it("ignores undefined values rather than hashing them inconsistently", () => {
    expect(hashComposition({ a: 1, b: undefined })).toBe(hashComposition({ a: 1 }));
  });
});

describe("generationIdempotencyKey", () => {
  it("is identical for a repeated click on an unchanged composition (§14.6)", () => {
    const composition = { schemaVersion: 1, objects: [] };
    const first = generationIdempotencyKey("design-1", hashComposition(composition));
    const second = generationIdempotencyKey("design-1", hashComposition(composition));
    expect(first).toBe(second);
  });

  it("differs once the customer edits the design", () => {
    const before = generationIdempotencyKey("design-1", hashComposition({ objects: [] }));
    const after = generationIdempotencyKey("design-1", hashComposition({ objects: [{ id: "a" }] }));
    expect(before).not.toBe(after);
  });

  it("never collides across designs", () => {
    const hash = hashComposition({ objects: [] });
    expect(generationIdempotencyKey("design-1", hash)).not.toBe(
      generationIdempotencyKey("design-2", hash),
    );
  });
});
