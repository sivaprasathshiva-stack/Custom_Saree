/**
 * Human-readable concept identifiers (requirements §21).
 *
 * The database primary key stays a UUID; this is the customer-facing handle
 * printed on the confirmation screen and quoted to support (§78).
 *
 * Format: VL-YYYY-NNNNNN — e.g. VL-2026-000123. The sequence restarts each
 * calendar year, which is why allocation is a database concern (see the
 * `allocate_concept_sequence` function in supabase/schema.sql): two customers
 * submitting at the same instant must never receive the same number, and only
 * the database can guarantee that.
 */

export const CONCEPT_ID_PREFIX = "VL";
const SEQUENCE_DIGITS = 6;
const CONCEPT_ID_PATTERN = /^VL-(\d{4})-(\d{6})$/;

export const MAX_CONCEPT_SEQUENCE = 10 ** SEQUENCE_DIGITS - 1;

export class ConceptSequenceExhaustedError extends Error {
  readonly code = "CONCEPT_SEQUENCE_EXHAUSTED";
  constructor(year: number) {
    super(`Concept sequence for ${year} is exhausted.`);
    this.name = "ConceptSequenceExhaustedError";
  }
}

/**
 * Formats an allocated sequence number into a concept id.
 * Pure — the caller supplies the year and the number the database allocated.
 */
export function formatConceptId(year: number, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new TypeError("Concept sequence must be a positive integer.");
  }
  if (sequence > MAX_CONCEPT_SEQUENCE) {
    throw new ConceptSequenceExhaustedError(year);
  }
  return `${CONCEPT_ID_PREFIX}-${year}-${String(sequence).padStart(SEQUENCE_DIGITS, "0")}`;
}

export interface ParsedConceptId {
  year: number;
  sequence: number;
}

/** Parses a concept id, returning null if it is not well-formed. */
export function parseConceptId(value: string): ParsedConceptId | null {
  const match = CONCEPT_ID_PATTERN.exec(value.trim().toUpperCase());
  if (!match) return null;
  return { year: Number(match[1]), sequence: Number(match[2]) };
}

export function isConceptId(value: string): boolean {
  return parseConceptId(value) !== null;
}

/**
 * Idempotency keys for generation requests (§14.6).
 *
 * A duplicate click must not create a second paid job. The key is derived from
 * what actually determines the output — the design and the exact composition
 * being generated from — so pressing the button twice without changing
 * anything reuses the in-flight job, while a genuine edit produces a new one.
 */
export function generationIdempotencyKey(designId: string, compositionHash: string): string {
  return `gen:${designId}:${compositionHash}`;
}

/**
 * Stable, order-independent hash of a composition, used for the key above.
 * Not cryptographic — it only needs to change when the composition changes.
 */
export function hashComposition(value: unknown): string {
  const serialized = stableStringify(value);
  // FNV-1a, 32-bit. Deterministic across runs and platforms.
  let hash = 0x811c9dc5;
  for (let i = 0; i < serialized.length; i += 1) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(",")}}`;
}
