/**
 * Admin review console data + actions (requirements §49, §50).
 *
 * Every state change here goes through the §5 state machine and leaves an
 * audit trail. The console never writes a status directly — that is the whole
 * point of having a machine rather than a dropdown wired to an UPDATE.
 */

import { allowedTransitions, assertTransition } from "@/domain/design-state";
import { DomainError } from "@/domain/errors";
import type { DesignStatus } from "@/domain/types";
import { recordAudit, recordStatusChange } from "@/lib/audit/audit-log";
import { requeueJob } from "@/lib/jobs/queue";
import { signedUrlsFor } from "@/lib/storage/design-assets";
import { createAdminClient } from "@/lib/supabase/admin";

function admin() {
  return createAdminClient();
}

// --- queue -----------------------------------------------------------------

export interface QueueRow {
  designId: string;
  conceptId: string | null;
  name: string;
  status: DesignStatus;
  customerName: string | null;
  customerEmail: string | null;
  requiredBy: string | null;
  occasion: string | null;
  quantity: number | null;
  submittedAt: string | null;
  updatedAt: string;
}

interface DesignQueueRecord {
  id: string;
  public_id: string | null;
  name: string;
  status: DesignStatus;
  submitted_at: string | null;
  updated_at: string;
  submissions: Array<{
    full_name: string;
    email: string;
    required_by_date: string;
    occasion: string | null;
    quantity: number | null;
  }> | null;
}

/** Designs that have reached VELVOREA. Drafts are the customer's business. */
export async function loadQueue(filter?: DesignStatus): Promise<QueueRow[]> {
  let query = admin()
    .from("designs")
    .select(
      "id, public_id, name, status, submitted_at, updated_at, submissions(full_name, email, required_by_date, occasion, quantity)",
    )
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(200);

  if (filter) query = query.eq("status", filter);

  const { data, error } = await query.returns<DesignQueueRecord[]>();
  if (error) throw new DomainError("INTERNAL_ERROR", { cause: error });

  return (data ?? []).map((row) => {
    const submission = row.submissions?.[0] ?? null;
    return {
      designId: row.id,
      conceptId: row.public_id,
      name: row.name,
      status: row.status,
      customerName: submission?.full_name ?? null,
      customerEmail: submission?.email ?? null,
      requiredBy: submission?.required_by_date ?? null,
      occasion: submission?.occasion ?? null,
      quantity: submission?.quantity ?? null,
      submittedAt: row.submitted_at,
      updatedAt: row.updated_at,
    };
  });
}

/** Counts per status, for the dashboard (§49.1). */
export async function loadDashboardCounts(): Promise<Record<string, number>> {
  const { data, error } = await admin()
    .from("designs")
    .select("status")
    .not("submitted_at", "is", null)
    .returns<Array<{ status: string }>>();

  if (error) throw new DomainError("INTERNAL_ERROR", { cause: error });

  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.status] = (counts[row.status] ?? 0) + 1;

  const { data: failedJobs } = await admin()
    .from("generation_jobs")
    .select("id")
    .eq("status", "FAILED")
    .limit(500);
  counts.FAILED_JOBS = failedJobs?.length ?? 0;

  return counts;
}

// --- design detail ---------------------------------------------------------

export interface AdminVersion {
  id: string;
  versionNumber: number;
  versionType: string;
  label: string | null;
  createdAt: string;
  provider: string | null;
  model: string | null;
  promptVersion: string | null;
  imageUrl: string | null;
}

export interface AdminJob {
  id: string;
  jobType: string;
  status: string;
  stage: string | null;
  attemptCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface AdminNote {
  id: string;
  note: string;
  authorUserId: string;
  createdAt: string;
}

export interface AdminDesignDetail {
  designId: string;
  conceptId: string | null;
  name: string;
  status: DesignStatus;
  allowedTransitions: DesignStatus[];
  submittedAt: string | null;
  submission: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    requiredBy: string;
    occasion: string | null;
    quantity: number | null;
    comments: string | null;
    termsVersion: string | null;
    termsAcceptedAt: string | null;
  } | null;
  referenceUrls: string[];
  versions: AdminVersion[];
  jobs: AdminJob[];
  notes: AdminNote[];
  timeline: Array<{ fromStatus: string | null; toStatus: string; reason: string | null; createdAt: string }>;
}

export async function loadDesignDetail(designId: string): Promise<AdminDesignDetail | null> {
  const supabase = admin();

  const { data: design } = await supabase
    .from("designs")
    .select("id, public_id, name, status, submitted_at")
    .eq("id", designId)
    .maybeSingle<{
      id: string;
      public_id: string | null;
      name: string;
      status: DesignStatus;
      submitted_at: string | null;
    }>();

  if (!design) return null;

  const [submissionResult, assetsResult, versionsResult, jobsResult, notesResult, timelineResult] =
    await Promise.all([
      supabase.from("submissions").select("*").eq("design_id", designId).maybeSingle(),
      supabase
        .from("design_assets")
        .select("id, type, storage_key")
        .eq("design_id", designId)
        .is("deleted_at", null)
        .returns<Array<{ id: string; type: string; storage_key: string }>>(),
      supabase
        .from("concept_versions")
        .select("id, version_number, version_type, label, created_at, provider, model, prompt_version, woven_asset_id")
        .eq("design_id", designId)
        .order("version_number", { ascending: false })
        .returns<Array<Record<string, string | number | null>>>(),
      supabase
        .from("generation_jobs")
        .select("id, job_type, status, stage, attempt_count, error_code, error_message_safe, created_at")
        .eq("design_id", designId)
        .order("created_at", { ascending: false })
        .limit(50)
        .returns<Array<Record<string, string | number | null>>>(),
      supabase
        .from("internal_notes")
        .select("id, note, author_user_id, created_at")
        .eq("design_id", designId)
        .order("created_at", { ascending: false })
        .returns<Array<{ id: string; note: string; author_user_id: string; created_at: string }>>(),
      supabase
        .from("design_status_history")
        .select("from_status, to_status, reason, created_at")
        .eq("design_id", designId)
        .order("created_at", { ascending: false })
        .returns<Array<{ from_status: string | null; to_status: string; reason: string | null; created_at: string }>>(),
    ]);

  const assets = assetsResult.data ?? [];
  const urls = await signedUrlsFor(assets.map((asset) => asset.storage_key));
  const assetUrlById = new Map(assets.map((asset) => [asset.id, urls.get(asset.storage_key) ?? null]));

  const submission = submissionResult.data as Record<string, string | number | null> | null;

  return {
    designId: design.id,
    conceptId: design.public_id,
    name: design.name,
    status: design.status,
    allowedTransitions: allowedTransitions(design.status, "ADMIN"),
    submittedAt: design.submitted_at,
    submission: submission
      ? {
          fullName: String(submission.full_name ?? ""),
          email: String(submission.email ?? ""),
          phone: String(submission.phone ?? ""),
          address: [
            submission.address_line1,
            submission.address_line2,
            submission.city,
            submission.state,
            submission.postal_code,
            submission.country,
          ]
            .filter(Boolean)
            .join(", "),
          requiredBy: String(submission.required_by_date ?? ""),
          occasion: submission.occasion ? String(submission.occasion) : null,
          quantity: submission.quantity ? Number(submission.quantity) : null,
          comments: submission.comments ? String(submission.comments) : null,
          termsVersion: submission.terms_version ? String(submission.terms_version) : null,
          termsAcceptedAt: submission.terms_accepted_at ? String(submission.terms_accepted_at) : null,
        }
      : null,
    referenceUrls: assets
      .filter((asset) => asset.type === "SAREE_REFERENCE" || asset.type === "IDEA_IMAGE")
      .map((asset) => assetUrlById.get(asset.id))
      .filter((url): url is string => Boolean(url)),
    versions: (versionsResult.data ?? []).map((row) => ({
      id: String(row.id),
      versionNumber: Number(row.version_number),
      versionType: String(row.version_type),
      label: row.label ? String(row.label) : null,
      createdAt: String(row.created_at),
      provider: row.provider ? String(row.provider) : null,
      model: row.model ? String(row.model) : null,
      promptVersion: row.prompt_version ? String(row.prompt_version) : null,
      imageUrl: row.woven_asset_id ? assetUrlById.get(String(row.woven_asset_id)) ?? null : null,
    })),
    jobs: (jobsResult.data ?? []).map((row) => ({
      id: String(row.id),
      jobType: String(row.job_type),
      status: String(row.status),
      stage: row.stage ? String(row.stage) : null,
      attemptCount: Number(row.attempt_count ?? 0),
      errorCode: row.error_code ? String(row.error_code) : null,
      errorMessage: row.error_message_safe ? String(row.error_message_safe) : null,
      createdAt: String(row.created_at),
    })),
    notes: (notesResult.data ?? []).map((row) => ({
      id: row.id,
      note: row.note,
      authorUserId: row.author_user_id,
      createdAt: row.created_at,
    })),
    timeline: (timelineResult.data ?? []).map((row) => ({
      fromStatus: row.from_status,
      toStatus: row.to_status,
      reason: row.reason,
      createdAt: row.created_at,
    })),
  };
}

// --- actions ---------------------------------------------------------------

/** Moves a design through the pipeline, via the state machine (§5.2). */
export async function changeDesignStatus(params: {
  designId: string;
  toStatus: DesignStatus;
  actorUserId: string;
  reason?: string;
}): Promise<void> {
  const { data: design } = await admin()
    .from("designs")
    .select("status")
    .eq("id", params.designId)
    .maybeSingle<{ status: DesignStatus }>();

  if (!design) throw new DomainError("DESIGN_NOT_FOUND");

  // Throws InvalidTransitionError if this move isn't legal for an admin.
  assertTransition(design.status, params.toStatus, "ADMIN");

  const { error } = await admin()
    .from("designs")
    .update({ status: params.toStatus, updated_at: new Date().toISOString() })
    .eq("id", params.designId)
    // Optimistic guard: refuse if someone else moved it since we read it.
    .eq("status", design.status);

  if (error) throw new DomainError("INTERNAL_ERROR", { cause: error });

  await recordStatusChange({
    designId: params.designId,
    fromStatus: design.status,
    toStatus: params.toStatus,
    actorUserId: params.actorUserId,
    reason: params.reason,
  });
}

export async function addInternalNote(params: {
  designId: string;
  authorUserId: string;
  note: string;
}): Promise<void> {
  const trimmed = params.note.trim();
  if (trimmed.length === 0) {
    throw new DomainError("VALIDATION_FAILED", { message: "A note can't be empty." });
  }

  const { error } = await admin().from("internal_notes").insert({
    design_id: params.designId,
    author_user_id: params.authorUserId,
    note: trimmed,
    visibility: "INTERNAL",
  });

  if (error) throw new DomainError("INTERNAL_ERROR", { cause: error });

  await recordAudit({
    action: "INTERNAL_NOTE_CREATED",
    entityType: "design",
    entityId: params.designId,
    actorUserId: params.authorUserId,
  });
}

export async function retryFailedJob(params: {
  jobId: string;
  actorUserId: string;
}): Promise<void> {
  await requeueJob(params.jobId);
  await recordAudit({
    action: "GENERATION_STARTED",
    entityType: "job",
    entityId: params.jobId,
    actorUserId: params.actorUserId,
    metadata: { source: "admin_retry" },
  });
}

/** Records that a staff member opened a customer's design (§50). */
export async function recordAdminView(designId: string, actorUserId: string): Promise<void> {
  await recordAudit({
    action: "ADMIN_VIEWED_DESIGN",
    entityType: "design",
    entityId: designId,
    actorUserId,
  });
}
