"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { DesignVersion, PersistedSareeDesign, SareeDesign } from "./types";

/**
 * Cloud-backed counterpart to local-design-store.ts, for signed-in users.
 * Same shape (current design + a version list) so Studio can swap stores
 * based on auth state without changing its own logic.
 *
 * Phase 2 migration: `designs.design`/`design_versions.design` now store the
 * reference-structure shape (`PersistedSareeDesign`, types.ts) — artwork
 * layers keep their id/name/fileName/transform/visible but never their
 * base64 `dataUrl`. See the comment on PersistedSareeDesign for why and what
 * the current limitation is (no cross-device artwork sync until Phase 4's
 * object storage lands).
 */

export function toPersisted(design: SareeDesign): PersistedSareeDesign {
  return {
    ...design,
    artwork: {
      ...design.artwork,
      layers: design.artwork.layers.map((layer) => {
        const { dataUrl, ...rest } = layer;
        void dataUrl;
        return rest;
      }),
    },
  };
}

export function fromPersisted(persisted: PersistedSareeDesign): SareeDesign {
  return {
    ...persisted,
    artwork: {
      ...persisted.artwork,
      layers: persisted.artwork.layers.map((layer) => ({
        ...layer,
        dataUrl: "",
        // Backfill for rows written before `placement` existed (Phase 3.5).
        placement: layer.placement ?? "body",
      })),
    },
  };
}

export async function getUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function loadCurrentDesignCloud(userId: string): Promise<SareeDesign | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("designs")
    .select("design")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.design) return null;
  return fromPersisted(data.design as PersistedSareeDesign);
}

export async function saveCurrentDesignCloud(
  userId: string,
  design: SareeDesign,
): Promise<boolean> {
  const supabase = createClient();
  const persisted = toPersisted(design);
  const { data: existing } = await supabase
    .from("designs")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("designs")
      .update({ design: persisted, name: design.name, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    return !error;
  }

  const { error } = await supabase
    .from("designs")
    .insert({ user_id: userId, name: design.name, design: persisted });
  return !error;
}

export async function loadVersionsCloud(userId: string): Promise<DesignVersion[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("design_versions")
    .select("id, label, created_at, design")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    createdAt: row.created_at,
    design: fromPersisted(row.design as PersistedSareeDesign),
  }));
}

export async function saveVersionCloud(
  userId: string,
  designId: string,
  version: DesignVersion,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("design_versions").insert({
    id: version.id,
    design_id: designId,
    user_id: userId,
    label: version.label,
    design: toPersisted(version.design),
  });
  return !error;
}

export async function getOrCreateDesignId(userId: string, design: SareeDesign): Promise<string | null> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("designs")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("designs")
    .insert({ user_id: userId, name: design.name, design: toPersisted(design) })
    .select("id")
    .single();
  if (error) return null;
  return data.id;
}
