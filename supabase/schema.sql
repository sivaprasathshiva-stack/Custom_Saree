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
