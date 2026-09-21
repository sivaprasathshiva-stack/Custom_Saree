import Link from "next/link";
import { customerStatusLabel } from "@/domain/design-state";
import type { DesignStatus } from "@/domain/types";
import { loadDashboardCounts } from "@/lib/studio/admin-service";

export const metadata = { title: "Design Team — VELVOREA" };
export const dynamic = "force-dynamic";

/** The pipeline, in the order work actually moves through it (§49.1). */
const PIPELINE: DesignStatus[] = [
  "SUBMITTED",
  "IN_REVIEW",
  "REFINING",
  "SAMPLE",
  "APPROVED",
  "PRODUCTION",
  "COMPLETED",
];

export default async function AdminDashboardPage() {
  const counts = await loadDashboardCounts();
  const failedJobs = counts.FAILED_JOBS ?? 0;

  return (
    <div>
      <h1 className="font-display text-3xl">Dashboard</h1>
      <p className="mt-2 text-sm text-gray">Concepts customers have sent to VELVOREA.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {PIPELINE.map((status) => {
          const count = counts[status] ?? 0;
          return (
            <Link
              key={status}
              href={`/admin/design-requests?status=${status}`}
              className="rounded-sm border border-line p-4 transition hover:border-ink"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray">
                {customerStatusLabel(status)}
              </div>
              <div className="mt-2 font-display text-3xl tabular-nums">{count}</div>
            </Link>
          );
        })}
      </div>

      {failedJobs > 0 && (
        <div className="mt-8 rounded-sm border border-danger/40 bg-danger/5 p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-danger">
            Needs attention
          </div>
          <p className="mt-2 text-sm">
            {failedJobs} generation {failedJobs === 1 ? "job has" : "jobs have"} failed. Open the
            design and use Retry — the customer&apos;s work is intact.
          </p>
        </div>
      )}

      <div className="mt-10">
        <Link
          href="/admin/design-requests"
          className="inline-block rounded-sm bg-ink px-6 py-3 text-sm font-semibold text-paper hover:bg-ink-soft"
        >
          Open the queue
        </Link>
      </div>
    </div>
  );
}
