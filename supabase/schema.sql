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

create policy "profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

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
-- The customer's current/working Studio design. Mirrors the shape of the
-- client-side SareeDesign type (src/components/studio/types.ts) — stored as
-- jsonb rather than normalized columns because the design shape is still
-- evolving and the client is the only reader/writer of its internals.
create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Untitled design',
  design jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists designs_user_id_idx on public.designs (user_id);

alter table public.designs enable row level security;

create policy "designs are viewable by owner"
  on public.designs for select
  using (auth.uid() = user_id);

create policy "designs are insertable by owner"
  on public.designs for insert
  with check (auth.uid() = user_id);

create policy "designs are updatable by owner"
  on public.designs for update
  using (auth.uid() = user_id);

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

create policy "design versions are viewable by owner"
  on public.design_versions for select
  using (auth.uid() = user_id);

create policy "design versions are insertable by owner"
  on public.design_versions for insert
  with check (auth.uid() = user_id);

create policy "design versions are deletable by owner"
  on public.design_versions for delete
  using (auth.uid() = user_id);
