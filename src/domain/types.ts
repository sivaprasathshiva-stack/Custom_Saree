/**
 * Core domain entities for the VELVOREA Textile Studio (requirements §29).
 *
 * These are the application's own types, deliberately decoupled from both the
 * database row shapes and any AI provider's response format (§15.1, §29.6,
 * §79). Adapters translate at the boundary; nothing downstream of this file
 * should know which vendor produced a concept.
 */

// --- lifecycle -------------------------------------------------------------

/** Design lifecycle states (§5). Exactly one is current for every design. */
export const DESIGN_STATUSES = [
  "DRAFT",
  "WOVEN_CONCEPT",
  "SUBMITTED",
  "IN_REVIEW",
  "REFINING",
  "SAMPLE",
  "APPROVED",
  "PRODUCTION",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
] as const;

export type DesignStatus = (typeof DESIGN_STATUSES)[number];

/** Roles (§29.2). */
export const USER_ROLES = ["CUSTOMER", "DESIGNER", "ADMIN", "SUPER_ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// --- assets ----------------------------------------------------------------

/** Asset classes stored against a design (§29.5). */
export const ASSET_TYPES = [
  "SAREE_REFERENCE",
  "IDEA_IMAGE",
  "NORMALIZED_SAREE",
  "THUMBNAIL",
  "WOVEN_CONCEPT",
  "DRAPE_FRAME",
  "DRAPE_PREVIEW",
  "OTHER",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export interface DesignAsset {
  id: string;
  designId: string;
  type: AssetType;
  /** Object-storage key. Never the original filename (§30.2). */
  storageKey: string;
  originalFilename: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  checksum: string | null;
  createdAt: string;
  deletedAt: string | null;
}

// --- saree analysis --------------------------------------------------------

/**
 * Normalized output of saree vision analysis (§8.4). Regions are expressed in
 * the same 0..1 space as the composition (§10.1) so they survive any display
 * resolution. The frontend depends on THIS shape, never on provider-native
 * JSON (§29.6).
 */
export interface SareeRegion {
  /** Normalized bounding box, each value 0..1. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Provider confidence for this specific region, 0..1. */
  confidence: number;
}

export interface SareeAnalysisResult {
  /** Whether a saree was recognisably detected at all. */
  sareeDetected: boolean;
  /** The saree's outer boundary within the photograph. */
  boundary: SareeRegion | null;
  body: SareeRegion | null;
  border: SareeRegion | null;
  pallu: SareeRegion | null;
  /** Dominant colours as hex strings, most prominent first. */
  dominantColours: string[];
  /** Free-form motif/pattern descriptors, used for prompt construction. */
  motifs: string[];
  /** 0..1 overall quality score used to drive upload feedback (§8.5). */
  imageQuality: number;
  /** Customer-facing advisory strings. Never raw model output (§8.4). */
  advisories: string[];
  /** Overall analysis confidence, 0..1. */
  confidence: number;
}

export const ANALYSIS_STATUSES = ["PENDING", "RUNNING", "SUCCEEDED", "FAILED"] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

// --- jobs ------------------------------------------------------------------

/** Asynchronous job kinds the worker can process. */
export const JOB_TYPES = [
  "SAREE_ANALYSIS",
  "WOVEN_CONCEPT",
  "DRAPE",
] as const;
export type JobType = (typeof JOB_TYPES)[number];

/** Job lifecycle (§14.4). */
export const JOB_STATUSES = [
  "QUEUED",
  "RUNNING",
  "RETRYING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Named stages surfaced to the processing screen (§14.5). */
export const JOB_STAGES = [
  "VALIDATE_INPUT",
  "PREPARE_ASSETS",
  "ANALYSE_LAYOUT",
  "GENERATE_CONCEPT",
  "POST_PROCESS",
  "STORE_ASSET",
  "CREATE_VERSION",
  "FINALIZE",
] as const;
export type JobStage = (typeof JOB_STAGES)[number];

/**
 * Customer-facing copy for each stage (§14.2). The processing screen shows
 * these, never the enum, and never a fabricated percentage.
 */
export const JOB_STAGE_LABELS: Record<JobStage, string> = {
  VALIDATE_INPUT: "Understanding your saree",
  PREPARE_ASSETS: "Preparing your design",
  ANALYSE_LAYOUT: "Adapting artwork to the textile",
  GENERATE_CONCEPT: "Mapping your colours",
  POST_PROCESS: "Creating the woven surface",
  STORE_ASSET: "Adding silk texture",
  CREATE_VERSION: "Preparing your concept",
  FINALIZE: "Preparing your concept",
};

export interface GenerationJob {
  id: string;
  designId: string;
  jobType: JobType;
  status: JobStatus;
  stage: JobStage | null;
  idempotencyKey: string;
  attemptCount: number;
  provider: string | null;
  model: string | null;
  modelVersion: string | null;
  promptVersion: string | null;
  /** Safe, customer-presentable error message. Never a raw provider error. */
  errorCode: string | null;
  errorMessageSafe: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

/** Terminal job states — no further processing will occur. */
export const TERMINAL_JOB_STATUSES: readonly JobStatus[] = [
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
];

export function isTerminalJobStatus(status: JobStatus): boolean {
  return TERMINAL_JOB_STATUSES.includes(status);
}

// --- concept versions ------------------------------------------------------

/** Version provenance (§17.2). */
export const VERSION_TYPES = [
  "INITIAL",
  "AI_REVISION",
  "CUSTOMER_REVISION",
  "DESIGNER_REVISION",
  "FINAL_CANDIDATE",
  "APPROVED",
] as const;
export type VersionType = (typeof VERSION_TYPES)[number];

export interface ConceptVersion {
  id: string;
  designId: string;
  versionNumber: number;
  versionType: VersionType;
  sourceVersionId: string | null;
  generationJobId: string | null;
  wovenAssetId: string | null;
  thumbnailAssetId: string | null;
  /** Provenance for reproducibility (§64). */
  provider: string | null;
  model: string | null;
  modelVersion: string | null;
  promptVersion: string | null;
  createdAt: string;
}

// --- drape -----------------------------------------------------------------

/** How a drape result is delivered (§19.4). */
export const DRAPE_MODES = ["IMAGE_SEQUENCE", "THREE_D"] as const;
export type DrapeMode = (typeof DRAPE_MODES)[number];

export const DRAPE_STATUSES = ["PENDING", "RUNNING", "SUCCEEDED", "FAILED"] as const;
export type DrapeStatus = (typeof DRAPE_STATUSES)[number];

export interface Drape {
  id: string;
  designId: string;
  conceptVersionId: string;
  style: string;
  status: DrapeStatus;
  mode: DrapeMode;
  createdAt: string;
  completedAt: string | null;
}

// --- design ----------------------------------------------------------------

export interface Design {
  id: string;
  /** Human-readable concept identifier, VL-YYYY-NNNNNN (§21). */
  publicId: string;
  userId: string;
  title: string;
  status: DesignStatus;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  archivedAt: string | null;
}

// --- submission ------------------------------------------------------------

export interface Submission {
  id: string;
  designId: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  requiredByDate: string;
  occasion: string | null;
  quantity: number;
  notes: string | null;
  termsVersion: string;
  termsAcceptedAt: string;
  submittedAt: string;
}
