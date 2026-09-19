"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { DesignVersion, SareeDesign } from "./types";

/**
 * Cloud-backed counterpart to local-design-store.ts, for signed-in users.
 * Same shape (current design + a version list) so Studio can swap stores
 * based on auth state without changing its own logic.
 */

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
  return (data?.design as SareeDesign) ?? null;
}

export async function saveCurrentDesignCloud(
  userId: string,
  design: SareeDesign,
): Promise<boolean> {
  const supabase = createClient();
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
      .update({ design, name: design.name, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    return !error;
  }

  const { error } = await supabase
    .from("designs")
    .insert({ user_id: userId, name: design.name, design });
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
    design: row.design as SareeDesign,
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
    design: version.design,
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
    .insert({ user_id: userId, name: design.name, design })
    .select("id")
    .single();
  if (error) return null;
  return data.id;
}
