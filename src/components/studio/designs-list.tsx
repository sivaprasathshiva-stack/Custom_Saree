"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { customerStatusLabel } from "@/domain/design-state";
import { isCustomerEditable } from "@/domain/design-state";
import type { DesignStatus } from "@/domain/types";
import { createClient } from "@/lib/supabase/client";

export interface DesignRow {
  id: string;
  name: string;
  updated_at: string;
  status: DesignStatus;
  public_id: string | null;
  thumbnailUrl: string | null;
}

/**
 * My Designs (requirements §22).
 *
 * Reads and writes go through the browser Supabase client — RLS is what
 * actually enforces that a customer can only touch their own rows, so no
 * server route is needed for these.
 *
 * A submitted design is read-only (§5.2): it can be opened and viewed, but
 * not renamed, archived or deleted, because it is now VELVOREA's work in
 * progress as much as the customer's.
 */
export function DesignsList({ initialDesigns }: { initialDesigns: DesignRow[] }) {
  const router = useRouter();
  const [designs, setDesigns] = useState(initialDesigns);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function withBusy(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    try {
      await fn();
    } finally {
      setBusyId(null);
    }
  }

  async function rename(id: string) {
    const current = designs.find((design) => design.id === id);
    const name = window.prompt("Rename design", current?.name ?? "");
    if (!name?.trim()) return;

    await withBusy(id, async () => {
      const { error } = await createClient()
        .from("designs")
        .update({ name: name.trim() })
        .eq("id", id);
      if (!error) {
        setDesigns((rows) =>
          rows.map((row) => (row.id === id ? { ...row, name: name.trim() } : row)),
        );
      }
    });
  }

  async function archive(id: string) {
    await withBusy(id, async () => {
      // The §5 lifecycle value, not the old list-filter string.
      const { error } = await createClient()
        .from("designs")
        .update({ status: "ARCHIVED", archived_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) setDesigns((rows) => rows.filter((row) => row.id !== id));
    });
  }

  async function remove(id: string) {
    if (!window.confirm("Permanently delete this design? This cannot be undone.")) return;
    await withBusy(id, async () => {
      const { error } = await createClient().from("designs").delete().eq("id", id);
      if (!error) setDesigns((rows) => rows.filter((row) => row.id !== id));
    });
  }

  /** Where "Open" should land depends on how far the design has got. */
  function openHref(design: DesignRow): string {
    if (!isCustomerEditable(design.status)) return `/studio/${design.id}/woven`;
    return design.status === "WOVEN_CONCEPT"
      ? `/studio/${design.id}/woven`
      : `/studio/${design.id}/upload`;
  }

  if (designs.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-4 rounded-sm border border-dashed border-line px-6 py-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-gray">
          No designs yet
        </p>
        <p className="max-w-xs text-sm text-gray">
          Your designs will appear here. Start with a photograph of a saree you love.
        </p>
        <button
          type="button"
          onClick={() => router.push("/studio/new")}
          className="rounded-sm bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-soft"
        >
          Create Your First Saree
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {designs.map((design) => {
        const editable = isCustomerEditable(design.status);
        return (
          <div
            key={design.id}
            className="flex flex-col gap-3 rounded-sm border border-line p-4"
          >
            <button
              type="button"
              onClick={() => router.push(openHref(design))}
              className="block overflow-hidden rounded-sm border border-line bg-paper-dim"
            >
              {design.thumbnailUrl ? (
                // The WebP derivative, not the full 2K concept (§30.3).
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={design.thumbnailUrl}
                  alt={design.name}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <span className="flex h-36 items-center justify-center font-mono text-[9px] uppercase tracking-[0.15em] text-gray">
                  No concept yet
                </span>
              )}
            </button>

            <div>
              <p className="truncate font-display text-lg">{design.name}</p>
              {design.public_id && (
                <p className="font-mono text-[10px] text-gray">{design.public_id}</p>
              )}
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-gray">
                {/* Never the raw status (§22.2). */}
                {customerStatusLabel(design.status)} · updated{" "}
                {new Date(design.updated_at).toLocaleDateString("en-IN")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
              <button
                type="button"
                onClick={() => router.push(openHref(design))}
                className="rounded-sm border border-line px-2.5 py-1.5 hover:border-ink"
              >
                Open
              </button>

              {editable && (
                <>
                  <button
                    type="button"
                    disabled={busyId === design.id}
                    onClick={() => rename(design.id)}
                    className="rounded-sm border border-line px-2.5 py-1.5 hover:border-ink disabled:opacity-40"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    disabled={busyId === design.id}
                    onClick={() => archive(design.id)}
                    className="rounded-sm border border-line px-2.5 py-1.5 hover:border-ink disabled:opacity-40"
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    disabled={busyId === design.id}
                    onClick={() => remove(design.id)}
                    className="rounded-sm border border-line px-2.5 py-1.5 text-danger hover:border-danger disabled:opacity-40"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
