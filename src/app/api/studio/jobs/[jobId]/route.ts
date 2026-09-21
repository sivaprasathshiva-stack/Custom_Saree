import { DomainError } from "@/domain/errors";
import { JOB_STAGE_LABELS, isTerminalJobStatus, type JobStage } from "@/domain/types";
import { withAuthedRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { getJob } from "@/lib/jobs/queue";

/**
 * Job status polling (§33).
 *
 * Polling is the baseline transport, not a fallback — it works everywhere,
 * survives a dropped connection and needs no stateful infrastructure. The
 * response carries `pollAfterMs` so the client backs off while waiting rather
 * than hammering a fixed interval (§33).
 */

type Params = { jobId: string };

export const GET = withAuthedRoute<Params>("GET /api/studio/jobs/[jobId]", async (context) => {
  const job = await getJob(context.params.jobId);

  // Ownership is checked explicitly: the service-role read above bypasses RLS,
  // so without this a job id would be readable by anyone who guessed it.
  if (!job || job.user_id !== context.userId) throw new DomainError("JOB_NOT_FOUND");

  const terminal = isTerminalJobStatus(job.status);
  const stage = job.stage as JobStage | null;

  return ok(
    {
      id: job.id,
      designId: job.design_id,
      jobType: job.job_type,
      status: job.status,
      stage,
      // Named stages, never an invented percentage (§14.2).
      stageLabel: stage ? JOB_STAGE_LABELS[stage] : null,
      attempt: job.attempt_count,
      terminal,
      // Only the sanitized message is ever exposed (§15.2).
      error: job.status === "FAILED" ? { code: job.error_code, message: job.error_message_safe } : null,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      pollAfterMs: terminal ? null : job.status === "QUEUED" ? 1500 : 2500,
    },
    context.requestId,
  );
});

export const dynamic = "force-dynamic";
