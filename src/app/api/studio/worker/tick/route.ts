import { NextResponse } from "next/server";
import { runWorkerTick } from "@/lib/jobs/worker";
import { logger } from "@/lib/observability/logger";

/**
 * Scheduled worker tick (§32, §74).
 *
 * Invoked by the platform scheduler (Vercel Cron — see vercel.json). This is
 * the authoritative way jobs get processed; the opportunistic kick after an
 * enqueue is only a latency optimisation.
 *
 * Authorization is a shared secret rather than a user session, because the
 * caller is infrastructure, not a person. Without a configured secret the
 * route refuses to run at all — an open endpoint that drains the job queue
 * would be a denial-of-wallet vector.
 */

/** Constant-time compare, so a wrong guess leaks nothing by timing. */
function matches(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

function authorized(request: Request): boolean {
  // Vercel Cron authenticates with `Authorization: Bearer $CRON_SECRET`;
  // WORKER_TICK_SECRET covers any other scheduler or a manual drain.
  const accepted = [process.env.WORKER_TICK_SECRET, process.env.CRON_SECRET].filter(
    (value): value is string => Boolean(value),
  );
  if (accepted.length === 0) return false;

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  const provided = bearer ?? request.headers.get("x-worker-secret");
  if (!provided) return false;

  return accepted.some((expected) => matches(provided, expected));
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!authorized(request)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not authorized." } }, { status: 403 });
  }

  try {
    const result = await runWorkerTick({ maxJobs: 5 });
    return NextResponse.json({ data: result });
  } catch (error) {
    logger.error("Worker tick failed", { error });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Worker tick failed." } },
      { status: 500 },
    );
  }
}

/** Vercel Cron issues GET requests; same handler, same authorization. */
export async function GET(request: Request): Promise<NextResponse> {
  return POST(request);
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
