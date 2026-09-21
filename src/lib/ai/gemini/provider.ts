/**
 * Gemini provider implementations (requirements §15).
 *
 * Capability split, driven by what the free tier actually allows:
 *   - saree analysis, smart placement and moderation use `gemini-3.8-flash`,
 *     which is free;
 *   - woven concept and drape generation need a Gemini *image* model, and
 *     every one of those is paid-only. They are therefore opt-in via
 *     AI_IMAGE_PROVIDER=GEMINI and refuse clearly when not enabled, rather
 *     than silently substituting a placeholder.
 *   - weave optimization is deterministic (see ../weave-rules.ts) — spending
 *     a model call on a threshold check would be slower, costlier and less
 *     repeatable.
 */

import { imageObjects, textObjects } from "@/domain/composition";
import type { SareeAnalysisResult, SareeRegion } from "@/domain/types";
import { activePrompt } from "../prompts";
import {
  type DrapeInput,
  type DrapeProvider,
  type DrapeResult,
  type GeneratedImage,
  type ModerationCategory,
  type ModerationInput,
  type ModerationProvider,
  type ModerationVerdict,
  type PlacementSuggestion,
  ProviderError,
  type ProviderMetadata,
  type ProviderResult,
  type SareeAnalysisInput,
  type SareeAnalysisProvider,
  type SmartPlacementInput,
  type SmartPlacementProvider,
  type SourceImage,
  type WeaveOptimization,
  type WeaveOptimizationInput,
  type WeaveOptimizationProvider,
  type WovenConceptInput,
  type WovenConceptProvider,
} from "../types";
import { optimizeForWeaving } from "../weave-rules";
import {
  encodeBase64,
  generateImage,
  generateJson,
  GEMINI_IMAGE_MODEL,
  GEMINI_PROVIDER_NAME,
  GEMINI_TEXT_MODEL,
  type InteractionInput,
  isImageGenerationEnabled,
} from "./client";

const MODEL_VERSION = "v1beta";

/** Drape angles. Each is a paid image call, so the default is deliberately low. */
const DRAPE_ANGLES = ["front", "three-quarter left", "side", "three-quarter right"];

function metadata(promptId: string, model: string, latencyMs: number): ProviderMetadata {
  return {
    provider: GEMINI_PROVIDER_NAME,
    model,
    modelVersion: MODEL_VERSION,
    promptVersion: activePrompt(promptId).version,
    requestId: null,
    latencyMs,
  };
}

/**
 * Fetches a signed-URL asset and inlines it for the API.
 *
 * The signed URL is used immediately and never persisted or logged (§51.1).
 */
async function inlineImage(image: SourceImage, signal?: AbortSignal): Promise<InteractionInput> {
  const response = await fetch(image.url, { signal });
  if (!response.ok) {
    throw new ProviderError("Could not read the source image.", {
      retryable: true,
      provider: GEMINI_PROVIDER_NAME,
      reason: "ASSET_FETCH_FAILED",
    });
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { type: "image", mime_type: image.mimeType, data: encodeBase64(bytes) };
}

function clamp01(value: unknown, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(1, Math.max(0, numeric));
}

function toRegion(raw: unknown): SareeRegion | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (record.x === undefined && record.y === undefined) return null;
  return {
    x: clamp01(record.x, 0),
    y: clamp01(record.y, 0),
    width: clamp01(record.width, 0.1),
    height: clamp01(record.height, 0.1),
    confidence: clamp01(record.confidence, 0.5),
  };
}

// --- saree analysis (free tier) --------------------------------------------

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    sareeDetected: { type: "boolean", description: "Whether a saree is visible at all." },
    boundary: { $ref: "#/$defs/region" },
    body: { $ref: "#/$defs/region" },
    border: { $ref: "#/$defs/region" },
    pallu: { $ref: "#/$defs/region" },
    dominantColours: {
      type: "array",
      items: { type: "string", description: "Hex colour, e.g. #6B2737" },
    },
    motifs: { type: "array", items: { type: "string" } },
    imageQuality: { type: "number", description: "0 to 1." },
    confidence: { type: "number", description: "0 to 1." },
  },
  required: ["sareeDetected", "dominantColours", "motifs", "imageQuality", "confidence"],
  $defs: {
    region: {
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
        confidence: { type: "number" },
      },
    },
  },
} as const;

class GeminiSareeAnalysisProvider implements SareeAnalysisProvider {
  readonly name = GEMINI_PROVIDER_NAME;

  async analyseSaree(
    input: SareeAnalysisInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<SareeAnalysisResult>> {
    const started = Date.now();
    if (input.images.length === 0) {
      throw new ProviderError("No saree image was supplied.", {
        retryable: false,
        provider: GEMINI_PROVIDER_NAME,
        reason: "NO_INPUT",
      });
    }

    const images = await Promise.all(input.images.map((image) => inlineImage(image, signal)));
    const raw = await generateJson<Record<string, unknown>>({
      input: [{ type: "text", text: activePrompt("SAREE_ANALYSIS_PROMPT").render({ analysis: null, composition: { schemaVersion: 1, objects: [] }, refinement: null }) }, ...images],
      schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown> & { type: string },
      signal,
    });

    const colours = Array.isArray(raw.dominantColours)
      ? raw.dominantColours.filter((entry): entry is string => typeof entry === "string").slice(0, 8)
      : [];
    const motifs = Array.isArray(raw.motifs)
      ? raw.motifs.filter((entry): entry is string => typeof entry === "string").slice(0, 8)
      : [];

    const imageQuality = clamp01(raw.imageQuality, 0.7);
    const advisories: string[] = [];
    if (imageQuality < 0.7) {
      advisories.push("This image is a little dark. A brighter photo may help.");
    }
    if (input.images.length === 1) {
      advisories.push("Add another photo for better understanding of your border or pallu.");
    }
    if (raw.sareeDetected === false) {
      advisories.push("We couldn't clearly see a saree in this photo. A full-length shot works best.");
    }

    return {
      data: {
        sareeDetected: raw.sareeDetected !== false,
        boundary: toRegion(raw.boundary),
        body: toRegion(raw.body),
        border: toRegion(raw.border),
        pallu: toRegion(raw.pallu),
        dominantColours: colours,
        motifs,
        imageQuality,
        advisories,
        confidence: clamp01(raw.confidence, 0.6),
      },
      metadata: metadata("SAREE_ANALYSIS_PROMPT", GEMINI_TEXT_MODEL, Date.now() - started),
    };
  }
}

// --- smart placement (free tier) -------------------------------------------

const PLACEMENT_SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string", description: "Classic, Minimal or Statement." },
          reason: { type: "string", description: "One short sentence for the customer." },
          x: { type: "number", description: "0 to 1." },
          y: { type: "number", description: "0 to 1." },
          scale: { type: "number", description: "0.1 to 2." },
        },
        required: ["label", "reason", "x", "y", "scale"],
      },
    },
  },
  required: ["suggestions"],
} as const;

class GeminiSmartPlacementProvider implements SmartPlacementProvider {
  readonly name = GEMINI_PROVIDER_NAME;

  async suggestPlacements(
    input: SmartPlacementInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<PlacementSuggestion[]>> {
    const started = Date.now();
    const movable = input.composition.objects.filter((object) => !object.locked);
    if (movable.length === 0) {
      return {
        data: [],
        metadata: metadata("SAREE_ANALYSIS_PROMPT", GEMINI_TEXT_MODEL, Date.now() - started),
      };
    }

    const { analysis } = input;
    const describe = (label: string, region: SareeRegion | null) =>
      region
        ? `${label}: x=${region.x.toFixed(2)} y=${region.y.toFixed(2)} w=${region.width.toFixed(2)} h=${region.height.toFixed(2)}`
        : `${label}: not detected`;

    const prompt = [
      "You are placing customer artwork on a saree for weaving.",
      "The saree's regions, in normalized 0..1 coordinates:",
      describe("body", analysis.body),
      describe("border", analysis.border),
      describe("pallu", analysis.pallu),
      `Dominant colours: ${analysis.dominantColours.join(", ") || "unknown"}.`,
      `The customer has ${imageObjects(input.composition).length} image(s) and ${textObjects(input.composition).length} text element(s).`,
      "Propose exactly three placements labelled Classic, Minimal and Statement.",
      "Classic should use the pallu, Minimal should sit quietly in the body, Statement should be large on the pallu.",
      "Coordinates are the centre point in 0..1. Keep everything at least 0.04 from every edge.",
      "Each reason must be one short sentence a customer would understand, with no technical terms.",
    ].join(" ");

    const raw = await generateJson<{
      suggestions?: Array<{ label?: string; reason?: string; x?: number; y?: number; scale?: number }>;
    }>({
      input: [{ type: "text", text: prompt }],
      schema: PLACEMENT_SCHEMA as unknown as Record<string, unknown> & { type: string },
      signal,
    });

    const suggestions: PlacementSuggestion[] = (raw.suggestions ?? [])
      .slice(0, 3)
      .map((entry, index) => {
        const objects: PlacementSuggestion["objects"] = {};
        movable.forEach((object, objectIndex) => {
          // Stack multiple objects around the anchor so they never overlap.
          const offset = (objectIndex - (movable.length - 1) / 2) * 0.12;
          objects[object.id] = {
            x: clamp01(entry.x, 0.5),
            y: Math.min(0.96, Math.max(0.04, clamp01(entry.y, 0.7) + offset)),
            scale: Math.min(2, Math.max(0.1, typeof entry.scale === "number" ? entry.scale : 1)),
            rotation: 0,
          };
        });
        return {
          id: (entry.label ?? `suggestion-${index + 1}`).toLowerCase().replace(/\s+/g, "-"),
          label: entry.label ?? `Option ${index + 1}`,
          reason: entry.reason ?? "",
          objects,
        };
      });

    return {
      data: suggestions,
      metadata: metadata("SAREE_ANALYSIS_PROMPT", GEMINI_TEXT_MODEL, Date.now() - started),
    };
  }
}

// --- weave optimization (deterministic, no model call) ----------------------

class RulesWeaveOptimizationProvider implements WeaveOptimizationProvider {
  readonly name = GEMINI_PROVIDER_NAME;

  async optimizeForWeaving(
    input: WeaveOptimizationInput,
  ): Promise<ProviderResult<WeaveOptimization>> {
    const started = Date.now();
    return {
      data: optimizeForWeaving(input.composition),
      metadata: metadata("WOVEN_CONCEPT_PROMPT", "rules", Date.now() - started),
    };
  }
}

// --- moderation (free tier) -------------------------------------------------

const MODERATION_SCHEMA = {
  type: "object",
  properties: {
    allowed: { type: "boolean" },
    categories: {
      type: "array",
      items: {
        type: "string",
        enum: ["SEXUAL", "VIOLENCE", "HATE", "HARASSMENT", "SELF_HARM", "ILLEGAL", "OTHER"],
      },
    },
    reason: { type: "string" },
  },
  required: ["allowed", "categories"],
} as const;

class GeminiModerationProvider implements ModerationProvider {
  readonly name = GEMINI_PROVIDER_NAME;

  async moderate(
    input: ModerationInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<ModerationVerdict>> {
    const started = Date.now();

    const parts: InteractionInput[] = [
      {
        type: "text",
        text: [
          "You are screening customer-submitted content that will be woven onto a silk saree",
          "and reviewed by staff at a family textile business in India.",
          "Refuse sexual content, graphic violence, hate symbols or slurs, harassment,",
          "self-harm content, and anything illegal.",
          "Ordinary names, dates, wedding text, religious and cultural motifs, deities,",
          "flowers, animals and geometric patterns are all ALLOWED — this is traditional",
          "saree iconography, not a policy concern.",
          input.text ? `The customer's text is: "${input.text}"` : "There is no customer text.",
          input.image ? "An image is attached; screen it too." : "",
        ]
          .filter(Boolean)
          .join(" "),
      },
    ];

    if (input.image) parts.push(await inlineImage(input.image, signal));

    const raw = await generateJson<{
      allowed?: boolean;
      categories?: string[];
      reason?: string;
    }>({
      input: parts,
      schema: MODERATION_SCHEMA as unknown as Record<string, unknown> & { type: string },
      signal,
    });

    const categories = (raw.categories ?? []).filter((entry): entry is ModerationCategory =>
      ["SEXUAL", "VIOLENCE", "HATE", "HARASSMENT", "SELF_HARM", "ILLEGAL", "OTHER"].includes(entry),
    );

    return {
      data: {
        // Default to allowed: a moderation model that fails open on ambiguity
        // is preferable to one that blocks a grandmother's name.
        allowed: raw.allowed !== false,
        categories,
        reason: raw.reason ?? null,
      },
      metadata: metadata("SAREE_ANALYSIS_PROMPT", GEMINI_TEXT_MODEL, Date.now() - started),
    };
  }
}

// --- image generation (paid tier) -------------------------------------------

function assertImageGenerationEnabled(): void {
  if (!isImageGenerationEnabled()) {
    throw new ProviderError(
      "Gemini image generation is not enabled. Every Gemini image model requires billing; set AI_IMAGE_PROVIDER=GEMINI once billing is active on the API key.",
      { retryable: false, provider: GEMINI_PROVIDER_NAME, reason: "IMAGE_GENERATION_DISABLED" },
    );
  }
}

class GeminiWovenConceptProvider implements WovenConceptProvider {
  readonly name = GEMINI_PROVIDER_NAME;

  async generateWovenConcept(
    input: WovenConceptInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<GeneratedImage>> {
    const started = Date.now();
    assertImageGenerationEnabled();

    if (input.sareeImages.length === 0) {
      throw new ProviderError("A saree reference image is required.", {
        retryable: false,
        provider: GEMINI_PROVIDER_NAME,
        reason: "NO_INPUT",
      });
    }

    const prompt = activePrompt("WOVEN_CONCEPT_PROMPT").render({
      analysis: input.analysis,
      composition: input.composition,
      refinement: input.refinement,
    });

    // The saree photograph is the edit source; the idea image, when present,
    // is the artwork to weave in.
    const parts: InteractionInput[] = [{ type: "text", text: prompt }];
    parts.push(await inlineImage(input.sareeImages[0], signal));
    if (input.ideaImage) parts.push(await inlineImage(input.ideaImage, signal));

    const image = await generateImage({
      input: parts,
      aspectRatio: "2:3",
      imageSize: "2K",
      signal,
    });

    return {
      data: { bytes: image.bytes, mimeType: image.mimeType, width: 1024, height: 1536 },
      metadata: metadata("WOVEN_CONCEPT_PROMPT", GEMINI_IMAGE_MODEL, Date.now() - started),
    };
  }
}

class GeminiDrapeProvider implements DrapeProvider {
  readonly name = GEMINI_PROVIDER_NAME;

  async generateDrape(
    input: DrapeInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<DrapeResult>> {
    const started = Date.now();
    assertImageGenerationEnabled();

    const base = activePrompt("DRAPE_PROMPT").render({
      analysis: null,
      composition: { schemaVersion: 1, objects: [] },
      refinement: null,
    });
    const concept = await inlineImage(input.concept, signal);

    // One image call per angle. Kept to four rather than a smooth sequence
    // because each frame is billed.
    const frames: GeneratedImage[] = [];
    for (const angle of DRAPE_ANGLES) {
      const image = await generateImage({
        input: [
          {
            type: "text",
            text: `${base} Drape style: ${input.style}. Camera angle: ${angle}. Keep the model, lighting and background identical across angles.`,
          },
          concept,
        ],
        aspectRatio: "2:3",
        signal,
      });
      frames.push({ bytes: image.bytes, mimeType: image.mimeType, width: 720, height: 1080 });
    }

    return {
      data: { mode: "IMAGE_SEQUENCE", frames, preview: frames[0] },
      metadata: metadata("DRAPE_PROMPT", GEMINI_IMAGE_MODEL, Date.now() - started),
    };
  }
}

export function createGeminiProviders() {
  return {
    analysis: new GeminiSareeAnalysisProvider(),
    placement: new GeminiSmartPlacementProvider(),
    optimization: new RulesWeaveOptimizationProvider(),
    concept: new GeminiWovenConceptProvider(),
    drape: new GeminiDrapeProvider(),
    moderation: new GeminiModerationProvider(),
  };
}
