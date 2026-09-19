# 04 — Database Schema

## Decision: Supabase Postgres (extend existing, don't replace)

The site already has a Supabase project provisioned this session (`supabase/schema.sql`: `profiles`, `designs`, `design_versions`, all with RLS by `auth.uid()`). Requirement §9 explicitly allows "Supabase PostgreSQL... if it fits the existing application" — it does. No new vendor.

## Problem with what's live right now

`designs.design jsonb` stores the *entire* `SareeDesign` as one blob, including artwork as base64 `dataUrl` strings. This violates §10 ("Avoid storing the entire design as one JSON blob... Use structured domain entities") and has a concrete scaling problem: a handful of high-res artwork uploads will blow past Postgres's practical row-size comfort zone and make every autosave a multi-MB write.

## Recommended schema (additive migration, not a rewrite of what's live)

```sql
-- Already exists, keep as-is:
-- profiles, designs (repurposed below), design_versions (repurposed below)

create table materials (
  id text primary key, name text not null, fiber text, weave_family text,
  description text, image_asset_id uuid, texture_asset_id uuid,
  technical_properties jsonb,      -- null fields allowed; never fabricated
  manufacturing_rules jsonb,
  status text not null default 'active'
);

create table material_colour_options (
  material_id text references materials(id), colour_hex text, label text,
  primary key (material_id, colour_hex)
);

create table artwork_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  design_id uuid references designs(id) on delete cascade,
  storage_path text not null,       -- design/{designId}/artwork/{assetId}.png — see storage doc
  mime_type text not null, width_px int, height_px int, size_bytes int,
  created_at timestamptz not null default now()
);

-- designs table: keep the row, change what "design jsonb" means —
-- it becomes a *reference* structure (ids + small scalars), never binary/base64 data.
-- e.g. { material: {...}, palette: {...}, artworkLayerIds: [...], repeat: {...}, ... }
-- Full normalization (separate tables per body/border/pallu/zari config) is the
-- textbook-correct end state; the pragmatic first migration is: get binary data
-- OUT of the blob into artwork_assets + object storage, keep the rest as jsonb
-- until real query patterns (e.g. "find all designs using zari=premium" for
-- manufacturing ops) justify the extra normalization cost. Revisit after Phase 6.

create table model_templates (
  id uuid primary key default gen_random_uuid(), name text not null,
  pose text, body_profile text, skin_tone text, hair text, background text,
  supported_views text[] not null default '{front}',
  base_asset_id uuid, mask_asset_id uuid,   -- UV/region masks for MVP compositing
  status text not null default 'active'
);

create table drape_previews (
  id uuid primary key default gen_random_uuid(),
  design_id uuid references designs(id) on delete cascade,
  design_version_id uuid references design_versions(id),
  model_id uuid references model_templates(id),
  view text not null, rendering_mode text not null default 'template',
  preview_asset_id uuid, fidelity jsonb, generated_at timestamptz not null default now()
);

create table plans (
  id text primary key, name text not null, ai_enabled boolean not null default false
);
insert into plans (id, name, ai_enabled) values
  ('free', 'Free', false), ('pro', 'Pro', true),
  ('business', 'Business', true), ('admin', 'Admin', true);

create table subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text references plans(id) not null default 'free',
  updated_at timestamptz not null default now()
);

create table ai_capabilities (
  id text primary key,      -- e.g. 'ai.motif.generate'
  name text not null, description text, enabled boolean not null default false,
  paid_only boolean not null default true, model text, usage_limit int, status text default 'provisioned'
);

create table ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id), design_id uuid references designs(id),
  capability_id text references ai_capabilities(id), provider text, model text,
  status text not null, duration_ms int, tokens int, estimated_cost_usd numeric,
  error text, requested_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id), action text not null,
  entity_type text, entity_id uuid, metadata jsonb, created_at timestamptz not null default now()
);
```

All new tables get RLS matching the existing pattern (owner-scoped via `auth.uid()`; `materials`/`model_templates`/`ai_capabilities`/`plans` are public-read, admin-write).

## Explicitly deferred (not built until a real need exists, per §75/§76)

`weaves`, `colour_palettes` as reusable saved-palette objects, `border_configurations`/`pallu_configurations` as separate normalized tables (vs. jsonb sub-objects in `designs`), `feature_flags`, `exports` as a persisted table (vs. generated on-demand) — none of these are needed for Phase 1-7 and building them now would be exactly the "arbitrary architectural decision" §8 warns against.
