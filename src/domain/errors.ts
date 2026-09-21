/**
 * Domain error codes and the error type carried across the API boundary
 * (requirements §27, §37).
 *
 * Two rules drive this file:
 *  - a customer sees a human-readable message and an actionable next step,
 *    never a stack trace or a provider's raw error (§27, §37);
 *  - every error carries a stable machine code the frontend can branch on and
 *    support can search for (§78).
 */

export const ERROR_CODES = [
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "DESIGN_NOT_FOUND",
  "ASSET_NOT_FOUND",
  "VERSION_NOT_FOUND",
  "JOB_NOT_FOUND",
  "DRAPE_NOT_FOUND",
  "SUBMISSION_NOT_FOUND",
  "DESIGN_NOT_EDITABLE",
  "INVALID_STATE_TRANSITION",
  "TOO_MANY_SAREE_IMAGES",
  "TOO_FEW_SAREE_IMAGES",
  "TOO_MANY_IDEA_IMAGES",
  "UNSUPPORTED_MEDIA_TYPE",
  "FILE_TOO_LARGE",
  "IMAGE_DIMENSIONS_INVALID",
  "COMPOSITION_INVALID",
  "COMPOSITION_EMPTY",
  "ANALYSIS_NOT_READY",
  "CONCEPT_NOT_READY",
  "DESIGN_LIMIT_REACHED",
  "GENERATION_LIMIT_REACHED",
  "GENERATION_IN_PROGRESS",
  "ALREADY_SUBMITTED",
  "TERMS_NOT_ACCEPTED",
  "RATE_LIMITED",
  "CONTENT_REJECTED",
  "FEATURE_DISABLED",
  "AI_UNAVAILABLE",
  "AI_OUTPUT_INVALID",
  "STORAGE_UNAVAILABLE",
  "CONFLICT",
  "INTERNAL_ERROR",
  "NOT_CONFIGURED",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Default HTTP status for each code. */
const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  DESIGN_NOT_FOUND: 404,
  ASSET_NOT_FOUND: 404,
  VERSION_NOT_FOUND: 404,
  JOB_NOT_FOUND: 404,
  DRAPE_NOT_FOUND: 404,
  SUBMISSION_NOT_FOUND: 404,
  DESIGN_NOT_EDITABLE: 409,
  INVALID_STATE_TRANSITION: 409,
  TOO_MANY_SAREE_IMAGES: 422,
  TOO_FEW_SAREE_IMAGES: 422,
  TOO_MANY_IDEA_IMAGES: 422,
  UNSUPPORTED_MEDIA_TYPE: 415,
  FILE_TOO_LARGE: 413,
  IMAGE_DIMENSIONS_INVALID: 422,
  COMPOSITION_INVALID: 422,
  COMPOSITION_EMPTY: 422,
  ANALYSIS_NOT_READY: 409,
  CONCEPT_NOT_READY: 409,
  DESIGN_LIMIT_REACHED: 409,
  GENERATION_LIMIT_REACHED: 429,
  GENERATION_IN_PROGRESS: 409,
  ALREADY_SUBMITTED: 409,
  TERMS_NOT_ACCEPTED: 422,
  RATE_LIMITED: 429,
  CONTENT_REJECTED: 422,
  FEATURE_DISABLED: 403,
  AI_UNAVAILABLE: 503,
  AI_OUTPUT_INVALID: 502,
  STORAGE_UNAVAILABLE: 503,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  NOT_CONFIGURED: 501,
};

/**
 * Customer-facing copy. Each one states what happened and what to do next
 * (§37), and none of them blame the customer or expose internals.
 */
const MESSAGE_BY_CODE: Record<ErrorCode, string> = {
  VALIDATION_FAILED: "Some details need fixing before we can continue.",
  UNAUTHENTICATED: "Please sign in to continue.",
  FORBIDDEN: "You don't have access to this.",
  DESIGN_NOT_FOUND: "We couldn't find that design.",
  ASSET_NOT_FOUND: "We couldn't find that image.",
  VERSION_NOT_FOUND: "We couldn't find that concept version.",
  JOB_NOT_FOUND: "We couldn't find that job.",
  DRAPE_NOT_FOUND: "We couldn't find that drape.",
  SUBMISSION_NOT_FOUND: "We couldn't find that submission.",
  DESIGN_NOT_EDITABLE: "This design has been sent to VELVOREA and can no longer be edited.",
  INVALID_STATE_TRANSITION: "That change isn't available for this design right now.",
  TOO_MANY_SAREE_IMAGES: "You've added the maximum number of saree photos.",
  TOO_FEW_SAREE_IMAGES: "Add at least one photo of your saree to continue.",
  TOO_MANY_IDEA_IMAGES: "You can add one image to your saree.",
  UNSUPPORTED_MEDIA_TYPE: "That file type isn't supported. Please use a JPG, PNG or WebP.",
  FILE_TOO_LARGE: "That image is too large. Please use a smaller file.",
  IMAGE_DIMENSIONS_INVALID: "That image is too small to work with. Please use a larger photo.",
  COMPOSITION_INVALID: "Something about this design couldn't be saved. Your work is safe.",
  COMPOSITION_EMPTY: "Add an image or some words before creating your woven concept.",
  ANALYSIS_NOT_READY: "We're still reading your saree. This takes just a moment.",
  CONCEPT_NOT_READY: "Your woven concept isn't ready yet.",
  DESIGN_LIMIT_REACHED:
    "You've reached the maximum number of saved designs. Delete one to start another.",
  GENERATION_LIMIT_REACHED: "You've reached the concept limit for this design.",
  GENERATION_IN_PROGRESS: "We're already creating a concept for this design.",
  ALREADY_SUBMITTED: "This design has already been sent to VELVOREA.",
  TERMS_NOT_ACCEPTED: "Please confirm you understand this is a digital concept.",
  RATE_LIMITED: "That's a lot of requests at once. Please wait a moment and try again.",
  // §36: never reveal moderation internals — no category, no model rationale.
  CONTENT_REJECTED: "This image cannot be used in the studio.",
  FEATURE_DISABLED: "That feature isn't available right now.",
  AI_UNAVAILABLE: "We couldn't create your woven concept this time. Your design is safe. Please try again.",
  AI_OUTPUT_INVALID: "We couldn't create your woven concept this time. Your design is safe. Please try again.",
  STORAGE_UNAVAILABLE: "We couldn't save that image just now. Please try again.",
  CONFLICT: "This design changed somewhere else. Reload to see the latest.",
  INTERNAL_ERROR: "Something went wrong on our side. Your design is safe.",
  NOT_CONFIGURED: "The studio isn't available in this environment.",
};

export interface DomainErrorOptions {
  /** Field-level detail, safe to show the customer. */
  details?: Record<string, unknown>;
  /** Overrides the default customer-facing message. */
  message?: string;
  /** Whether the customer can usefully retry the same action (§37). */
  retryable?: boolean;
  /** The underlying error, logged server-side but never serialized out. */
  cause?: unknown;
}

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;
  readonly retryable: boolean;

  constructor(code: ErrorCode, options: DomainErrorOptions = {}) {
    super(options.message ?? MESSAGE_BY_CODE[code]);
    this.name = "DomainError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = options.details;
    this.retryable = options.retryable ?? DEFAULT_RETRYABLE.has(code);
    if (options.cause !== undefined) this.cause = options.cause;
  }
}

/** Codes where offering "Try Again" is honest rather than a dead end. */
const DEFAULT_RETRYABLE = new Set<ErrorCode>([
  "AI_UNAVAILABLE",
  "AI_OUTPUT_INVALID",
  "STORAGE_UNAVAILABLE",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
]);

export function errorStatus(code: ErrorCode): number {
  return STATUS_BY_CODE[code];
}

export function errorMessage(code: ErrorCode): string {
  return MESSAGE_BY_CODE[code];
}

export function isDomainError(value: unknown): value is DomainError {
  return value instanceof DomainError;
}
