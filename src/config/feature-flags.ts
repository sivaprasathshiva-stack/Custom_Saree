/**
 * Feature flags (requirements §56).
 *
 * Every high-cost or high-risk capability is switchable so it can be rolled
 * out — or killed — without a deploy of new application logic (§85 Rule 12).
 * Flags default to the safe value: expensive AI surfaces default off unless
 * explicitly enabled, core flow surfaces default on.
 */

function boolFromEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

export const FEATURE_FLAGS = {
  /** AI-assisted placement suggestions on the compose canvas (§11). */
  ENABLE_SMART_ARRANGE: boolFromEnv("ENABLE_SMART_ARRANGE", true),
  /** Weave-feasibility guidance and the "Optimize" action (§12). */
  ENABLE_WEAVE_OPTIMIZATION: boolFromEnv("ENABLE_WEAVE_OPTIMIZATION", true),
  /** "Make it better" refinement suggestions on a woven concept (§18). */
  ENABLE_AI_SUGGESTIONS: boolFromEnv("ENABLE_AI_SUGGESTIONS", true),
  /** The NILA drape experience end to end (§19). */
  ENABLE_NILA_DRAPE: boolFromEnv("ENABLE_NILA_DRAPE", true),
  /** 3D drape mode. Off by default — no 3D asset pipeline exists yet (§19.4). */
  ENABLE_THREE_D_DRAPE: boolFromEnv("ENABLE_THREE_D_DRAPE", false),
  /** Transactional email. Off by default until a provider is configured (§48). */
  ENABLE_EMAIL_NOTIFICATIONS: boolFromEnv("ENABLE_EMAIL_NOTIFICATIONS", false),
  /** Customer download of a concept image. Off by default per §16.2. */
  ENABLE_DOWNLOAD: boolFromEnv("ENABLE_DOWNLOAD", false),
  /** Public share links for a concept. Off by default per §16.2. */
  ENABLE_SHARE: boolFromEnv("ENABLE_SHARE", false),
  /** Designer-side refinement tooling inside the review console (§49.4). */
  ENABLE_ADMIN_REFINEMENT: boolFromEnv("ENABLE_ADMIN_REFINEMENT", false),
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Global kill switch for every paid AI provider call (§65). When set, job
 * processing short-circuits with a clear, retryable failure instead of
 * spending money — used during incidents and cost overruns.
 */
export function aiKillSwitchEngaged(): boolean {
  return boolFromEnv("AI_KILL_SWITCH", false);
}
