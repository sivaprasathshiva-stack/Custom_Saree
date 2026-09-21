import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { customerStatusLabel } from "@/domain/design-state";
import { DESIGN_STATUSES, type DesignStatus } from "@/domain/types";
import {
  addInternalNote,
  changeDesignStatus,
  loadDesignDetail,
  recordAdminView,
  retryFailedJob,
} from "@/lib/studio/admin-service";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Design detail and the actions a designer actually needs (§49.3, §49.4).
 *
 * Mutations are server actions rather than client fetches, so they work
 * without JavaScript and re-verify the caller on every submission — the
 * layout's admin gate covers rendering, but an action must not trust that a
 * page was rendered to an admin.
 */

async function requireAdminUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();
  if (!profile?.is_admin) redirect("/");

  return user.id;
}

async function updateStatus(formData: FormData) {
  "use server";
  const actorUserId = await requireAdminUserId();

  const designId = String(formData.get("designId") ?? "");
  const toStatus = String(formData.get("toStatus") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!(DESIGN_STATUSES as readonly string[]).includes(toStatus)) return;

  await changeDesignStatus({
    designId,
    toStatus: toStatus as DesignStatus,
    actorUserId,
    reason: reason || undefined,
  });
  revalidatePath(`/admin/designs/${designId}`);
}

async function createNote(formData: FormData) {
  "use server";
  const actorUserId = await requireAdminUserId();

  const designId = String(formData.get("designId") ?? "");
  const note = String(formData.get("note") ?? "");
  if (note.trim().length === 0) return;

  await addInternalNote({ designId, authorUserId: actorUserId, note });
  revalidatePath(`/admin/designs/${designId}`);
}

async function retryJob(formData: FormData) {
  "use server";
  const actorUserId = await requireAdminUserId();

  const designId = String(formData.get("designId") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) return;

  await retryFailedJob({ jobId, actorUserId });
  revalidatePath(`/admin/designs/${designId}`);
}

export default async function AdminDesignDetailPage({
  params,
}: {
  params: Promise<{ designId: string }>;
}) {
  const { designId } = await params;
  const actorUserId = await requireAdminUserId();

  const detail = await loadDesignDetail(designId);
  if (!detail) notFound();

  // §50: staff access to a customer's design is itself an audited event.
  await recordAdminView(designId, actorUserId);

  return (
    <div>
      <Link href="/admin/design-requests" className="text-xs text-gray hover:text-accent">
        ← Queue
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{detail.name}</h1>
          <p className="mt-1 font-mono text-xs text-gray">{detail.conceptId ?? detail.designId}</p>
        </div>
        <span className="rounded-full border border-ink px-3 py-1.5 text-xs font-semibold">
          {customerStatusLabel(detail.status)}
        </span>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {/* Concepts */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray">
              Concepts
            </h2>
            {detail.versions.length === 0 ? (
              <p className="mt-3 text-sm text-gray">No concept has been generated yet.</p>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-3">
                {detail.versions.map((version) => (
                  <li key={version.id} className="rounded-sm border border-line p-3">
                    {version.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={version.imageUrl}
                        alt={`Version ${version.versionNumber}`}
                        className="mb-2 aspect-[2/3] w-full rounded-sm object-cover"
                      />
                    )}
                    <div className="text-xs font-semibold">Version {version.versionNumber}</div>
                    {version.label && (
                      <div className="mt-0.5 text-[11px] text-gray">{version.label}</div>
                    )}
                    {/* Reproducibility metadata (§64) */}
                    <div className="mt-1 font-mono text-[10px] text-gray-light">
                      {version.provider ?? "—"} · {version.model ?? "—"} · prompt v
                      {version.promptVersion ?? "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Customer references */}
          {detail.referenceUrls.length > 0 && (
            <section>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray">
                Customer images
              </h2>
              <ul className="mt-4 flex flex-wrap gap-3">
                {detail.referenceUrls.map((url) => (
                  <li key={url}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Customer reference"
                      className="h-28 w-28 rounded-sm border border-line object-cover"
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Jobs */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray">
              Generation jobs
            </h2>
            {detail.jobs.length === 0 ? (
              <p className="mt-3 text-sm text-gray">No jobs yet.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {detail.jobs.map((job) => (
                  <li
                    key={job.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line px-3 py-2 text-xs"
                  >
                    <span className="font-mono">{job.jobType}</span>
                    <span
                      className={
                        job.status === "FAILED"
                          ? "text-danger"
                          : job.status === "SUCCEEDED"
                            ? "text-success"
                            : "text-gray"
                      }
                    >
                      {job.status}
                      {job.attemptCount > 1 ? ` (${job.attemptCount} attempts)` : ""}
                    </span>
                    {job.errorMessage && (
                      <span className="w-full text-[11px] text-gray">{job.errorMessage}</span>
                    )}
                    {job.status === "FAILED" && (
                      <form action={retryJob}>
                        <input type="hidden" name="designId" value={detail.designId} />
                        <input type="hidden" name="jobId" value={job.id} />
                        <button
                          type="submit"
                          className="rounded-sm border border-line px-3 py-1 font-semibold hover:border-ink"
                        >
                          Retry
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Timeline */}
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray">
              Timeline
            </h2>
            <ol className="mt-4 space-y-2 text-xs">
              {detail.timeline.map((entry, index) => (
                <li key={index} className="flex flex-wrap gap-2 text-gray">
                  <span className="tabular-nums">{entry.createdAt.slice(0, 16).replace("T", " ")}</span>
                  <span className="text-ink">
                    {entry.fromStatus ? `${entry.fromStatus} → ` : ""}
                    {entry.toStatus}
                  </span>
                  {entry.reason && <span>· {entry.reason}</span>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-8">
          {/* Customer details */}
          {detail.submission && (
            <section className="rounded-sm border border-line p-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray">
                Customer
              </h2>
              <dl className="mt-3 space-y-2 text-xs">
                <div><dt className="text-gray">Name</dt><dd>{detail.submission.fullName}</dd></div>
                <div><dt className="text-gray">Email</dt><dd className="break-all">{detail.submission.email}</dd></div>
                <div><dt className="text-gray">Phone</dt><dd>{detail.submission.phone}</dd></div>
                <div><dt className="text-gray">Address</dt><dd>{detail.submission.address}</dd></div>
                <div><dt className="text-gray">Required by</dt><dd className="tabular-nums">{detail.submission.requiredBy}</dd></div>
                <div><dt className="text-gray">Occasion</dt><dd>{detail.submission.occasion ?? "—"}</dd></div>
                <div><dt className="text-gray">Quantity</dt><dd>{detail.submission.quantity ?? 1}</dd></div>
                {detail.submission.comments && (
                  <div><dt className="text-gray">Notes from customer</dt><dd>{detail.submission.comments}</dd></div>
                )}
                {detail.submission.termsAcceptedAt && (
                  <div>
                    <dt className="text-gray">Terms accepted</dt>
                    <dd className="tabular-nums">
                      {detail.submission.termsAcceptedAt.slice(0, 10)} (v
                      {detail.submission.termsVersion})
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Status change */}
          <section className="rounded-sm border border-line p-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray">
              Move to
            </h2>
            {detail.allowedTransitions.length === 0 ? (
              <p className="mt-3 text-xs text-gray">
                This design has reached a final state.
              </p>
            ) : (
              <form action={updateStatus} className="mt-3 space-y-3">
                <input type="hidden" name="designId" value={detail.designId} />
                <label htmlFor="toStatus" className="sr-only">
                  New status
                </label>
                <select
                  id="toStatus"
                  name="toStatus"
                  className="w-full rounded-sm border border-line px-3 py-2 text-sm"
                >
                  {detail.allowedTransitions.map((status) => (
                    <option key={status} value={status}>
                      {customerStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <label htmlFor="reason" className="sr-only">
                  Reason
                </label>
                <input
                  id="reason"
                  name="reason"
                  placeholder="Reason (optional)"
                  className="w-full rounded-sm border border-line px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="w-full rounded-sm bg-ink px-4 py-2.5 text-xs font-semibold text-paper hover:bg-ink-soft"
                >
                  Update status
                </button>
              </form>
            )}
          </section>

          {/* Internal notes */}
          <section className="rounded-sm border border-line p-4">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray">
              Internal notes
            </h2>
            <p className="mt-1 text-[10px] text-gray-light">Never shown to the customer.</p>

            <form action={createNote} className="mt-3 space-y-2">
              <input type="hidden" name="designId" value={detail.designId} />
              <label htmlFor="note" className="sr-only">
                Note
              </label>
              <textarea
                id="note"
                name="note"
                rows={3}
                className="w-full rounded-sm border border-line px-3 py-2 text-sm"
                placeholder="Add a note for the team"
              />
              <button
                type="submit"
                className="w-full rounded-sm border border-line px-4 py-2 text-xs font-semibold hover:border-ink"
              >
                Add note
              </button>
            </form>

            <ul className="mt-4 space-y-3">
              {detail.notes.map((note) => (
                <li key={note.id} className="border-t border-line pt-3 text-xs">
                  <p className="whitespace-pre-wrap">{note.note}</p>
                  <p className="mt-1 font-mono text-[10px] text-gray">
                    {note.createdAt.slice(0, 16).replace("T", " ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
