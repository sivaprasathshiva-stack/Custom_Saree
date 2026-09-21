/**
 * Configurable business limits (requirements §57).
 *
 * Nothing in the studio may hard-code these numbers inline — §85 Rule 3.
 * Every value reads an environment override so staging/production can be
 * tuned without a code change, and falls back to the documented default.
 */

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function listFromEnv(name: string, fallback: readonly string[]): readonly string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : fallback;
}

/** Saree reference photographs per design (§8.1). */
export const MIN_SAREE_IMAGES = intFromEnv("STUDIO_MIN_SAREE_IMAGES", 1);
export const MAX_SAREE_IMAGES = intFromEnv("STUDIO_MAX_SAREE_IMAGES", 3);

/** The customer's own idea artwork (§9.1). */
export const MAX_IDEA_IMAGES = intFromEnv("STUDIO_MAX_IDEA_IMAGES", 1);

/** Customer text placed on the saree (§9.2). */
export const MAX_TEXT_LENGTH = intFromEnv("STUDIO_MAX_TEXT_LENGTH", 99);

/** Upload constraints, validated client-side AND server-side (§8.2). */
export const MAX_UPLOAD_SIZE_MB = intFromEnv("STUDIO_MAX_UPLOAD_SIZE_MB", 12);
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
export const MAX_TOTAL_UPLOAD_SIZE_BYTES =
  MAX_UPLOAD_SIZE_BYTES * (MAX_SAREE_IMAGES + MAX_IDEA_IMAGES);
export const MIN_IMAGE_DIMENSION = intFromEnv("STUDIO_MIN_IMAGE_DIMENSION", 320);
export const MAX_IMAGE_DIMENSION = intFromEnv("STUDIO_MAX_IMAGE_DIMENSION", 8000);

/**
 * Formats the processing pipeline can actually decode. HEIC is deliberately
 * absent: §8.1 says accept it only if the pipeline supports it, and ours does
 * not, so it is rejected with a useful message rather than silently failing.
 */
export const SUPPORTED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type SupportedUploadMimeType = (typeof SUPPORTED_UPLOAD_MIME_TYPES)[number];

/** Generation retry/attempt ceiling (§32.2, §65). */
export const MAX_GENERATION_ATTEMPTS = intFromEnv("STUDIO_MAX_GENERATION_ATTEMPTS", 3);

/** Per-design and per-user cost ceilings (§65). */
export const MAX_CONCEPTS_PER_DESIGN = intFromEnv("STUDIO_MAX_CONCEPTS_PER_DESIGN", 20);
export const MAX_GENERATIONS_PER_USER_PER_DAY = intFromEnv(
  "STUDIO_MAX_GENERATIONS_PER_USER_PER_DAY",
  40,
);

/** Undo/redo depth (§10.4). */
export const MIN_HISTORY_DEPTH = intFromEnv("STUDIO_HISTORY_DEPTH", 50);

/** Autosave debounce in milliseconds (§46.1). */
export const AUTOSAVE_DEBOUNCE_MS = intFromEnv("STUDIO_AUTOSAVE_DEBOUNCE_MS", 1500);

/** Submission form options (§20.2). */
export const SUPPORTED_OCCASIONS = listFromEnv("STUDIO_SUPPORTED_OCCASIONS", [
  "Wedding",
  "Gift",
  "Personal",
  "Other",
]);

export const MAX_SUBMISSION_QUANTITY = intFromEnv("STUDIO_MAX_SUBMISSION_QUANTITY", 25);

/** Drape presets (§19.3) — configuration-driven, never hard-coded in the UI. */
export const SUPPORTED_DRAPE_STYLES = listFromEnv("STUDIO_SUPPORTED_DRAPE_STYLES", [
  "Classic",
  "Contemporary",
  "Bridal",
  "Statement Pallu",
]);

/** Retention (§35) — business policy, never baked into application logic. */
export const DRAFT_RETENTION_DAYS = intFromEnv("STUDIO_DRAFT_RETENTION_DAYS", 90);

/** Signed URL lifetime for private assets (§30.1). */
export const SIGNED_URL_TTL_SECONDS = intFromEnv("STUDIO_SIGNED_URL_TTL_SECONDS", 300);

/** Rate limits, expressed as {limit} requests per {windowSeconds} (§34.6). */
export const RATE_LIMITS = {
  upload: { limit: intFromEnv("RATE_LIMIT_UPLOAD", 30), windowSeconds: 60 },
  generation: { limit: intFromEnv("RATE_LIMIT_GENERATION", 10), windowSeconds: 60 },
  smartArrange: { limit: intFromEnv("RATE_LIMIT_SMART_ARRANGE", 20), windowSeconds: 60 },
  optimize: { limit: intFromEnv("RATE_LIMIT_OPTIMIZE", 20), windowSeconds: 60 },
  drape: { limit: intFromEnv("RATE_LIMIT_DRAPE", 10), windowSeconds: 60 },
  submission: { limit: intFromEnv("RATE_LIMIT_SUBMISSION", 5), windowSeconds: 300 },
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;

/** Current terms version recorded against each submission (§20.4). */
export const TERMS_VERSION = process.env.STUDIO_TERMS_VERSION ?? "2026-09-01";
