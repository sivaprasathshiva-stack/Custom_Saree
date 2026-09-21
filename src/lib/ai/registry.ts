/**
 * Provider selection (requirements §15, §57, §65, §71).
 *
 * Two independent switches, because Gemini's free tier splits along exactly
 * this line:
 *
 *   AI_MODE           MOCK | GEMINI   — analysis, placement, moderation
 *   AI_IMAGE_PROVIDER MOCK | GEMINI   — woven concept and drape images
 *
 * Text and vision are free on `gemini-3.8-flash`. Every Gemini *image* model
 * is paid-only, so image generation stays opt-in: a deployment can run real
 * analysis and real moderation for nothing, and turn on paid image generation
 * the day billing is enabled, without a code change.
 *
 * When image generation is left on MOCK, the concept is a locally rendered
 * placeholder. That is surfaced to the customer (see `conceptRenderMode`) —
 * placeholder output is never presented as a real generation.
 */

import { aiKillSwitchEngaged } from "@/config/feature-flags";
import { createGeminiProviders } from "./gemini/provider";
import { isGeminiConfigured, isImageGenerationEnabled } from "./gemini/client";
import { createMockProviderSet, MOCK_PROVIDER_NAME } from "./mock-provider";
import { ProviderError, type ProviderSet } from "./types";

export type AiMode = "MOCK" | "GEMINI";

/**
 * Mock is the default. A deployment only calls a real provider when it has
 * explicitly opted in AND supplied a key, so forgetting to set AI_MODE can
 * never start spending money or leaking customer images to a vendor.
 */
export function aiMode(): AiMode {
  const configured = (process.env.AI_MODE ?? "").trim().toUpperCase();
  // LIVE is accepted as a synonym so an older deployment's env keeps working.
  if ((configured === "GEMINI" || configured === "LIVE") && isGeminiConfigured()) return "GEMINI";
  return "MOCK";
}

export function isMockMode(): boolean {
  return aiMode() === "MOCK";
}

/**
 * How the woven concept image is actually produced. The UI shows this so a
 * customer is never told a placeholder is an AI generation (§2.3, §16.5).
 */
export function conceptRenderMode(): "ai" | "placeholder" {
  return aiMode() === "GEMINI" && isImageGenerationEnabled() ? "ai" : "placeholder";
}

/** Per-call timeout. A hung provider must never hold a worker forever (§15.2). */
export function providerTimeoutMs(): number {
  const configured = Number.parseInt(process.env.AI_PROVIDER_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 120_000;
}

/**
 * Runs a provider call under a timeout, converting anything that escapes into
 * a sanitized ProviderError — the single place a vendor exception can become
 * something we are willing to show or store (§15.2).
 */
export async function callProvider<T>(
  providerName: string,
  operation: string,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  if (aiKillSwitchEngaged()) {
    throw new ProviderError("AI generation is temporarily paused.", {
      retryable: true,
      provider: providerName,
      reason: "KILL_SWITCH",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), providerTimeoutMs());

  try {
    return await run(controller.signal);
  } catch (error) {
    if (error instanceof ProviderError) throw error;

    if (controller.signal.aborted) {
      throw new ProviderError(`${operation} timed out.`, {
        retryable: true,
        provider: providerName,
        reason: "TIMEOUT",
        cause: error,
      });
    }

    // Anything unrecognised is transient, but its message is NOT allowed
    // outward — it may carry a key, a signed URL or customer image data.
    throw new ProviderError(`${operation} failed.`, {
      retryable: true,
      provider: providerName,
      reason: "UNKNOWN",
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
  }
}

let cached: ProviderSet | null = null;

/**
 * The active provider set.
 *
 * In GEMINI mode the image providers come from Gemini only when image
 * generation is enabled; otherwise the mock renderer supplies the placeholder
 * concept while analysis and moderation still run for real.
 */
export function providers(): ProviderSet {
  if (cached) return cached;

  if (aiMode() === "MOCK") {
    cached = createMockProviderSet();
    return cached;
  }

  const gemini = createGeminiProviders();
  const mock = createMockProviderSet();

  cached = {
    analysis: gemini.analysis,
    placement: gemini.placement,
    optimization: gemini.optimization,
    moderation: gemini.moderation,
    concept: isImageGenerationEnabled() ? gemini.concept : mock.concept,
    drape: isImageGenerationEnabled() ? gemini.drape : mock.drape,
  };
  return cached;
}

/** Test seam — drops the memoized set so env changes take effect. */
export function resetProviderCache(): void {
  cached = null;
}

export function activeProviderName(): string {
  return aiMode() === "GEMINI" ? "gemini" : MOCK_PROVIDER_NAME;
}
