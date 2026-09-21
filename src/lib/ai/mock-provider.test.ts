import { afterEach, describe, expect, it } from "vitest";
import {
  addObject,
  createImageObject,
  createTextObject,
  emptyComposition,
} from "@/domain/composition";
import { createMockProviderSet, MOCK_DRAPE_FRAME_COUNT } from "./mock-provider";
import { ProviderError, type SourceImage, type WovenConceptInput } from "./types";

const providers = createMockProviderSet();

function sourceImage(assetId: string): SourceImage {
  return { assetId, url: `https://example.test/${assetId}`, mimeType: "image/jpeg", width: 1200, height: 1800 };
}

function composition() {
  let next = addObject(emptyComposition(), createImageObject({ id: "img", assetId: "asset-idea" }));
  next = addObject(next, createTextObject({ id: "txt", text: "SEYAAN" }));
  return next;
}

function conceptInput(overrides: Partial<WovenConceptInput> = {}): WovenConceptInput {
  return {
    designId: "design-1",
    sareeImages: [sourceImage("asset-1")],
    ideaImage: sourceImage("asset-idea"),
    analysis: null,
    composition: composition(),
    refinement: null,
    ...overrides,
  };
}

afterEach(() => {
  delete process.env.AI_MOCK_FAIL;
});

describe("mock saree analysis", () => {
  it("returns normalized regions inside the 0..1 space", async () => {
    const { data } = await providers.analysis.analyseSaree({
      designId: "design-1",
      images: [sourceImage("a")],
    });

    expect(data.sareeDetected).toBe(true);
    for (const region of [data.boundary, data.body, data.border, data.pallu]) {
      expect(region).not.toBeNull();
      expect(region!.x).toBeGreaterThanOrEqual(0);
      expect(region!.y).toBeGreaterThanOrEqual(0);
      expect(region!.x + region!.width).toBeLessThanOrEqual(1.001);
      expect(region!.y + region!.height).toBeLessThanOrEqual(1.001);
    }
  });

  it("is deterministic for the same design and assets", async () => {
    const input = { designId: "design-1", images: [sourceImage("a"), sourceImage("b")] };
    const first = await providers.analysis.analyseSaree(input);
    const second = await providers.analysis.analyseSaree(input);
    expect(second.data).toEqual(first.data);
  });

  it("varies with the design rather than returning one fixed answer", async () => {
    // Two designs may legitimately land on the same palette — real sarees
    // share colourways, and there are only a handful of them. The property
    // that matters is that the output is a function of the design at all.
    const analyses = await Promise.all(
      ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"].map((designId) =>
        providers.analysis.analyseSaree({ designId, images: [sourceImage("a")] }),
      ),
    );

    const palettes = new Set(analyses.map((entry) => entry.data.dominantColours.join(",")));
    expect(palettes.size).toBeGreaterThan(1);

    const results = new Set(analyses.map((entry) => JSON.stringify(entry.data)));
    expect(results.size).toBe(analyses.length);
  });

  it("grows more confident as more reference photos are supplied", async () => {
    const one = await providers.analysis.analyseSaree({ designId: "d", images: [sourceImage("a")] });
    const three = await providers.analysis.analyseSaree({
      designId: "d",
      images: [sourceImage("a"), sourceImage("b"), sourceImage("c")],
    });
    expect(three.data.confidence).toBeGreaterThan(one.data.confidence);
  });

  it("suggests a second photo when only one was given (§8.5)", async () => {
    const { data } = await providers.analysis.analyseSaree({
      designId: "d",
      images: [sourceImage("a")],
    });
    expect(data.advisories.some((note) => note.includes("Add another photo"))).toBe(true);
  });

  it("rejects an empty image list as a permanent, non-retryable failure", async () => {
    await expect(
      providers.analysis.analyseSaree({ designId: "d", images: [] }),
    ).rejects.toMatchObject({ name: "ProviderError", retryable: false });
  });

  it("records prompt provenance on every result (§64)", async () => {
    const { metadata } = await providers.analysis.analyseSaree({
      designId: "d",
      images: [sourceImage("a")],
    });
    expect(metadata.provider).toBe("mock");
    expect(metadata.promptVersion).toBeTruthy();
    expect(metadata.model).toBeTruthy();
  });
});

describe("mock smart placement (§11.3)", () => {
  it("returns three distinct named suggestions covering every movable object", async () => {
    const { data: analysis } = await providers.analysis.analyseSaree({
      designId: "d",
      images: [sourceImage("a")],
    });
    const { data } = await providers.placement.suggestPlacements({
      designId: "d",
      analysis,
      composition: composition(),
    });

    expect(data.map((entry) => entry.label)).toEqual(["Classic", "Minimal", "Statement"]);
    for (const suggestion of data) {
      expect(Object.keys(suggestion.objects).sort()).toEqual(["img", "txt"]);
      expect(suggestion.reason).toBeTruthy();
      for (const placement of Object.values(suggestion.objects)) {
        expect(placement.x).toBeGreaterThanOrEqual(0);
        expect(placement.x).toBeLessThanOrEqual(1);
        expect(placement.y).toBeGreaterThanOrEqual(0);
        expect(placement.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it("puts Statement at a larger scale than Minimal", async () => {
    const { data: analysis } = await providers.analysis.analyseSaree({
      designId: "d",
      images: [sourceImage("a")],
    });
    const { data } = await providers.placement.suggestPlacements({
      designId: "d",
      analysis,
      composition: composition(),
    });
    const minimal = data.find((entry) => entry.label === "Minimal")!;
    const statement = data.find((entry) => entry.label === "Statement")!;
    expect(statement.objects.img.scale).toBeGreaterThan(minimal.objects.img.scale);
  });

  it("returns nothing to suggest for an empty canvas", async () => {
    const { data: analysis } = await providers.analysis.analyseSaree({
      designId: "d",
      images: [sourceImage("a")],
    });
    const { data } = await providers.placement.suggestPlacements({
      designId: "d",
      analysis,
      composition: emptyComposition(),
    });
    expect(data).toEqual([]);
  });
});

describe("mock weave optimization (§12)", () => {
  it("warns about unweavably small text and proposes a larger size", async () => {
    const tiny = addObject(
      emptyComposition(),
      createTextObject({ id: "txt", text: "fine print", scale: 0.1 }),
    );
    const { data } = await providers.optimization.optimizeForWeaving({
      designId: "d",
      analysis: null,
      composition: tiny,
    });

    expect(data.alreadyOptimal).toBe(false);
    expect(data.warnings.some((w) => w.message.includes("difficult to weave"))).toBe(true);
    expect(data.proposed.objects[0].scale).toBeGreaterThan(0.1);
  });

  it("proposes changes rather than mutating the input (§12.3)", async () => {
    const original = addObject(
      emptyComposition(),
      createTextObject({ id: "txt", text: "x", scale: 0.1 }),
    );
    const snapshot = JSON.stringify(original);
    await providers.optimization.optimizeForWeaving({
      designId: "d",
      analysis: null,
      composition: original,
    });
    expect(JSON.stringify(original)).toBe(snapshot);
  });

  it("reports a well-placed design as already optimal", async () => {
    const fine = addObject(
      emptyComposition(),
      createImageObject({ id: "img", assetId: "a", scale: 1, x: 0.5, y: 0.5 }),
    );
    const { data } = await providers.optimization.optimizeForWeaving({
      designId: "d",
      analysis: null,
      composition: fine,
    });
    expect(data.alreadyOptimal).toBe(true);
    expect(data.warnings).toEqual([]);
  });

  it("pulls an object off the selvedge", async () => {
    const edge = addObject(
      emptyComposition(),
      createImageObject({ id: "img", assetId: "a", x: 0.999, y: 0.5 }),
    );
    const { data } = await providers.optimization.optimizeForWeaving({
      designId: "d",
      analysis: null,
      composition: edge,
    });
    expect(data.proposed.objects[0].x).toBeLessThan(0.999);
    expect(data.warnings.some((w) => w.severity === "info")).toBe(true);
  });
});

describe("mock woven concept", () => {
  it("produces a decodable image with the declared dimensions (§63)", async () => {
    const { data } = await providers.concept.generateWovenConcept(conceptInput());
    expect(data.bytes.byteLength).toBeGreaterThan(0);
    expect(data.mimeType).toBe("image/svg+xml");
    expect(data.width).toBeGreaterThan(0);
    expect(data.height).toBeGreaterThan(0);

    const svg = new TextDecoder().decode(data.bytes);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
    expect(svg).toContain(`width="${data.width}"`);
  });

  it("renders the customer's own words into the concept", async () => {
    const { data } = await providers.concept.generateWovenConcept(conceptInput());
    expect(new TextDecoder().decode(data.bytes)).toContain("SEYAAN");
  });

  it("escapes text so a composition can never inject markup", async () => {
    const hostile = addObject(
      emptyComposition(),
      createTextObject({ id: "t", text: `</text><script>x</script>` }),
    );
    const { data } = await providers.concept.generateWovenConcept(
      conceptInput({ composition: hostile }),
    );
    const svg = new TextDecoder().decode(data.bytes);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;");
  });

  it("is deterministic for an unchanged design but changes when the design does", async () => {
    const first = await providers.concept.generateWovenConcept(conceptInput());
    const second = await providers.concept.generateWovenConcept(conceptInput());
    expect(second.data.bytes).toEqual(first.data.bytes);

    const moved = addObject(emptyComposition(), createImageObject({ id: "img", assetId: "a", x: 0.2 }));
    const third = await providers.concept.generateWovenConcept(conceptInput({ composition: moved }));
    expect(third.data.bytes).not.toEqual(first.data.bytes);
  });

  it("treats a missing saree reference as permanent, not retryable", async () => {
    await expect(
      providers.concept.generateWovenConcept(conceptInput({ sareeImages: [] })),
    ).rejects.toMatchObject({ retryable: false });
  });

  it("exposes a deliberate failure hook for exercising retry (§37)", async () => {
    process.env.AI_MOCK_FAIL = "1";
    const error = await providers.concept
      .generateWovenConcept(conceptInput())
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ProviderError);
    expect((error as ProviderError).retryable).toBe(true);
  });
});

describe("mock drape (§19.4)", () => {
  it("returns a full image sequence plus a preview", async () => {
    const { data } = await providers.drape.generateDrape({
      designId: "d",
      conceptVersionId: "v1",
      style: "Bridal",
      concept: sourceImage("concept"),
    });

    expect(data.mode).toBe("IMAGE_SEQUENCE");
    if (data.mode !== "IMAGE_SEQUENCE") throw new Error("unreachable");
    expect(data.frames).toHaveLength(MOCK_DRAPE_FRAME_COUNT);
    expect(data.preview.bytes.byteLength).toBeGreaterThan(0);
    for (const frame of data.frames) {
      expect(frame.width).toBeGreaterThan(0);
      expect(frame.bytes.byteLength).toBeGreaterThan(0);
    }
  });

  it("labels every placeholder frame honestly", async () => {
    const { data } = await providers.drape.generateDrape({
      designId: "d",
      conceptVersionId: "v1",
      style: "Classic",
      concept: sourceImage("concept"),
    });
    if (data.mode !== "IMAGE_SEQUENCE") throw new Error("unreachable");
    expect(new TextDecoder().decode(data.frames[0].bytes)).toContain("PLACEHOLDER");
  });

  it("produces different frames per drape style", async () => {
    const classic = await providers.drape.generateDrape({
      designId: "d", conceptVersionId: "v1", style: "Classic", concept: sourceImage("c"),
    });
    const bridal = await providers.drape.generateDrape({
      designId: "d", conceptVersionId: "v1", style: "Bridal", concept: sourceImage("c"),
    });
    if (classic.data.mode !== "IMAGE_SEQUENCE" || bridal.data.mode !== "IMAGE_SEQUENCE") {
      throw new Error("unreachable");
    }
    expect(bridal.data.frames[0].bytes).not.toEqual(classic.data.frames[0].bytes);
  });
});
