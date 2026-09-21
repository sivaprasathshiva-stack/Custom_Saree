/**
 * Durable job queue (requirements §14.3, §32).
 *
 * The queue is a Postgres table, not an in-process array. That choice is what
 * gives us the capabilities §32.1 requires — retries, backoff, visibility
 * timeouts, dead-lettering and crash recovery — on a serverless platform where
 * no process lives long enough to own an in-memory queue.
 *
 * Claiming is done by `claim_generation_job` in schema.sql, which uses
 * `FOR UPDATE SKIP LOCKED` so concurrent workers never process the same job
 * twice and never bill twice for the same generation.
 */

import { MAX_GENERATION_ATTEMPTS } from "@/config/limits";
import { DomainError } from "@/domain/errors";
import type { JobStage, JobStatus, JobType } from "@/domain/types";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";

export interface JobRow {
  id: string;
  design_id: string;
  user_id: string;
  job_type: JobType;
  status: JobStatus;
  stage: JobStage | null;
  idempotency_key: string;
  attempt_count: number;
  composition_id: string | null;
  source_version_id: string | null;
  input_snapshot_json: Record<string, unknown> | null;
  // Provenance written by recordJobProvider once a provider has responded (§64).
  provider: string | null;
  model: string | null;
  model_version: string | null;
  prompt_version: string | null;
  error_code: string | null;
  error_message_safe: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

function admin() {
  if (!isAdminConfigured()) {
    throw new DomainError("NOT_CONFIGURED", { message: "Job processing is not configured." });
  }
  return createAdminClient();
}

export interface EnqueueParams {
  designId: string;
  userId: string;
  jobType: JobType;
  idempotencyKey: string;
  compositionId?: string | null;
  sourceVersionId?: string | null;
  input?: Record<string, unknown>;
}

/**
 * Enqueues a job, or returns the existing one for the same idempotency key.
 *
 * §14.6: a duplicate click must not create a duplicate job. The uniqueness is
 * enforced by a database constraint on (design_id, idempotency_key), so two
 * simultaneous requests race the constraint rather than a read-then-write
 * check that both would pass.
 */
export async function enqueueJob(params: EnqueueParams): Promise<{ job: JobRow; created: boolean }> {
  const supabase = admin();

  const { data, error } = await supabase
    .from("generation_jobs")
    .insert({
      design_id: params.designId,
      user_id: params.userId,
      job_type: params.jobType,
      idempotency_key: params.idempotencyKey,
      composition_id: params.compositionId ?? null,
      source_version_id: params.sourceVersionId ?? null,
      input_snapshot_json: params.input ?? null,
      status: "QUEUED",
    })
    .select("*")
    .single<JobRow>();

  if (!error && data) return { job: data, created: true };

  // 23505 = unique_violation: the job already exists, which is the correct
  // outcome of a duplicate request, not an error to surface.
  if (error?.code === "23505") {
    const existing = await findJobByIdempotencyKey(params.designId, params.idempotencyKey);
    if (existing) return { job: existing, created: false };
  }

  logger.error("Job enqueue failed", { designId: params.designId, error });
  throw new DomainError("INTERNAL_ERROR", { cause: error });
}

export async function findJobByIdempotencyKey(
  designId: string,
  idempotencyKey: string,
): Promise<JobRow | null> {
  const { data } = await admin()
    .from("generation_jobs")
    .select("*")
    .eq("design_id", designId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle<JobRow>();
  return data ?? null;
}

export async function getJob(jobId: string): Promise<JobRow | null> {
  const { data } = await admin().from("generation_jobs").select("*").eq("id", jobId).maybeSingle<JobRow>();
  return data ?? null;
}

/** Whether this design already has generation work in flight (§55). */
export async function hasActiveJob(designId: string, jobType: JobType): Promise<boolean> {
  const { data } = await admin()
    .from("generation_jobs")
    .select("id")
    .eq("design_id", designId)
    .eq("job_type", jobType)
    .in("status", ["QUEUED", "RUNNING", "RETRYING"])
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/** Atomically takes the next job. Returns null when the queue is empty. */
export async function claimNextJob(workerId: string, leaseSeconds = 300): Promise<JobRow | null> {
  const { data, error } = await admin()
    .rpc("claim_generation_job", { p_worker_id: workerId, p_lease_seconds: leaseSeconds })
    .maybeSingle<JobRow>();

  if (error) {
    logger.error("Job claim failed", { error });
    return null;
  }

  // A plpgsql function returning NULL for a composite type comes back through
  // PostgREST as an object with every field null, not as null. Checking `data`
  // alone would hand the worker a phantom job with a null id.
  if (!data?.id) return null;

  return data;
}

/**
 * Publishes progress. The processing screen shows named stages rather than a
 * percentage, because a percentage the backend cannot actually compute is a
 * lie (§14.2).
 */
export async function setJobStage(jobId: string, stage: JobStage): Promise<void> {
  const { error } = await admin().from("generation_jobs").update({ stage }).eq("id", jobId);
  if (error) logger.warn("Stage update failed", { jobId, error });
}

export async function recordJobProvider(
  jobId: string,
  provider: { provider: string; model: string; modelVersion: string; promptVersion: string },
): Promise<void> {
  await admin()
    .from("generation_jobs")
    .update({
      provider: provider.provider,
      model: provider.model,
      model_version: provider.modelVersion,
      prompt_version: provider.promptVersion,
    })
    .eq("id", jobId);
}

/** Backoff schedule for retry (§32.2). */
export function retryDelayMs(attempt: number): number {
  const base = [0, 2_000, 10_000, 30_000];
  return base[Math.min(attempt, base.length - 1)];
}

/**
 * Records a failure.
 *
 * A permanent failure (bad input, unsupported file) is never retried — §32.2
 * is explicit about that, and retrying it would just spend money to fail
 * identically. A transient one goes back to RETRYING until the attempt ceiling,
 * then dead-letters as FAILED with a message the customer can act on.
 */
export async function failJob(params: {
  jobId: string;
  attemptCount: number;
  retryable: boolean;
  errorCode: string;
  safeMessage: string;
}): Promise<{ willRetry: boolean }> {
  const willRetry = params.retryable && params.attemptCount < MAX_GENERATION_ATTEMPTS;

  const { error } = await admin()
    .from("generation_jobs")
    .update({
      status: willRetry ? "RETRYING" : "FAILED",
      error_code: params.errorCode,
      error_message_safe: params.safeMessage,
      locked_at: null,
      locked_by: null,
      ...(willRetry ? {} : { completed_at: new Date().toISOString() }),
    })
    .eq("id", params.jobId);

  if (error) logger.error("Job failure write failed", { jobId: params.jobId, error });

  logger.warn("Job failed", {
    jobId: params.jobId,
    errorCode: params.errorCode,
    attempt: params.attemptCount,
    willRetry,
  });

  return { willRetry };
}

export async function cancelJob(jobId: string): Promise<void> {
  await admin()
    .from("generation_jobs")
    .update({ status: "CANCELLED", completed_at: new Date().toISOString(), locked_at: null, locked_by: null })
    .eq("id", jobId)
    .in("status", ["QUEUED", "RETRYING", "RUNNING"]);
}

/** Puts a dead-lettered job back in the queue — the admin "retry" action (§49.4). */
export async function requeueJob(jobId: string): Promise<void> {
  const { error } = await admin()
    .from("generation_jobs")
    .update({
      status: "QUEUED",
      error_code: null,
      error_message_safe: null,
      completed_at: null,
      locked_at: null,
      locked_by: null,
      // The attempt counter resets so an operator-triggered retry gets a full
      // budget rather than immediately dead-lettering again.
      attempt_count: 0,
    })
    .eq("id", jobId)
    .in("status", ["FAILED", "CANCELLED"]);

  if (error) throw new DomainError("INTERNAL_ERROR", { cause: error });
}

export async function markJobSucceeded(jobId: string, output?: Record<string, unknown>): Promise<void> {
  await admin()
    .from("generation_jobs")
    .update({
      status: "SUCCEEDED",
      stage: "FINALIZE",
      completed_at: new Date().toISOString(),
      output_json: output ?? null,
      locked_at: null,
      locked_by: null,
    })
    .eq("id", jobId);
}
