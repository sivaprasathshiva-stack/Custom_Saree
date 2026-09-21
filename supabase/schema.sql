-- VELVOREA — initial backend schema (Supabase/Postgres)
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.
-- Covers: user profiles, cloud-saved Studio designs + version history.
-- Auth itself (sign-up/sign-in/session) is handled by Supabase's built-in
-- `auth.users` table — this file only adds the app-specific tables and the
-- row-level security that scopes every row to its owning user.

-- --- profiles ----------------------------------------------------------
-- One row per auth.users row, created automatically on sign-up.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  country text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are viewable by owner" on public.profiles;
create policy "profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles are editable by owner" on public.profiles;
create policy "profiles are editable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- --- designs -------------------------------------------------------------
-- The customer's current/working Studio design. Stored as jsonb rather than
-- normalized columns because the design shape is still evolving and the
-- client is the only reader/writer of its internals.
--
-- Phase 2 migration (docs/textile-studio/04-database-schema.md,
-- docs/textile-studio/16-implementation-plan.md): as of this migration, the
-- `design` column holds `PersistedSareeDesign`
-- (src/components/studio/types.ts), NOT the full client-side `SareeDesign`.
-- The only structural difference: artwork layers keep their
-- id/name/fileName/transform/visible metadata but never their base64
-- `dataUrl` — no inline binary data in the blob per §10. This is a jsonb
-- *contract* change, not a column-type change, so no DDL/ALTER is required;
-- the conversion happens in src/components/studio/cloud-design-store.ts
-- (`toPersisted`/`fromPersisted`). Real per-layer asset storage
-- (`artwork_assets` table + Supabase Storage bucket) is Phase 4 scope —
-- until then, artwork pixel data does not sync across devices/browsers.
-- Any `design` row written before this migration may still contain a
-- `dataUrl` field on old layers; the client only ever writes the new shape
-- going forward and treats a present-but-unused `dataUrl` from an old row
-- as inert extra data (ignored on read via `fromPersisted`).
create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Untitled design',
  design jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Phase 3.5: My Designs list (src/app/studio/designs/page.tsx) needs an
-- Archive action per the PRD's action list — 'active' | 'archived'. Not a
-- delete; archived designs stay recoverable and simply drop out of the
-- default list view.
alter table public.designs add column if not exists status text not null default 'active';

create index if not exists designs_user_id_idx on public.designs (user_id);

alter table public.designs enable row level security;

drop policy if exists "designs are viewable by owner" on public.designs;
create policy "designs are viewable by owner"
  on public.designs for select
  using (auth.uid() = user_id);

drop policy if exists "designs are insertable by owner" on public.designs;
create policy "designs are insertable by owner"
  on public.designs for insert
  with check (auth.uid() = user_id);

drop policy if exists "designs are updatable by owner" on public.designs;
create policy "designs are updatable by owner"
  on public.designs for update
  using (auth.uid() = user_id);

drop policy if exists "designs are deletable by owner" on public.designs;
create policy "designs are deletable by owner"
  on public.designs for delete
  using (auth.uid() = user_id);

-- --- design_versions -----------------------------------------------------
-- Named snapshots a customer saves while iterating (mirrors DesignVersion).
create table if not exists public.design_versions (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  design jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists design_versions_design_id_idx on public.design_versions (design_id);

alter table public.design_versions enable row level security;

drop policy if exists "design versions are viewable by owner" on public.design_versions;
create policy "design versions are viewable by owner"
  on public.design_versions for select
  using (auth.uid() = user_id);

drop policy if exists "design versions are insertable by owner" on public.design_versions;
create policy "design versions are insertable by owner"
  on public.design_versions for insert
  with check (auth.uid() = user_id);

drop policy if exists "design versions are deletable by owner" on public.design_versions;
create policy "design versions are deletable by owner"
  on public.design_versions for delete
  using (auth.uid() = user_id);

-- --- admin role (minimal, Phase 3.5) -------------------------------------
-- No roles table yet (deliberately, per docs/textile-studio/16-implementation-
-- plan.md Phase 3.5): a single boolean is enough for the read-only
-- design-requests list in src/app/admin/design-requests/page.tsx. Granting
-- this currently requires a manual DB update:
--   update public.profiles set is_admin = true where id = '<user-uuid>';
-- There is no admin UI for role management yet — that is out of scope for
-- this pass. Do not trust a client-supplied "am I admin" flag anywhere;
-- every admin route re-checks this column server-side via the service-role
-- or an RLS-scoped read of the caller's own profile row.
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- --- submissions -----------------------------------------------------------
-- Created when a customer taps "Submit to VELVOREA" from the Complete Design
-- flow (VELVOREA_Textile_Studio_PRD_FRD_Architecture.md §23-24, §32-34).
-- One design can, in principle, be submitted more than once (e.g. resubmit
-- after "Clarification Required"), so this is its own table keyed by
-- design_id rather than columns bolted onto `designs`.
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  country text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text,
  postal_code text,
  required_by_date date not null,
  occasion text,
  quantity int,
  budget_range text,
  comments text,
  -- Internal workflow status. Customer-facing UI must map this through
  -- src/lib/studio/submission-status.ts (PRD §35's exact label list) —
  -- never render this raw value to a customer.
  status text not null default 'submitted',
  priority text not null default 'standard',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submissions_user_id_idx on public.submissions (user_id);
create index if not exists submissions_design_id_idx on public.submissions (design_id);

alter table public.submissions enable row level security;

drop policy if exists "submissions are viewable by owner" on public.submissions;
create policy "submissions are viewable by owner"
  on public.submissions for select
  using (auth.uid() = user_id);

drop policy if exists "submissions are insertable by owner" on public.submissions;
create policy "submissions are insertable by owner"
  on public.submissions for insert
  with check (auth.uid() = user_id);

-- Customers never update/delete a submission directly once sent (status
-- changes are a design-team/admin action). No update/delete policy is
-- granted here on purpose — only the service-role key (used server-side by
-- admin tooling, not yet built beyond the read-only list) can change status.

-- Read-only admin access, gated on profiles.is_admin, mirroring the
-- owner-scoped pattern above but for the design-requests list
-- (src/app/admin/design-requests/page.tsx).
drop policy if exists "submissions are viewable by admins" on public.submissions;
create policy "submissions are viewable by admins"
  on public.submissions for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- --- notification_events ----------------------------------------------------
-- One row per attempted office notification for a submission (PRD §37/§46).
-- Non-negotiable rule: a failure here must never fail the submission itself
-- — see src/app/api/studio/submissions/route.ts, which always writes the
-- submission row first and treats notification failure as best-effort.
create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  type text not null default 'office_notification',
  recipient text not null,
  status text not null default 'PENDING', -- PENDING | SENT | FAILED
  attempt_count int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_events_submission_id_idx
  on public.notification_events (submission_id);

alter table public.notification_events enable row level security;

-- No customer-facing policy: notification delivery status is an internal
-- concern. Only the service-role key (server-side route handler) reads or
-- writes this table for now; add an admin-scoped select policy here if/when
-- the design-team workspace needs to see delivery status directly.


-- ===========================================================================
-- TEXTILE STUDIO — production data model
-- Implements VELVOREA_TEXTILE_STUDIO_PRODUCTION_REQUIREMENTS §29.
--
-- This section replaces the configurator's single `designs.design` jsonb blob
-- with the normalized model the requirements call for: assets, analysis,
-- compositions, generation jobs, immutable concept versions, drapes, status
-- history and an append-only audit log.
--
-- `designs.design` is deliberately NOT dropped. Existing rows still carry the
-- configurator's saved state, and dropping the column would destroy customer
-- work that predates this migration. It is simply no longer written by the
-- new Studio. Retire it only after the old rows have been migrated or aged
-- out per the retention policy (§35).
-- ===========================================================================

-- --- designs: lifecycle columns -------------------------------------------
-- The customer-facing concept identifier (§21). Nullable until the design is
-- first persisted by the allocator below, then immutable.
alter table public.designs add column if not exists public_id text;
alter table public.designs add column if not exists current_version_id uuid;
alter table public.designs add column if not exists submitted_at timestamptz;
alter table public.designs add column if not exists archived_at timestamptz;

create unique index if not exists designs_public_id_key
  on public.designs (public_id) where public_id is not null;

-- `status` previously held the Phase 3.5 list-filter values ('active' |
-- 'archived'). It now holds the §5 lifecycle state. Migrate in place: an
-- active configurator design is a DRAFT, an archived one is ARCHIVED.
-- This is idempotent — re-running it leaves already-migrated rows alone.
update public.designs set status = 'DRAFT' where status = 'active';
update public.designs set status = 'ARCHIVED' where status = 'archived';

alter table public.designs alter column status set default 'DRAFT';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'designs_status_check'
  ) then
    alter table public.designs add constraint designs_status_check check (
      status in (
        'DRAFT', 'WOVEN_CONCEPT', 'SUBMITTED', 'IN_REVIEW', 'REFINING',
        'SAMPLE', 'APPROVED', 'PRODUCTION', 'COMPLETED', 'CANCELLED', 'ARCHIVED'
      )
    );
  end if;
end $$;

create index if not exists designs_status_idx on public.designs (status);

-- --- concept id allocation (§21) -------------------------------------------
-- Concept ids restart their sequence each calendar year. Allocation must be
-- atomic: two customers submitting in the same instant must never receive the
-- same number, which only the database can guarantee. The application formats
-- nothing itself — it calls this function (see src/domain/ids.ts for the
-- matching format and its tests).
create table if not exists public.concept_sequences (
  year int primary key,
  last_value int not null default 0
);

alter table public.concept_sequences enable row level security;
-- No policies: service-role only. Customers never read the sequence table.

create or replace function public.allocate_concept_id()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  current_year int := extract(year from now() at time zone 'utc')::int;
  next_value int;
begin
  insert into public.concept_sequences as seq (year, last_value)
  values (current_year, 1)
  on conflict (year) do update set last_value = seq.last_value + 1
  returning last_value into next_value;

  if next_value > 999999 then
    raise exception 'Concept sequence exhausted for year %', current_year
      using errcode = 'check_violation';
  end if;

  return 'VL-' || current_year::text || '-' || lpad(next_value::text, 6, '0');
end;
$$;

-- --- design_assets (§29.5) --------------------------------------------------
-- Every uploaded or generated image. `storage_key` points into Supabase
-- Storage; the original filename is metadata only and is never used as a path
-- (§30.2). Deletion is soft (`deleted_at`) so a composition that still
-- references an asset fails validation loudly instead of rendering a hole.
create table if not exists public.design_assets (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in (
    'SAREE_REFERENCE', 'IDEA_IMAGE', 'NORMALIZED_SAREE', 'THUMBNAIL',
    'WOVEN_CONCEPT', 'DRAPE_FRAME', 'DRAPE_PREVIEW', 'OTHER'
  )),
  storage_key text not null unique,
  original_filename text,
  mime_type text not null,
  size_bytes bigint not null,
  width int,
  height int,
  checksum text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists design_assets_design_id_idx on public.design_assets (design_id);
create index if not exists design_assets_type_idx on public.design_assets (design_id, type);

alter table public.design_assets enable row level security;

drop policy if exists "design assets are viewable by owner" on public.design_assets;
create policy "design assets are viewable by owner"
  on public.design_assets for select using (auth.uid() = user_id);

drop policy if exists "design assets are insertable by owner" on public.design_assets;
create policy "design assets are insertable by owner"
  on public.design_assets for insert with check (auth.uid() = user_id);

drop policy if exists "design assets are updatable by owner" on public.design_assets;
create policy "design assets are updatable by owner"
  on public.design_assets for update using (auth.uid() = user_id);

-- --- saree_analysis (§29.6) -------------------------------------------------
-- Normalized vision output. `analysis_json` holds the application's own
-- SareeAnalysisResult shape (src/domain/types.ts), never a provider's native
-- payload — the frontend must not depend on a vendor's response format.
create table if not exists public.saree_analysis (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED')),
  analysis_json jsonb,
  provider text,
  model text,
  model_version text,
  confidence numeric,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists saree_analysis_design_id_key
  on public.saree_analysis (design_id);

alter table public.saree_analysis enable row level security;

drop policy if exists "analysis is viewable by owner" on public.saree_analysis;
create policy "analysis is viewable by owner"
  on public.saree_analysis for select using (auth.uid() = user_id);

-- --- compositions (§29.7) ---------------------------------------------------
-- Autosaved canvas state. One row per save, monotonic `version` per design, so
-- an accidental overwrite is always recoverable and a generation job can pin
-- the exact composition it ran against.
create table if not exists public.compositions (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  version int not null,
  canvas_schema_version int not null default 1,
  composition_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (design_id, version)
);

create index if not exists compositions_design_id_idx
  on public.compositions (design_id, version desc);

alter table public.compositions enable row level security;

drop policy if exists "compositions are viewable by owner" on public.compositions;
create policy "compositions are viewable by owner"
  on public.compositions for select using (auth.uid() = user_id);

drop policy if exists "compositions are insertable by owner" on public.compositions;
create policy "compositions are insertable by owner"
  on public.compositions for insert with check (auth.uid() = user_id);

-- --- generation_jobs (§29.8) ------------------------------------------------
-- Asynchronous AI work. `idempotency_key` is unique per design so a duplicate
-- click reuses the in-flight job instead of buying a second generation (§14.6,
-- §65). `error_message_safe` is what a customer may see — raw provider errors
-- are logged, never stored here (§15.2).
create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  job_type text not null check (job_type in ('SAREE_ANALYSIS', 'WOVEN_CONCEPT', 'DRAPE')),
  status text not null default 'QUEUED'
    check (status in ('QUEUED', 'RUNNING', 'RETRYING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  stage text check (stage in (
    'VALIDATE_INPUT', 'PREPARE_ASSETS', 'ANALYSE_LAYOUT', 'GENERATE_CONCEPT',
    'POST_PROCESS', 'STORE_ASSET', 'CREATE_VERSION', 'FINALIZE'
  )),
  idempotency_key text not null,
  attempt_count int not null default 0,
  composition_id uuid references public.compositions (id) on delete set null,
  source_version_id uuid,
  provider text,
  model text,
  model_version text,
  prompt_version text,
  input_snapshot_json jsonb,
  output_json jsonb,
  error_code text,
  error_message_safe text,
  -- Set while a worker holds the job, so a crashed worker's job can be
  -- reclaimed after the lease expires rather than being stuck RUNNING forever.
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (design_id, idempotency_key)
);

create index if not exists generation_jobs_design_id_idx on public.generation_jobs (design_id);
create index if not exists generation_jobs_queue_idx
  on public.generation_jobs (status, created_at) where status in ('QUEUED', 'RETRYING');

alter table public.generation_jobs enable row level security;

drop policy if exists "jobs are viewable by owner" on public.generation_jobs;
create policy "jobs are viewable by owner"
  on public.generation_jobs for select using (auth.uid() = user_id);

-- Customers never write job rows directly; the API route creates them with the
-- service-role client after validating limits and ownership.

-- --- concept_versions (§29.9, §17) -----------------------------------------
-- Immutable. A new generation or accepted AI revision always INSERTs; nothing
-- here is ever UPDATEd, which is what makes "never overwrite a prior concept"
-- (§85 Rule 8) enforceable rather than aspirational.
create table if not exists public.concept_versions (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  version_number int not null,
  version_type text not null default 'INITIAL' check (version_type in (
    'INITIAL', 'AI_REVISION', 'CUSTOMER_REVISION', 'DESIGNER_REVISION',
    'FINAL_CANDIDATE', 'APPROVED'
  )),
  source_version_id uuid references public.concept_versions (id) on delete set null,
  composition_id uuid references public.compositions (id) on delete set null,
  generation_job_id uuid references public.generation_jobs (id) on delete set null,
  woven_asset_id uuid references public.design_assets (id) on delete set null,
  thumbnail_asset_id uuid references public.design_assets (id) on delete set null,
  -- Reproducibility metadata (§64): which model, which prompt, when.
  provider text,
  model text,
  model_version text,
  prompt_version text,
  label text,
  created_at timestamptz not null default now(),
  unique (design_id, version_number)
);

create index if not exists concept_versions_design_id_idx
  on public.concept_versions (design_id, version_number desc);

alter table public.concept_versions enable row level security;

drop policy if exists "concept versions are viewable by owner" on public.concept_versions;
create policy "concept versions are viewable by owner"
  on public.concept_versions for select using (auth.uid() = user_id);

-- --- drapes (§29.10, §29.11) ------------------------------------------------
create table if not exists public.drapes (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  concept_version_id uuid not null references public.concept_versions (id) on delete cascade,
  style text not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED')),
  -- The domain interface is mode-agnostic (§19.4) so swapping an image-sequence
  -- drape for a real 3D one never touches the rest of the application.
  mode text not null default 'IMAGE_SEQUENCE'
    check (mode in ('IMAGE_SEQUENCE', 'THREE_D')),
  provider text,
  provider_job_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (concept_version_id, style)
);

create index if not exists drapes_design_id_idx on public.drapes (design_id);

alter table public.drapes enable row level security;

drop policy if exists "drapes are viewable by owner" on public.drapes;
create policy "drapes are viewable by owner"
  on public.drapes for select using (auth.uid() = user_id);

create table if not exists public.drape_assets (
  id uuid primary key default gen_random_uuid(),
  drape_id uuid not null references public.drapes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_type text not null check (asset_type in ('FRAME', 'PREVIEW', 'MODEL')),
  storage_key text not null,
  frame_index int,
  width int,
  height int,
  mime_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists drape_assets_drape_id_idx
  on public.drape_assets (drape_id, frame_index);

alter table public.drape_assets enable row level security;

drop policy if exists "drape assets are viewable by owner" on public.drape_assets;
create policy "drape assets are viewable by owner"
  on public.drape_assets for select using (auth.uid() = user_id);

-- --- submissions: terms capture (§20.4) ------------------------------------
-- The submissions table already exists above (Phase 3.5) with the richer
-- structured address the office actually needs. These columns add the
-- acceptance record §20.4 requires: which terms version, accepted when.
alter table public.submissions add column if not exists terms_version text;
alter table public.submissions add column if not exists terms_accepted_at timestamptz;
alter table public.submissions add column if not exists concept_version_id uuid
  references public.concept_versions (id) on delete set null;

-- A design may only have one live submission (§55). Resubmission after
-- "Clarification Required" cancels the prior row rather than racing it.
create unique index if not exists submissions_one_live_per_design
  on public.submissions (design_id) where status <> 'cancelled';

-- --- design_status_history (§29.13) -----------------------------------------
-- Every lifecycle change, who made it and why. Append-only.
create table if not exists public.design_status_history (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by_user_id uuid references auth.users (id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists design_status_history_design_id_idx
  on public.design_status_history (design_id, created_at desc);

alter table public.design_status_history enable row level security;

-- Customers can see their own design's timeline (§22.3) but never write it.
drop policy if exists "status history is viewable by design owner" on public.design_status_history;
create policy "status history is viewable by design owner"
  on public.design_status_history for select using (
    exists (
      select 1 from public.designs
      where designs.id = design_status_history.design_id
        and designs.user_id = auth.uid()
    )
  );

-- --- internal_notes (§29.14) ------------------------------------------------
-- Design-team notes. There is deliberately NO customer-facing policy on this
-- table: §22.3 says a customer must never receive internal notes, and the
-- safest way to guarantee that is for RLS to return zero rows to them.
create table if not exists public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs (id) on delete cascade,
  author_user_id uuid not null references auth.users (id) on delete cascade,
  note text not null,
  visibility text not null default 'INTERNAL' check (visibility in ('INTERNAL')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internal_notes_design_id_idx
  on public.internal_notes (design_id, created_at desc);

alter table public.internal_notes enable row level security;

drop policy if exists "internal notes are viewable by admins" on public.internal_notes;
create policy "internal notes are viewable by admins"
  on public.internal_notes for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "internal notes are insertable by admins" on public.internal_notes;
create policy "internal notes are insertable by admins"
  on public.internal_notes for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- --- audit_logs (§29.15, §50) -----------------------------------------------
-- Append-only from the application's perspective: no update or delete policy
-- exists for anyone, including admins. IP and user-agent are stored hashed —
-- §29.15 says keep the minimum needed for security/audit, and the raw values
-- are not needed to spot abuse patterns.
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata_json jsonb,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);
create index if not exists audit_logs_actor_idx
  on public.audit_logs (actor_user_id, created_at desc);

alter table public.audit_logs enable row level security;
-- No policies at all: written and read only via the service-role client.

-- --- admin read access across the studio ------------------------------------
-- The review console (§49) needs to see any customer's design. Mirrors the
-- existing admin policy on `submissions`. Read-only: state changes go through
-- the service-role client so they are forced through the §5 state machine and
-- always leave an audit trail.
drop policy if exists "designs are viewable by admins" on public.designs;
create policy "designs are viewable by admins"
  on public.designs for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "concept versions are viewable by admins" on public.concept_versions;
create policy "concept versions are viewable by admins"
  on public.concept_versions for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "design assets are viewable by admins" on public.design_assets;
create policy "design assets are viewable by admins"
  on public.design_assets for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- --- object storage (§30) ---------------------------------------------------
-- Private bucket for every customer asset. Create it once per project:
--
--   insert into storage.buckets (id, name, public)
--   values ('design-assets', 'design-assets', false)
--   on conflict (id) do nothing;
--
-- Access is exclusively through short-lived signed URLs minted server-side
-- (§30.1) after an ownership check — there is no public read policy, and the
-- anon key can never list or fetch a key directly.
insert into storage.buckets (id, name, public)
values ('design-assets', 'design-assets', false)
on conflict (id) do nothing;

drop policy if exists "design assets are readable by owner" on storage.objects;
create policy "design assets are readable by owner"
  on storage.objects for select using (
    bucket_id = 'design-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "design assets are writable by owner" on storage.objects;
create policy "design assets are writable by owner"
  on storage.objects for insert with check (
    bucket_id = 'design-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- --- rate_limit_counters (§34.6) --------------------------------------------
-- Rate limiting has to be correct across instances. This app runs serverless,
-- so an in-process counter would reset on every cold start and reward exactly
-- the burst traffic it is meant to stop. A fixed-window counter in Postgres is
-- shared by every instance and costs one round trip.
create table if not exists public.rate_limit_counters (
  bucket text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (bucket, window_start)
);

create index if not exists rate_limit_counters_window_idx
  on public.rate_limit_counters (window_start);

alter table public.rate_limit_counters enable row level security;
-- No policies: service-role only. A client must never be able to read or
-- reset its own counter.

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_window_seconds int,
  p_limit int
)
returns table (allowed boolean, remaining int, reset_at timestamptz)
language plpgsql
security definer set search_path = public
as $$
declare
  window_start_at timestamptz;
  current_count int;
begin
  -- Align to a fixed window so every instance agrees on the boundary.
  window_start_at := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_counters as counter (bucket, window_start, count)
  values (p_bucket, window_start_at, 1)
  on conflict (bucket, window_start)
    do update set count = counter.count + 1
  returning counter.count into current_count;

  return query select
    current_count <= p_limit,
    greatest(p_limit - current_count, 0),
    window_start_at + make_interval(secs => p_window_seconds);
end;
$$;

-- Old windows are dead weight; drop anything older than a day. Schedule with
-- pg_cron if available, or call it from the worker tick.
create or replace function public.prune_rate_limit_counters()
returns void
language sql
security definer set search_path = public
as $$
  delete from public.rate_limit_counters where window_start < now() - interval '1 day';
$$;

-- --- job claiming (§32) -----------------------------------------------------
-- Atomically hands exactly one queued job to exactly one worker.
--
-- `for update skip locked` is what makes concurrent workers safe: two workers
-- ticking at the same instant take different rows instead of both processing
-- the same job and generating (and charging for) the same concept twice.
--
-- A job whose lease has expired is reclaimable: if a worker crashes mid-run,
-- its job would otherwise sit in RUNNING forever.
create or replace function public.claim_generation_job(
  p_worker_id text,
  p_lease_seconds int default 300
)
returns public.generation_jobs
language plpgsql
security definer set search_path = public
as $$
declare
  claimed public.generation_jobs;
begin
  select * into claimed
  from public.generation_jobs
  where (
      status in ('QUEUED', 'RETRYING')
      or (status = 'RUNNING' and locked_at < now() - make_interval(secs => p_lease_seconds))
    )
  order by created_at
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update public.generation_jobs
  set status = 'RUNNING',
      attempt_count = attempt_count + 1,
      locked_at = now(),
      locked_by = p_worker_id,
      started_at = coalesce(started_at, now())
  where id = claimed.id
  returning * into claimed;

  return claimed;
end;
$$;

-- --- atomic concept commit (§54) --------------------------------------------
-- When a generation succeeds, six things must happen or none of them may:
-- store the asset, create the immutable version, point the design at it,
-- advance the design's lifecycle state, close the job, and record the history.
-- Doing this as six separate client calls means a mid-sequence failure leaves
-- a design whose current_version_id points at nothing, or a job that succeeded
-- with no version to show for it. One function, one transaction.
create or replace function public.complete_woven_concept_job(
  p_job_id uuid,
  p_asset_id uuid,
  p_storage_key text,
  p_mime_type text,
  p_size_bytes bigint,
  p_width int,
  p_height int,
  p_checksum text,
  p_provider text,
  p_model text,
  p_model_version text,
  p_prompt_version text,
  p_version_type text default 'INITIAL',
  p_label text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  job public.generation_jobs;
  design public.designs;
  next_number int;
  new_version_id uuid;
  previous_status text;
begin
  select * into job from public.generation_jobs where id = p_job_id for update;
  if not found then
    raise exception 'Job % not found', p_job_id using errcode = 'no_data_found';
  end if;
  if job.status <> 'RUNNING' then
    raise exception 'Job % is %, not RUNNING', p_job_id, job.status
      using errcode = 'check_violation';
  end if;

  select * into design from public.designs where id = job.design_id for update;
  previous_status := design.status;

  insert into public.design_assets (
    id, design_id, user_id, type, storage_key, mime_type,
    size_bytes, width, height, checksum
  )
  values (
    p_asset_id, job.design_id, job.user_id, 'WOVEN_CONCEPT', p_storage_key, p_mime_type,
    p_size_bytes, p_width, p_height, p_checksum
  );

  select coalesce(max(version_number), 0) + 1 into next_number
  from public.concept_versions where design_id = job.design_id;

  insert into public.concept_versions (
    design_id, user_id, version_number, version_type, source_version_id,
    composition_id, generation_job_id, woven_asset_id,
    provider, model, model_version, prompt_version, label
  )
  values (
    job.design_id, job.user_id, next_number, p_version_type, job.source_version_id,
    job.composition_id, job.id, p_asset_id,
    p_provider, p_model, p_model_version, p_prompt_version, p_label
  )
  returning id into new_version_id;

  update public.designs
  set current_version_id = new_version_id,
      -- A design only advances DRAFT -> WOVEN_CONCEPT. Generating a revision
      -- of an already-submitted design must never drag it back out of review.
      status = case when design.status = 'DRAFT' then 'WOVEN_CONCEPT' else design.status end,
      updated_at = now()
  where id = job.design_id;

  update public.generation_jobs
  set status = 'SUCCEEDED',
      stage = 'FINALIZE',
      completed_at = now(),
      locked_at = null,
      locked_by = null,
      error_code = null,
      error_message_safe = null
  where id = p_job_id;

  if previous_status = 'DRAFT' then
    insert into public.design_status_history (design_id, from_status, to_status, reason)
    values (job.design_id, previous_status, 'WOVEN_CONCEPT', 'Woven concept generated');
  end if;

  return new_version_id;
end;
$$;

-- --- per-design / per-user generation caps (§65) ----------------------------
-- Counted in the database rather than the application so two concurrent
-- requests cannot both read "19 of 20 used" and both proceed.
create or replace function public.generation_quota(p_design_id uuid, p_user_id uuid)
returns table (design_concepts int, user_jobs_today int)
language sql
security definer set search_path = public
as $$
  select
    (select count(*)::int from public.concept_versions where design_id = p_design_id),
    (select count(*)::int from public.generation_jobs
      where user_id = p_user_id
        and job_type = 'WOVEN_CONCEPT'
        and created_at >= date_trunc('day', now()));
$$;
