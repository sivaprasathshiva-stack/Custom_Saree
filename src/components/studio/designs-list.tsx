"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_DESIGNS_PER_CUSTOMER } from "@/config/limits";
import { customerStatusLabel, isCustomerEditable } from "@/domain/design-state";
import type { DesignStatus } from "@/domain/types";
import { ApiError, apiDelete, apiPatch } from "@/lib/api/client";

export interface DesignRow {
  id: string;
  name: string;
  updated_at: string;
  status: DesignStatus;
  public_id: string | null;
  thumbnailUrl: string | null;
}

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />
    </svg>
  );
}

/**
 * My Designs (requirements §22).
 *
 * Delete goes through the API rather than a direct table delete, because a
 * design owns uploaded photographs, concepts and drape frames in object
 * storage. Deleting only the row would leave those orphaned and billed
 * forever (§35).
 *
 * A submitted design is read-only (§5.2): it can be opened and viewed, but
 * not renamed or deleted — it is VELVOREA's work in progress too.
 */
export function DesignsList({ initialDesigns }: { initialDesigns: DesignRow[] }) {
  const router = useRouter();
  const [designs, setDesigns] = useState(initialDesigns);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const used = designs.length;
  const atLimit = used >= MAX_DESIGNS_PER_CUSTOMER;

  async function rename(design: DesignRow) {
    const name = window.prompt("Rename design", design.name);
    if (!name?.trim() || name.trim() === design.name) return;

    setBusyId(design.id);
    setError(null);
    try {
      await apiPatch(`/api/studio/designs/${design.id}`, { name: name.trim() });
      setDesigns((rows) =>
        rows.map((row) => (row.id === design.id ? { ...row, name: name.trim() } : row)),
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Couldn't rename that design.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(design: DesignRow) {
    setBusyId(design.id);
    setError(null);
    try {
      await apiDelete(`/api/studio/designs/${design.id}`);
      setDesigns((rows) => rows.filter((row) => row.id !== design.id));
      setConfirmingId(null);
      // The welcome screen shows slot usage, so it must not stay stale.
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Couldn't delete that design.");
    } finally {
      setBusyId(null);
    }
  }

  function openHref(design: DesignRow): string {
    if (!isCustomerEditable(design.status)) return `/studio/${design.id}/woven`;
    return design.status === "WOVEN_CONCEPT"
      ? `/studio/${design.id}/woven`
      : `/studio/${design.id}/upload`;
  }

  if (designs.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-4 rounded-lg border border-dashed border-line px-6 py-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-gray">
          No designs yet
        </p>
        <p className="max-w-xs text-sm text-gray">
          Your designs will appear here. Start with a photograph of a saree you love.
        </p>
        <button
          type="button"
          onClick={() => router.push("/studio/new")}
          className="rounded-sm bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-ink-soft"
        >
          Create Your First Saree
        </button>
      </div>
    );
  }

  return (
    <>
      <p className="mt-2 text-xs text-gray">
        {used} of {MAX_DESIGNS_PER_CUSTOMER} design slots used
        {atLimit && " — delete one to start another"}
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-sm border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {designs.map((design) => {
          const editable = isCustomerEditable(design.status);
          const confirming = confirmingId === design.id;
          const busy = busyId === design.id;

          return (
            <li
              key={design.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-line bg-paper transition-shadow hover:shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
            >
              <button
                type="button"
                onClick={() => router.push(openHref(design))}
                className="relative block aspect-[4/5] w-full overflow-hidden bg-paper-dim"
                aria-label={`Open ${design.name}`}
              >
                {design.thumbnailUrl ? (
                  // The WebP derivative, not the full 2K concept (§30.3).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={design.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center font-mono text-[9px] uppercase tracking-[0.15em] text-gray">
                    No concept yet
                  </span>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider backdrop-blur">
                  {customerStatusLabel(design.status)}
                </span>
              </button>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg leading-tight">{design.name}</p>
                  {design.public_id && (
                    <p className="mt-0.5 font-mono text-[10px] text-gray">{design.public_id}</p>
                  )}
                  <p className="mt-1 text-[11px] text-gray">
                    Updated {new Date(design.updated_at).toLocaleDateString("en-IN")}
                  </p>
                </div>

                {confirming ? (
                  <div className="mt-auto rounded-sm border border-danger/40 bg-danger/5 p-3">
                    <p className="text-xs leading-relaxed">
                      Delete this design and its photos permanently? This can&apos;t be undone.
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(design)}
                        className="rounded-sm bg-danger px-3 py-1.5 text-xs font-semibold text-paper disabled:opacity-50"
                      >
                        {busy ? "Deleting…" : "Delete"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmingId(null)}
                        className="rounded-sm border border-line px-3 py-1.5 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(openHref(design))}
                      className="flex-1 rounded-sm border border-line px-3 py-2 text-xs font-semibold transition-colors hover:border-ink"
                    >
                      Open
                    </button>

                    {editable && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void rename(design)}
                          className="rounded-sm border border-line px-3 py-2 text-xs font-semibold transition-colors hover:border-ink disabled:opacity-40"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmingId(design.id)}
                          aria-label={`Delete ${design.name}`}
                          title="Delete design"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-line text-gray transition-colors hover:border-danger hover:text-danger disabled:opacity-40"
                        >
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
