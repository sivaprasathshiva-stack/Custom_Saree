import Link from "next/link";
import { customerStatusLabel } from "@/domain/design-state";
import { DESIGN_STATUSES, type DesignStatus } from "@/domain/types";
import { loadQueue } from "@/lib/studio/admin-service";

export const metadata = { title: "Queue — VELVOREA Design Team" };
export const dynamic = "force-dynamic";

const FILTERS: DesignStatus[] = [
  "SUBMITTED",
  "IN_REVIEW",
  "REFINING",
  "SAMPLE",
  "APPROVED",
  "PRODUCTION",
  "COMPLETED",
];

function isDesignStatus(value: string | undefined): value is DesignStatus {
  return value !== undefined && (DESIGN_STATUSES as readonly string[]).includes(value);
}

/** Submission queue (§49.2). */
export default async function DesignRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = isDesignStatus(status) ? status : undefined;
  const rows = await loadQueue(filter);

  return (
    <div>
      <h1 className="font-display text-3xl">Queue</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/design-requests"
          className={[
            "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
            filter ? "border-line hover:border-ink" : "border-ink bg-ink text-paper",
          ].join(" ")}
        >
          All
        </Link>
        {FILTERS.map((entry) => (
          <Link
            key={entry}
            href={`/admin/design-requests?status=${entry}`}
            className={[
              "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
              filter === entry ? "border-ink bg-ink text-paper" : "border-line hover:border-ink",
            ].join(" ")}
          >
            {customerStatusLabel(entry)}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-gray">
          {filter
            ? `Nothing at ${customerStatusLabel(filter)} right now.`
            : "No concepts have been submitted yet."}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-[0.15em] text-gray">
                  Concept
                </th>
                <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-[0.15em] text-gray">
                  Customer
                </th>
                <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-[0.15em] text-gray">
                  Required by
                </th>
                <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-[0.15em] text-gray">
                  Occasion
                </th>
                <th className="py-3 pr-4 font-mono text-[10px] uppercase tracking-[0.15em] text-gray">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.designId} className="border-b border-line/60 hover:bg-paper-dim">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/designs/${row.designId}`}
                      className="font-mono text-xs hover:text-accent"
                    >
                      {row.conceptId ?? row.designId.slice(0, 8)}
                    </Link>
                    <div className="mt-0.5 text-xs text-gray">{row.name}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div>{row.customerName ?? "—"}</div>
                    <div className="text-xs text-gray">{row.customerEmail ?? ""}</div>
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{row.requiredBy ?? "—"}</td>
                  <td className="py-3 pr-4">{row.occasion ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold">
                      {customerStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
