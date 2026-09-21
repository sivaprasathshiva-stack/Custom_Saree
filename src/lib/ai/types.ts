/**
 * AI provider interfaces (requirements §15).
 *
 * Nothing outside `src/lib/ai/**` may import a vendor SDK or know a vendor's
 * response shape (§85 Rule 7). Domain code depends only on these interfaces,
 * so swapping or adding a provider is an adapter change, not a refactor.
 *
 * Every adapter is responsible for (§15.2):
 *   - accepting normalized internal input,
 *   - mapping the provider result onto the internal schema,
 *   - capturing model/version/prompt provenance for reproducibility (§64),
 *   - handling timeout, rate limiting and transient failure,
 *   - sanitizing errors so no secret or raw provider payload escapes.
 */

import type { Composition } from "@/domain/composition";
import type { SareeAnalysisResult } from "@/domain/types";

/** Provenance recorded against every generated artifact (§15.3, §64). */
export interface ProviderMetadata {
  provider: string;
  model: string;
  modelVersion: string;
  promptVersion: string;
  /** The provider's own request id, for support correlation. */
  requestId: string | null;
  latencyMs: number;
}

export interface ProviderResult<T> {
  data: T;
  metadata: ProviderMetadata;
}

/**
 * A provider failure, already sanitized. `retryable` distinguishes a transient
 * outage (worth a backoff retry) from a permanent validation failure, which
 * §32.2 says must never be retried.
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly options: {
      retryable: boolean;
      provider: string;
      /** Stable machine code, e.g. TIMEOUT / RATE_LIMITED / BAD_OUTPUT. */
      reason: string;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "ProviderError";
    if (options.cause !== undefined) this.cause = options.cause;
  }

  get retryable(): boolean {
    return this.options.retryable;
  }
}

/** An image produced by a provider, before it is validated and stored (§63). */
export interface GeneratedImage {
  bytes: Uint8Array;
  mimeType: string;
  width: number;
  height: number;
}

/** A saree reference image handed to a provider. */
export interface SourceImage {
  assetId: string;
  /** Short-lived signed URL. Adapters must not persist this (§51.1). */
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
}

// --- analysis --------------------------------------------------------------

export interface SareeAnalysisInput {
  designId: string;
  images: SourceImage[];
}

export interface SareeAnalysisProvider {
  readonly name: string;
  analyseSaree(
    input: SareeAnalysisInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<SareeAnalysisResult>>;
}

// --- smart placement (§11) -------------------------------------------------

export interface PlacementSuggestion {
  id: string;
  /** Customer-facing name: Classic / Minimal / Statement. */
  label: string;
  /** Plain-language justification shown under the suggestion. */
  reason: string;
  /** Normalized placement per object id, in the §10.1 coordinate space. */
  objects: Record<
    string,
    { x: number; y: number; scale: number; rotation: number }
  >;
}

export interface SmartPlacementInput {
  designId: string;
  analysis: SareeAnalysisResult;
  composition: Composition;
}

export interface SmartPlacementProvider {
  readonly name: string;
  suggestPlacements(
    input: SmartPlacementInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<PlacementSuggestion[]>>;
}

// --- weave optimization (§12) ----------------------------------------------

/**
 * Guidance, not manufacturing validation (§12.1). The optimizer proposes
 * changes; it never silently mutates the customer's composition (§12.3).
 */
export interface WeaveWarning {
  objectId: string;
  severity: "info" | "warning";
  /** Customer-facing, e.g. "Your text may be difficult to weave at this size." */
  message: string;
}

export interface WeaveOptimization {
  warnings: WeaveWarning[];
  /** The composition the customer would get if they accept. */
  proposed: Composition;
  /** True when nothing needed changing. */
  alreadyOptimal: boolean;
}

export interface WeaveOptimizationInput {
  designId: string;
  analysis: SareeAnalysisResult | null;
  composition: Composition;
}

export interface WeaveOptimizationProvider {
  readonly name: string;
  optimizeForWeaving(
    input: WeaveOptimizationInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<WeaveOptimization>>;
}

// --- woven concept (§14) ---------------------------------------------------

export interface WovenConceptInput {
  designId: string;
  sareeImages: SourceImage[];
  ideaImage: SourceImage | null;
  analysis: SareeAnalysisResult | null;
  composition: Composition;
  /**
   * Set when the customer picked a "Make it better" suggestion (§18) — the
   * generation is then a revision of an existing concept, not a fresh one.
   */
  refinement: string | null;
}

export interface WovenConceptProvider {
  readonly name: string;
  generateWovenConcept(
    input: WovenConceptInput,
    signal?: AbortSignal,
  ): Promise<ProviderResult<GeneratedImage>>;
}

// --- drape (§19) -----------------------------------------------------------

export interface DrapeInput {
  designId: string;
  conceptVersionId: string;
  style: string;
  concept: SourceImage;
}

/**
 * Mode-agnostic by design (§19.4): the rest of the application never learns
 * whether a drape came back as frames or as a 3D scene.
 */
export type DrapeResult =
  | {
      mode: "IMAGE_SEQUENCE";
      frames: GeneratedImage[];
      preview: GeneratedImage;
    }
  | {
      mode: "THREE_D";
      scene: { bytes: Uint8Array; mimeType: string };
      preview: GeneratedImage;
    };

export interface DrapeProvider {
  readonly name: string;
  generateDrape(input: DrapeInput, signal?: AbortSignal): Promise<ProviderResult<DrapeResult>>;
}

// --- the provider set ------------------------------------------------------

export interface ProviderSet {
  analysis: SareeAnalysisProvider;
  placement: SmartPlacementProvider;
  optimization: WeaveOptimizationProvider;
  concept: WovenConceptProvider;
  drape: DrapeProvider;
}
