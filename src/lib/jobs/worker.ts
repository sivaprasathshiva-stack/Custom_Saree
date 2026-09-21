/**
 * The worker loop (requirements §14.3, §32, §37).
 *
 * Deployment shape: this app runs serverless, so there is no long-lived worker
 * process to own the queue. Instead a tick drains a bounded number of jobs and
 * returns. Ticks are driven by a scheduler (Vercel Cron hitting
 * `/api/studio/worker/tick`) and, for responsiveness, opportunistically kicked
 * right after a job is enqueued. Correctness never depends on the kick: if it
 * is lost, the scheduled tick still picks the job up, because the queue is in
 * the database rather than in memory.
 */

import { DomainError, isDomainError } from "@/domain/errors";
import { ProviderError } from "@/lib/ai/types";
import { recordAudit } from "@/lib/audit/audit-log";
import { logger } from "@/lib/observability/logger";
import { markJobSideEffectsFailed, processJob } from "./processors";
import { claimNextJob, failJob, type JobRow } from "./queue";

export interface TickResult {
  claimed: number;
  succeeded: number;
  failed: number;
  retrying: number;
}

/** Bounded so a tick always returns inside the platform's function timeout. */
const DEFAULT_MAX_JOBS = 3;

function workerId(): string {
  return `${process.env.VERCEL_REGION ?? "local"}-${process.pid ?? 0}-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Classifies a thrown error into what the customer is told and whether the job
 * is worth retrying.
 *
 * Provider errors already carry that judgement. Domain errors are deliberate
 * and their own `retryable` flag is authoritative. Anything else is an unknown
 * bug — retried once or twice in case it was transient, and reported with
 * generic copy that never exposes the underlying message.
 */
function classify(error: unknown): { code: string; safeMessage: string; retryable: boolean } {
  if (error instanceof ProviderError) {
    return {
      code: `AI_${error.options.reason}`,
      safeMessage:
        "We couldn't create your woven concept this time. Your design is safe. Please try again.",
      retryable: error.retryable,
    };
  }
  if (isDomainError(error)) {
    return { code: error.code, safeMessage: error.message, retryable: error.retryable };
  }
  return {
    code: "INTERNAL_ERROR",
    safeMessage: new DomainError("INTERNAL_ERROR").message,
    retryable: true,
  };
}

async function runOne(job: JobRow): Promise<"succeeded" | "failed" | "retrying"> {
  const log = logger.child({ jobId: job.id, designId: job.design_id, jobType: job.job_type });
  const startedAt = Date.now();

  try {
    await processJob(job);
    log.info("Job succeeded", { durationMs: Date.now() - startedAt, attempt: job.attempt_count });
    return "succeeded";
  } catch (error) {
    const { code, safeMessage, retryable } = classify(error);
    log.error("Job threw", { errorCode: code, attempt: job.attempt_count, error });

    const { willRetry } = await failJob({
      jobId: job.id,
      attemptCount: job.attempt_count,
      retryable,
      errorCode: code,
      safeMessage,
    });

    // Only mark dependent rows failed once we have actually given up, so a
    // retrying job does not flash a failure state at the customer.
    if (!willRetry) {
      await markJobSideEffectsFailed(job, code);
      await recordAudit({
        action: "GENERATION_FAILED",
        entityType: "job",
        entityId: job.id,
        actorUserId: job.user_id,
        metadata: { designId: job.design_id, errorCode: code, attempts: job.attempt_count },
      });
    }

    return willRetry ? "retrying" : "failed";
  }
}

/**
 * Drains up to `maxJobs` from the queue.
 *
 * One job's failure never stops the tick — the next job is still attempted,
 * because a single poisoned payload must not stall every other customer's
 * work behind it.
 */
export async function runWorkerTick(options: { maxJobs?: number } = {}): Promise<TickResult> {
  const maxJobs = options.maxJobs ?? DEFAULT_MAX_JOBS;
  const id = workerId();
  const result: TickResult = { claimed: 0, succeeded: 0, failed: 0, retrying: 0 };

  for (let i = 0; i < maxJobs; i += 1) {
    let job: JobRow | null = null;
    try {
      job = await claimNextJob(id);
    } catch (error) {
      logger.error("Job claim threw", { error });
      break;
    }

    if (!job) break;
    result.claimed += 1;

    const outcome = await runOne(job);
    result[outcome] += 1;
  }

  if (result.claimed > 0) {
    logger.info("Worker tick complete", { workerId: id, ...result });
  }
  return result;
}

/**
 * Best-effort nudge so a customer does not wait for the next scheduled tick.
 *
 * Deliberately fire-and-forget: the caller's response must not be delayed by
 * job processing, and a failed kick is harmless because the scheduler will
 * still drain the queue.
 */
export function kickWorker(): void {
  if (process.env.STUDIO_DISABLE_WORKER_KICK === "1") return;

  void runWorkerTick({ maxJobs: 1 }).catch((error) => {
    logger.warn("Worker kick failed; scheduled tick will pick this up", { error });
  });
}
