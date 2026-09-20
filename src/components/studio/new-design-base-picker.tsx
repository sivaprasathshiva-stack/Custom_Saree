"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { materials } from "./studio-data";
import { createDefaultDesign } from "./design-reducer";
import { getUser, toPersisted } from "./cloud-design-store";

/**
 * Creates a brand-new `designs` row seeded from the chosen material and
 * hands off to the editor. Known limitation (documented in
 * docs/textile-studio/18-prd-reconciliation.md): the editor
 * (studio-shell.tsx) currently opens "the current design" for the signed
 * -in user (most recently updated row), not a specific :designId, so this
 * always inserts a fresh row and relies on it being the newest.
 */
export function NewDesignBasePicker() {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);

  async function pick(materialId: string) {
    setCreating(materialId);
    const user = await getUser();
    if (!user) {
      router.push("/studio/new");
      return;
    }
    const design = createDefaultDesign();
    design.materialId = materialId;
    design.name = `New ${materials.find((m) => m.id === materialId)?.name ?? "design"}`;

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("designs").insert({
      user_id: user.id,
      name: design.name,
      design: toPersisted(design),
    });
    router.push("/studio");
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {materials.map((m) => (
        <button
          key={m.id}
          disabled={creating !== null}
          onClick={() => pick(m.id)}
          className="flex flex-col gap-2 border border-line-dark p-4 text-left hover:border-brass disabled:opacity-50"
        >
          <span className="font-serif text-lg">{m.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-stone">
            {m.weight} · {m.drape} drape · {m.sheen} sheen
          </span>
          {creating === m.id && (
            <span className="font-mono text-[10px] text-brass-bright">Creating…</span>
          )}
        </button>
      ))}
    </div>
  );
}
