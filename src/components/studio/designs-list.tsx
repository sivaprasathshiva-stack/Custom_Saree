"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface DesignRow {
  id: string;
  name: string;
  updated_at: string;
  status: string;
}

/**
 * My Designs (PRD §7). Reads/writes go straight through the browser
 * Supabase client — RLS (supabase/schema.sql "designs are ... by owner")
 * is what actually enforces that a user can only touch their own rows;
 * this component does not need a server route for that.
 *
 * Known limitation, documented rather than hidden (see
 * docs/textile-studio/18-prd-reconciliation.md): the Studio editor
 * (src/components/studio/studio-shell.tsx) still edits "the current
 * design" for a signed-in user rather than a specific :designId — so
 * "Open" on any row here currently lands on the same /studio editor, which
 * loads the most-recently-updated design. Full per-design routing into the
 * editor is follow-on work, not done in this pass.
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
    const current = designs.find((d) => d.id === id);
    const name = window.prompt("Rename design", current?.name ?? "");
    if (!name || !name.trim()) return;
    await withBusy(id, async () => {
      const supabase = createClient();
      const { error } = await supabase.from("designs").update({ name: name.trim() }).eq("id", id);
      if (!error) setDesigns((ds) => ds.map((d) => (d.id === id ? { ...d, name: name.trim() } : d)));
    });
  }

  async function archive(id: string) {
    await withBusy(id, async () => {
      const supabase = createClient();
      const { error } = await supabase.from("designs").update({ status: "archived" }).eq("id", id);
      if (!error) setDesigns((ds) => ds.filter((d) => d.id !== id));
    });
  }

  async function duplicate(id: string) {
    await withBusy(id, async () => {
      const supabase = createClient();
      const { data: row } = await supabase.from("designs").select("name, design, user_id").eq("id", id).single();
      if (!row) return;
      const { data: copy, error } = await supabase
        .from("designs")
        .insert({ user_id: row.user_id, name: `${row.name} (copy)`, design: row.design })
        .select("id, name, updated_at, status")
        .single();
      if (!error && copy) setDesigns((ds) => [copy as DesignRow, ...ds]);
    });
  }

  async function remove(id: string) {
    if (!window.confirm("Permanently delete this design? This cannot be undone.")) return;
    await withBusy(id, async () => {
      const supabase = createClient();
      const { error } = await supabase.from("designs").delete().eq("id", id);
      if (!error) setDesigns((ds) => ds.filter((d) => d.id !== id));
    });
  }

  if (designs.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center gap-4 border border-dashed border-line-dark px-6 py-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-stone">
          No designs yet
        </p>
        <p className="max-w-xs text-sm text-stone-light">
          Start your first bespoke saree concept — choose a base and begin designing.
        </p>
        <button
          onClick={() => router.push("/studio/new")}
          className="bg-brass-bright px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-charcoal hover:bg-ivory"
        >
          Create Design
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {designs.map((d) => (
        <div key={d.id} className="flex flex-col gap-3 border border-line-dark p-4">
          <div className="flex h-28 items-center justify-center border border-line-dark bg-charcoal-soft font-mono text-[9px] uppercase tracking-[0.15em] text-stone">
            Concept preview
          </div>
          <div>
            <p className="truncate font-serif text-lg text-ivory">{d.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-stone">
              {d.status} · updated {new Date(d.updated_at).toLocaleDateString("en-IN")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.1em]">
            <button
              onClick={() => router.push("/studio")}
              className="border border-line-dark px-2 py-1 text-stone-light hover:border-brass hover:text-brass"
            >
              Open
            </button>
            <button
              disabled={busyId === d.id}
              onClick={() => rename(d.id)}
              className="border border-line-dark px-2 py-1 text-stone-light hover:border-brass hover:text-brass disabled:opacity-40"
            >
              Rename
            </button>
            <button
              disabled={busyId === d.id}
              onClick={() => duplicate(d.id)}
              className="border border-line-dark px-2 py-1 text-stone-light hover:border-brass hover:text-brass disabled:opacity-40"
            >
              Duplicate
            </button>
            <button
              disabled={busyId === d.id}
              onClick={() => archive(d.id)}
              className="border border-line-dark px-2 py-1 text-stone-light hover:border-brass hover:text-brass disabled:opacity-40"
            >
              Archive
            </button>
            <button
              disabled={busyId === d.id}
              onClick={() => remove(d.id)}
              className="border border-line-dark px-2 py-1 text-danger hover:border-danger disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
