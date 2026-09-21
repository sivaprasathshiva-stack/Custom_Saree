/**
 * Provider selection and the safety wrapper every provider call passes through
 * (requirements §15, §57, §65, §71).
 *
 * The rest of the application asks for `providers()` and gets an interface.
 * Which implementation it receives — mock or a real vendor — is an environment
 * decision made here and nowhere else.
 */

import { aiKillSwitchEngaged } from "@/config/feature-flags";
import { createMockProviderSet, MOCK_PROVIDER_NAME } from "./mock-provider";
import { ProviderError, type ProviderSet } from "./types";

export type AiMode = "MOCK" | "LIVE";

/**
 * Mock is the default. A deployment only makes paid calls when it has
 * explicitly opted in AND supplied a key — forgetting to set AI_MODE can never
 * silently start spending money.
 */
export function aiMode(): AiMode {
  const configured = (process.env.AI_MODE ?? "").trim().toUpperCase();
  if (configured === "LIVE") return "LIVE";
  return "MOCK";
}

export function isMockMode(): boolean {
  return aiMode() === "MOCK";
}

/** Per-call timeout. A hung provider must never hold a worker forever (§15.2). */
export function providerTimeoutMs(): number {
  const configured = Number.parseInt(process.env.AI_PROVIDER_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 120_000;
}

/**
 * Runs a provider call under a timeout, converting anything that escapes into
 * a sanitized ProviderError. This is the single place a vendor exception can
 * turn into something the application is willing to show or store (§15.2).
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

    // Anything unrecognised is treated as transient but is NOT allowed to
    // carry the original message outward — that message may contain a key,
    // a signed URL or a customer's image data.
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
 * LIVE mode currently has no vendor adapter wired up. Rather than silently
 * falling back to mock output and presenting it to a customer as a real
 * generation, this throws — an unconfigured production deployment must fail
 * loudly, not quietly serve placeholders.
 */
export function providers(): ProviderSet {
  if (cached) return cached;

  if (aiMode() === "LIVE") {
    throw new ProviderError(
      "AI_MODE=LIVE but no provider adapter is configured. Implement an adapter in src/lib/ai/ and register it here.",
      { retryable: false, provider: "none", reason: "NOT_CONFIGURED" },
    );
  }

  cached = createMockProviderSet();
  return cached;
}

/** Test seam — drops the memoized set so env changes take effect. */
export function resetProviderCache(): void {
  cached = null;
}

export function activeProviderName(): string {
  return aiMode() === "LIVE" ? "unconfigured" : MOCK_PROVIDER_NAME;
}
