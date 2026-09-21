/**
 * Mock AI providers (requirements §71).
 *
 * Mock mode is not a toy: it is what makes local development, CI and the E2E
 * suite possible without spending money or needing network access. It
 * therefore has to behave like the real thing — deterministic output for the
 * same input, realistic processing delay, and the same success/failure shapes
 * a real provider produces.
 *
 * Determinism matters: the same design must always produce the same concept,
 * so a visual-regression test (§70.4) has something stable to compare against.
 */

import { imageObjects, textObjects } from "@/domain/composition";
import type { SareeAnalysisResult, SareeRegion } from "@/domain/types";
import { activePrompt } from "./prompts";
import {
  type DrapeInput,
  type DrapeProvider,
  type DrapeResult,
  type GeneratedImage,
  type PlacementSuggestion,
  ProviderError,
  type ProviderMetadata,
  type ProviderResult,
  type ProviderSet,
  type SareeAnalysisInput,
  type SareeAnalysisProvider,
  type SmartPlacementInput,
  type SmartPlacementProvider,
  type WeaveOptimization,
  type WeaveOptimizationInput,
  type WeaveOptimizationProvider,
  type WeaveWarning,
  type WovenConceptInput,
  type WovenConceptProvider,
} from "./types";

const PROVIDER_NAME = "mock";
const MODEL = "velvorea-mock-loom";
const MODEL_VERSION = "1.0.0";

const CONCEPT_WIDTH = 1024;
const CONCEPT_HEIGHT = 1536;
const DRAPE_FRAME_COUNT = 12;

/** Simulated latency. Kept short in tests so the suite stays fast. */
function simulatedDelayMs(base: number): number {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return 0;
  const configured = Number.parseInt(process.env.AI_MOCK_DELAY_MS ?? "", 10);
  return Number.isFinite(configured) ? configured : base;
}

async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new ProviderError("Generation was cancelled.", {
          retryable: false,
          provider: PROVIDER_NAME,
          reason: "ABORTED",
        }));
      },
      { once: true },
    );
  });
}

/** Deterministic 32-bit hash used to seed every mock output. */
function seedFrom(...parts: string[]): number {
  let hash = 0x811c9dc5;
  const input = parts.join("|");
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Small deterministic PRNG (mulberry32) so mock output is reproducible. */
function rng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A believable silk palette, chosen deterministically rather than at random. */
const PALETTES: ReadonlyArray<readonly string[]> = [
  ["#6B2737", "#B1552F", "#AD8A4E", "#F8F2E7"],
  ["#1F3D2B", "#3F6B4A", "#C9A227", "#F3EFE2"],
  ["#2E2A5B", "#5A4FA3", "#C0A062", "#F5F1E6"],
  ["#7A1F2B", "#C25E3A", "#E0B252", "#FBF6EB"],
  ["#123A40", "#2E6B75", "#B8912F", "#F2F0E6"],
];

const MOTIF_VOCABULARY = [
  "temple border",
  "mango paisley",
  "lotus butta",
  "peacock motif",
  "checked korvai",
  "floral vine",
];

function metadata(promptId: string, latencyMs: number): ProviderMetadata {
  const prompt = activePrompt(promptId);
  return {
    provider: PROVIDER_NAME,
    model: MODEL,
    modelVersion: MODEL_VERSION,
    promptVersion: prompt.version,
    requestId: null,
    latencyMs,
  };
}

function encode(svg: string): Uint8Array {
  return new TextEncoder().encode(svg);
}

function region(x: number, y: number, width: number, height: number, confidence: number): SareeRegion {
  return { x, y, width, height, confidence };
}

// --- analysis --------------------------------------------------------------

class MockSareeAnalysisProvider implements SareeAnalysisProvider {
  readonly name = PROVIDER_NAME;

  async analyseSaree(
    input: SareeAnalysisInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<SareeAnalysisResult>> {
    const started = Date.now();
    await delay(simulatedDelayMs(1200), signal);

    if (input.images.length === 0) {
      throw new ProviderError("No saree image was supplied.", {
        retryable: false,
        provider: PROVIDER_NAME,
        reason: "NO_INPUT",
      });
    }

    const seed = seedFrom(input.designId, ...input.images.map((image) => image.assetId));
    const random = rng(seed);
    const palette = PALETTES[seed % PALETTES.length];

    // More reference photos means more of the saree is actually visible, so
    // confidence rises with coverage — the same way a real pipeline behaves.
    const coverageBonus = Math.min(input.images.length - 1, 2) * 0.08;
    const confidence = Math.min(0.95, 0.68 + coverageBonus + random() * 0.1);
    const imageQuality = Math.min(1, 0.6 + random() * 0.4);

    const advisories: string[] = [];
    if (imageQuality < 0.7) {
      advisories.push("This image is a little dark. A brighter photo may help.");
    }
    if (input.images.length === 1) {
      advisories.push("Add another photo for better understanding of your border or pallu.");
    }

    const motifCount = 1 + Math.floor(random() * 3);
    const motifs = Array.from({ length: motifCount }, (_, index) => {
      return MOTIF_VOCABULARY[(seed + index * 7) % MOTIF_VOCABULARY.length];
    });

    return {
      data: {
        sareeDetected: true,
        boundary: region(0.02, 0.02, 0.96, 0.96, confidence),
        // Proportions follow a conventional saree layout: a dominant body, a
        // border running the length, and the pallu at one end.
        body: region(0.08, 0.05, 0.84, 0.62, confidence),
        border: region(0.02, 0.05, 0.08, 0.9, confidence * 0.95),
        pallu: region(0.08, 0.68, 0.84, 0.28, confidence * 0.92),
        dominantColours: [...palette],
        motifs,
        imageQuality,
        advisories,
        confidence,
      },
      metadata: metadata("SAREE_ANALYSIS_PROMPT", Date.now() - started),
    };
  }
}

// --- smart placement (§11.3) -----------------------------------------------

class MockSmartPlacementProvider implements SmartPlacementProvider {
  readonly name = PROVIDER_NAME;

  async suggestPlacements(
    input: SmartPlacementInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<PlacementSuggestion[]>> {
    const started = Date.now();
    await delay(simulatedDelayMs(600), signal);

    const { composition, analysis } = input;
    const movable = composition.objects.filter((object) => !object.locked);
    if (movable.length === 0) {
      return { data: [], metadata: metadata("SAREE_ANALYSIS_PROMPT", Date.now() - started) };
    }

    const pallu = analysis.pallu;
    const body = analysis.body;

    // Each preset anchors the artwork in a genuinely different part of the
    // saree, rather than nudging the same spot three times.
    const anchors = [
      {
        id: "classic",
        label: "Classic",
        reason: "Uses the open space on your pallu.",
        point: pallu
          ? { x: pallu.x + pallu.width / 2, y: pallu.y + pallu.height / 2 }
          : { x: 0.5, y: 0.78 },
        scale: 0.9,
      },
      {
        id: "minimal",
        label: "Minimal",
        reason: "Sits quietly in the body of the saree.",
        point: body
          ? { x: body.x + body.width / 2, y: body.y + body.height * 0.35 }
          : { x: 0.5, y: 0.35 },
        scale: 0.55,
      },
      {
        id: "statement",
        label: "Statement",
        reason: "Fills the pallu so it reads from across a room.",
        point: pallu
          ? { x: pallu.x + pallu.width / 2, y: pallu.y + pallu.height / 2 }
          : { x: 0.5, y: 0.74 },
        scale: 1.45,
      },
    ];

    const suggestions: PlacementSuggestion[] = anchors.map((anchor) => {
      const objects: PlacementSuggestion["objects"] = {};
      movable.forEach((object, index) => {
        // Stack multiple objects vertically around the anchor so they never
        // land exactly on top of one another.
        const offset = (index - (movable.length - 1) / 2) * 0.12;
        objects[object.id] = {
          x: anchor.point.x,
          y: Math.min(0.98, Math.max(0.02, anchor.point.y + offset)),
          scale: object.type === "text" ? anchor.scale * 0.8 : anchor.scale,
          rotation: 0,
        };
      });
      return { id: anchor.id, label: anchor.label, reason: anchor.reason, objects };
    });

    return { data: suggestions, metadata: metadata("SAREE_ANALYSIS_PROMPT", Date.now() - started) };
  }
}

// --- weave optimization (§12) ----------------------------------------------

/**
 * Thresholds below which a motif or letterform stops surviving the loom.
 * These are guidance defaults, not manufacturing truth — §12.1 is explicit
 * that final feasibility is decided at VELVOREA's technical review.
 */
const MIN_WEAVABLE_TEXT_SCALE = 0.6;
const MIN_WEAVABLE_IMAGE_SCALE = 0.25;
const EDGE_MARGIN = 0.04;

class MockWeaveOptimizationProvider implements WeaveOptimizationProvider {
  readonly name = PROVIDER_NAME;

  async optimizeForWeaving(
    input: WeaveOptimizationInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<WeaveOptimization>> {
    const started = Date.now();
    await delay(simulatedDelayMs(400), signal);

    const warnings: WeaveWarning[] = [];
    const objects = input.composition.objects.map((object) => {
      let { x, y, scale } = object;

      if (object.type === "text" && scale < MIN_WEAVABLE_TEXT_SCALE) {
        warnings.push({
          objectId: object.id,
          severity: "warning",
          message: "Your text may be difficult to weave at this size.",
        });
        scale = MIN_WEAVABLE_TEXT_SCALE;
      }

      if (object.type === "image" && scale < MIN_WEAVABLE_IMAGE_SCALE) {
        warnings.push({
          objectId: object.id,
          severity: "warning",
          message: "Fine detail at this size may be lost on the loom.",
        });
        scale = MIN_WEAVABLE_IMAGE_SCALE;
      }

      const clampedX = Math.min(1 - EDGE_MARGIN, Math.max(EDGE_MARGIN, x));
      const clampedY = Math.min(1 - EDGE_MARGIN, Math.max(EDGE_MARGIN, y));
      if (clampedX !== x || clampedY !== y) {
        warnings.push({
          objectId: object.id,
          severity: "info",
          message: "Moved slightly inward so the design clears the selvedge.",
        });
        x = clampedX;
        y = clampedY;
      }

      return { ...object, x, y, scale };
    });

    return {
      data: {
        warnings,
        proposed: { ...input.composition, objects },
        alreadyOptimal: warnings.length === 0,
      },
      metadata: metadata("WOVEN_CONCEPT_PROMPT", Date.now() - started),
    };
  }
}

// --- woven concept ---------------------------------------------------------

/**
 * Draws a deterministic woven-silk visualisation as SVG.
 *
 * This is explicitly a stand-in for a real generative model — it renders the
 * customer's actual composition at the correct normalized coordinates over a
 * woven-looking ground, so the whole pipeline (storage, versioning, the
 * before/after slider, the drape) can be exercised honestly end to end.
 */
function renderConceptSvg(
  input: WovenConceptInput,
  seed: number,
): string {
  const random = rng(seed);
  const palette = input.analysis?.dominantColours?.length
    ? input.analysis.dominantColours
    : [...PALETTES[seed % PALETTES.length]];
  const [base, secondary, zari, light] = [
    palette[0] ?? "#6B2737",
    palette[1] ?? "#B1552F",
    palette[2] ?? "#AD8A4E",
    palette[3] ?? "#F8F2E7",
  ];

  const w = CONCEPT_WIDTH;
  const h = CONCEPT_HEIGHT;
  const px = (value: number, axis: "x" | "y") => (axis === "x" ? value * w : value * h).toFixed(1);

  // Warp/weft threads give the surface a genuine woven texture rather than a
  // flat fill, which is the whole point of the "woven concept" screen.
  const warp: string[] = [];
  for (let x = 0; x < w; x += 6) {
    const opacity = (0.05 + random() * 0.07).toFixed(3);
    warp.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${light}" stroke-width="1" opacity="${opacity}"/>`);
  }
  const weft: string[] = [];
  for (let y = 0; y < h; y += 6) {
    const opacity = (0.04 + random() * 0.06).toFixed(3);
    weft.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#000000" stroke-width="1" opacity="${opacity}"/>`);
  }

  const artwork: string[] = [];
  for (const object of imageObjects(input.composition)) {
    const boxW = object.boundingBox.width * object.scale * w;
    const boxH = object.boundingBox.height * object.scale * h;
    const cx = Number(px(object.x, "x"));
    const cy = Number(px(object.y, "y"));
    artwork.push(
      `<g transform="rotate(${object.rotation.toFixed(1)} ${cx} ${cy})" opacity="${object.opacity}">` +
        `<rect x="${(cx - boxW / 2).toFixed(1)}" y="${(cy - boxH / 2).toFixed(1)}" ` +
        `width="${boxW.toFixed(1)}" height="${boxH.toFixed(1)}" ` +
        `fill="${zari}" opacity="0.72" rx="4"/>` +
        `<rect x="${(cx - boxW / 2).toFixed(1)}" y="${(cy - boxH / 2).toFixed(1)}" ` +
        `width="${boxW.toFixed(1)}" height="${boxH.toFixed(1)}" ` +
        `fill="none" stroke="${light}" stroke-width="2" opacity="0.5" rx="4"/>` +
        `</g>`,
    );
  }

  for (const object of textObjects(input.composition)) {
    const cx = Number(px(object.x, "x"));
    const cy = Number(px(object.y, "y"));
    const fontSize = Math.max(12, object.boundingBox.height * object.scale * h * 0.6);
    const escaped = object.text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    artwork.push(
      `<g transform="rotate(${object.rotation.toFixed(1)} ${cx} ${cy})" opacity="${object.opacity}">` +
        `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" ` +
        `font-family="Georgia, serif" font-size="${fontSize.toFixed(1)}" ` +
        `letter-spacing="${(fontSize * 0.08).toFixed(1)}" fill="${zari}">${escaped}</text>` +
        `</g>`,
    );
  }

  const borderWidth = w * 0.08;
  const palluTop = h * 0.7;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<defs><linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0%" stop-color="${base}"/><stop offset="100%" stop-color="${secondary}"/>`,
    `</linearGradient></defs>`,
    `<rect width="${w}" height="${h}" fill="url(#ground)"/>`,
    warp.join(""),
    weft.join(""),
    // Border strips down both selvedges.
    `<rect x="0" y="0" width="${borderWidth}" height="${h}" fill="${zari}" opacity="0.32"/>`,
    `<rect x="${w - borderWidth}" y="0" width="${borderWidth}" height="${h}" fill="${zari}" opacity="0.32"/>`,
    // Pallu band across the lower third.
    `<rect x="0" y="${palluTop}" width="${w}" height="${h - palluTop}" fill="${zari}" opacity="0.18"/>`,
    `<line x1="0" y1="${palluTop}" x2="${w}" y2="${palluTop}" stroke="${zari}" stroke-width="3" opacity="0.6"/>`,
    artwork.join(""),
    `</svg>`,
  ].join("");
}

class MockWovenConceptProvider implements WovenConceptProvider {
  readonly name = PROVIDER_NAME;

  async generateWovenConcept(
    input: WovenConceptInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<GeneratedImage>> {
    const started = Date.now();
    await delay(simulatedDelayMs(2500), signal);

    if (input.sareeImages.length === 0) {
      throw new ProviderError("A saree reference image is required.", {
        retryable: false,
        provider: PROVIDER_NAME,
        reason: "NO_INPUT",
      });
    }

    // An explicit, opt-in failure hook so the retry path (§37, AC-010) can be
    // exercised deliberately in development and tests.
    if (process.env.AI_MOCK_FAIL === "1") {
      throw new ProviderError("Mock provider was told to fail.", {
        retryable: true,
        provider: PROVIDER_NAME,
        reason: "FORCED_FAILURE",
      });
    }

    const seed = seedFrom(
      input.designId,
      input.refinement ?? "",
      JSON.stringify(input.composition.objects.map((object) => [object.id, object.x, object.y, object.scale])),
    );

    return {
      data: {
        bytes: encode(renderConceptSvg(input, seed)),
        mimeType: "image/svg+xml",
        width: CONCEPT_WIDTH,
        height: CONCEPT_HEIGHT,
      },
      metadata: metadata("WOVEN_CONCEPT_PROMPT", Date.now() - started),
    };
  }
}

// --- drape -----------------------------------------------------------------

function renderDrapeFrame(style: string, angleDegrees: number, seed: number): string {
  const palette = PALETTES[seed % PALETTES.length];
  const [base, secondary, zari] = [palette[0], palette[1], palette[2]];
  const w = 720;
  const h = 1080;

  // A simple rotating silhouette: enough to prove the frame-scrubbing viewer
  // works, and honestly labelled as a placeholder everywhere it is shown.
  const lean = Math.sin((angleDegrees * Math.PI) / 180) * 18;
  const shade = 0.75 + Math.cos((angleDegrees * Math.PI) / 180) * 0.25;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<rect width="${w}" height="${h}" fill="#241A16"/>`,
    `<g transform="translate(${(w / 2 + lean).toFixed(1)} 0)" opacity="${shade.toFixed(2)}">`,
    `<ellipse cx="0" cy="150" rx="62" ry="74" fill="#3A2A22"/>`,
    `<path d="M-96 230 Q-130 640 -96 1010 L96 1010 Q130 640 96 230 Q0 292 -96 230Z" fill="${base}"/>`,
    `<path d="M-96 230 Q-130 640 -96 1010 L-20 1010 Q-44 640 -34 230Z" fill="${secondary}" opacity="0.8"/>`,
    `<path d="M30 280 Q140 400 120 640 Q108 720 40 760" fill="none" stroke="${zari}" stroke-width="14" stroke-linecap="round" opacity="0.85"/>`,
    `</g>`,
    `<text x="${w / 2}" y="${h - 32}" text-anchor="middle" font-family="monospace" font-size="16" fill="#F8F2E7" opacity="0.5">NILA — ${style.toUpperCase()} — PLACEHOLDER</text>`,
    `</svg>`,
  ].join("");
}

class MockDrapeProvider implements DrapeProvider {
  readonly name = PROVIDER_NAME;

  async generateDrape(
    input: DrapeInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<DrapeResult>> {
    const started = Date.now();
    await delay(simulatedDelayMs(3000), signal);

    const seed = seedFrom(input.designId, input.conceptVersionId, input.style);
    const step = 360 / DRAPE_FRAME_COUNT;

    const frames: GeneratedImage[] = Array.from({ length: DRAPE_FRAME_COUNT }, (_, index) => ({
      bytes: encode(renderDrapeFrame(input.style, index * step, seed)),
      mimeType: "image/svg+xml",
      width: 720,
      height: 1080,
    }));

    return {
      data: { mode: "IMAGE_SEQUENCE", frames, preview: frames[0] },
      metadata: metadata("DRAPE_PROMPT", Date.now() - started),
    };
  }
}

// --- assembly --------------------------------------------------------------

export function createMockProviderSet(): ProviderSet {
  return {
    analysis: new MockSareeAnalysisProvider(),
    placement: new MockSmartPlacementProvider(),
    optimization: new MockWeaveOptimizationProvider(),
    concept: new MockWovenConceptProvider(),
    drape: new MockDrapeProvider(),
  };
}

export const MOCK_PROVIDER_NAME = PROVIDER_NAME;
export const MOCK_CONCEPT_DIMENSIONS = { width: CONCEPT_WIDTH, height: CONCEPT_HEIGHT };
export const MOCK_DRAPE_FRAME_COUNT = DRAPE_FRAME_COUNT;
