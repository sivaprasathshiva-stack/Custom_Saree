import { describe, expect, it } from "vitest";
import {
  addObject,
  COMPOSITION_SCHEMA_VERSION,
  createImageObject,
  createTextObject,
  deleteObject,
  emptyComposition,
  isEmpty,
  MAX_BLEED,
  moveObject,
  normalizeRotation,
  referencedAssetIds,
  rotateObject,
  scaleObject,
  SCALE_MAX,
  SCALE_MIN,
  updateText,
  validateComposition,
} from "./composition";
import { MAX_TEXT_LENGTH } from "@/config/limits";

function withImage() {
  return addObject(
    emptyComposition(),
    createImageObject({ id: "img-1", assetId: "asset-1" }),
  );
}

describe("createImageObject / createTextObject", () => {
  it("centres a new image and gives it sane defaults", () => {
    const object = createImageObject({ id: "a", assetId: "asset-a" });
    expect(object.x).toBe(0.5);
    expect(object.y).toBe(0.5);
    expect(object.scale).toBe(1);
    expect(object.opacity).toBe(1);
    expect(object.locked).toBe(false);
  });

  it("clamps out-of-range input at construction", () => {
    const object = createImageObject({ id: "a", assetId: "asset-a", scale: 99, rotation: -90 });
    expect(object.scale).toBe(SCALE_MAX);
    expect(object.rotation).toBe(270);
  });
});

describe("mutations", () => {
  it("adds objects with increasing z-index", () => {
    let composition = withImage();
    composition = addObject(composition, createTextObject({ id: "txt-1", text: "SEYAAN" }));
    expect(composition.objects).toHaveLength(2);
    expect(composition.objects[1].zIndex).toBeGreaterThan(composition.objects[0].zIndex);
  });

  it("moves, scales and rotates by id", () => {
    let composition = withImage();
    composition = moveObject(composition, "img-1", 0.2, 0.8);
    composition = scaleObject(composition, "img-1", 1.5);
    composition = rotateObject(composition, "img-1", 45);
    const object = composition.objects[0];
    expect(object.x).toBeCloseTo(0.2);
    expect(object.y).toBeCloseTo(0.8);
    expect(object.scale).toBeCloseTo(1.5);
    expect(object.rotation).toBe(45);
  });

  it("never lets an object be dragged out of reach (§10.3)", () => {
    const composition = moveObject(withImage(), "img-1", 99, -99);
    expect(composition.objects[0].x).toBe(1 + MAX_BLEED);
    expect(composition.objects[0].y).toBe(-MAX_BLEED);
  });

  it("clamps scale to the supported range", () => {
    expect(scaleObject(withImage(), "img-1", 0).objects[0].scale).toBe(SCALE_MIN);
    expect(scaleObject(withImage(), "img-1", 1000).objects[0].scale).toBe(SCALE_MAX);
  });

  it("deletes by id", () => {
    expect(isEmpty(deleteObject(withImage(), "img-1"))).toBe(true);
  });

  it("returns the same composition when the id is unknown (no accidental churn)", () => {
    const composition = withImage();
    expect(deleteObject(composition, "nope")).toBe(composition);
    expect(moveObject(composition, "nope", 0.1, 0.1)).toBe(composition);
  });

  it("refuses to mutate or delete a locked object", () => {
    const base = withImage();
    const locked = {
      ...base,
      objects: base.objects.map((object) => ({ ...object, locked: true })),
    };
    expect(moveObject(locked, "img-1", 0.1, 0.1)).toBe(locked);
    expect(deleteObject(locked, "img-1").objects).toHaveLength(1);
  });

  it("updates text only on text objects", () => {
    let composition = addObject(
      emptyComposition(),
      createTextObject({ id: "txt-1", text: "before" }),
    );
    composition = updateText(composition, "txt-1", "after");
    expect(composition.objects[0]).toMatchObject({ type: "text", text: "after" });
  });

  it("does not mutate the input composition", () => {
    const original = withImage();
    const snapshot = JSON.stringify(original);
    moveObject(original, "img-1", 0.1, 0.1);
    scaleObject(original, "img-1", 2);
    deleteObject(original, "img-1");
    expect(JSON.stringify(original)).toBe(snapshot);
  });
});

describe("normalizeRotation", () => {
  it("wraps into 0..359", () => {
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(360)).toBe(0);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
  });

  it("treats non-finite input as no rotation", () => {
    expect(normalizeRotation(Number.NaN)).toBe(0);
    expect(normalizeRotation(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("validateComposition", () => {
  it("accepts a well-formed composition", () => {
    const result = validateComposition(withImage());
    expect(result.valid).toBe(true);
    expect(result.composition?.objects).toHaveLength(1);
  });

  it("rejects non-objects and wrong schema versions", () => {
    expect(validateComposition(null).valid).toBe(false);
    expect(validateComposition("nope").valid).toBe(false);
    expect(validateComposition({ schemaVersion: 999, objects: [] }).valid).toBe(false);
  });

  it("rejects duplicate object ids", () => {
    const result = validateComposition({
      schemaVersion: COMPOSITION_SCHEMA_VERSION,
      objects: [
        createImageObject({ id: "dup", assetId: "a" }),
        createImageObject({ id: "dup", assetId: "b" }),
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.message.includes("Duplicate"))).toBe(true);
  });

  it("rejects an image object with no asset reference", () => {
    const result = validateComposition({
      schemaVersion: COMPOSITION_SCHEMA_VERSION,
      objects: [{ ...createImageObject({ id: "a", assetId: "x" }), assetId: "" }],
    });
    expect(result.valid).toBe(false);
  });

  it("enforces the text ceiling server-side, not just in the UI (§9.2)", () => {
    const result = validateComposition({
      schemaVersion: COMPOSITION_SCHEMA_VERSION,
      objects: [createTextObject({ id: "t", text: "x".repeat(MAX_TEXT_LENGTH + 1) })],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toContain("text");
  });

  it("accepts text exactly at the limit", () => {
    const result = validateComposition({
      schemaVersion: COMPOSITION_SCHEMA_VERSION,
      objects: [createTextObject({ id: "t", text: "x".repeat(MAX_TEXT_LENGTH) })],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects NaN and out-of-range coordinates", () => {
    const result = validateComposition({
      schemaVersion: COMPOSITION_SCHEMA_VERSION,
      objects: [{ ...createImageObject({ id: "a", assetId: "x" }), x: Number.NaN }],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects an unknown object type", () => {
    const result = validateComposition({
      schemaVersion: COMPOSITION_SCHEMA_VERSION,
      objects: [{ ...createImageObject({ id: "a", assetId: "x" }), type: "video" }],
    });
    expect(result.valid).toBe(false);
  });
});

describe("referencedAssetIds", () => {
  it("lists every image asset the composition depends on", () => {
    let composition = withImage();
    composition = addObject(composition, createImageObject({ id: "img-2", assetId: "asset-2" }));
    composition = addObject(composition, createTextObject({ id: "t", text: "hi" }));
    expect(referencedAssetIds(composition).sort()).toEqual(["asset-1", "asset-2"]);
  });
});
