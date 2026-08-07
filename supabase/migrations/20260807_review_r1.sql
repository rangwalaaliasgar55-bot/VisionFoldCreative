-- =============================================================================
-- VisionFold Review Engine — Phase R1
-- media_versions, annotations, deliverable_approvals + RLS
-- Supabase → SQL Editor → Run
-- =============================================================================
--
-- AUDIT NOTES (existing system):
-- - public.projects exists with client_id, client_email, delivered_files jsonb
-- - Review currently also mirrored in settings.reviewStore (app-level) until R2/R3
--   cut over fully to these tables via service role
-- - App auth is custom JWT + service role on server; RLS protects any direct
--   PostgREST/anon access and matches existing projects policy style
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.media_versions (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  version_number integer not null default 1,
  storage_key text not null default '',
  playback_url text not null,
  duration_ms bigint,
  mime_type text default 'video/mp4',
  size_bytes bigint,
  status text not null default 'ready'
    check (status in ('processing', 'ready', 'failed')),
  label text default '',
  created_by text,
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

create index if not exists media_versions_project_idx
  on public.media_versions (project_id, version_number desc);

create table if not exists public.annotations (
  id text primary key,
  media_version_id text not null references public.media_versions(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  timecode_ms bigint not null check (timecode_ms >= 0),
  x numeric,
  y numeric,
  type text not null default 'comment'
    check (type in ('comment', 'drawing')),
  path_data jsonb,
  comment_text text not null default '',
  thread_id text,
  carried_from_version_id text references public.media_versions(id) on delete set null,
  carry_status text not null default 'current'
    check (carry_status in ('current', 'needs_recheck')),
  status text not null default 'open'
    check (status in ('open', 'resolved')),
  created_by text,
  created_by_name text,
  created_at timestamptz not null default now()
);

create index if not exists annotations_version_tc_idx
  on public.annotations (media_version_id, timecode_ms);

create index if not exists annotations_project_idx
  on public.annotations (project_id);

create table if not exists public.deliverable_approvals (
  media_version_id text primary key references public.media_versions(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'changes_requested', 'approved')),
  decided_by text,
  decided_at timestamptz,
  note text,
  locked boolean not null default false
);

create index if not exists deliverable_approvals_project_idx
  on public.deliverable_approvals (project_id);

-- ---------------------------------------------------------------------------
-- Helper: is current JWT an admin? (matches existing schema.sql style)
-- ---------------------------------------------------------------------------
create or replace function public.vf_is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() ->> 'role') = 'admin',
    false
  );
$$;

-- Client owns project if JWT sub/email matches project client fields
create or replace function public.vf_owns_project(p_project_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.projects pr
    where pr.id = p_project_id
      and (
        public.vf_is_admin()
        or pr.client_id = coalesce(auth.jwt() ->> 'sub', auth.jwt() ->> 'user_id', '')
        or lower(pr.client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.media_versions enable row level security;
alter table public.annotations enable row level security;
alter table public.deliverable_approvals enable row level security;

-- media_versions
drop policy if exists "mv_select_own" on public.media_versions;
drop policy if exists "mv_insert_admin" on public.media_versions;
drop policy if exists "mv_update_admin" on public.media_versions;
drop policy if exists "mv_delete_admin" on public.media_versions;

create policy "mv_select_own" on public.media_versions
  for select using (public.vf_owns_project(project_id));

create policy "mv_insert_admin" on public.media_versions
  for insert with check (public.vf_is_admin());

create policy "mv_update_admin" on public.media_versions
  for update using (public.vf_is_admin()) with check (public.vf_is_admin());

create policy "mv_delete_admin" on public.media_versions
  for delete using (public.vf_is_admin());

-- annotations: clients can read/write within owned projects; admin full
drop policy if exists "ann_select_own" on public.annotations;
drop policy if exists "ann_insert_own" on public.annotations;
drop policy if exists "ann_update_own" on public.annotations;
drop policy if exists "ann_delete_admin" on public.annotations;

create policy "ann_select_own" on public.annotations
  for select using (public.vf_owns_project(project_id));

create policy "ann_insert_own" on public.annotations
  for insert with check (public.vf_owns_project(project_id));

create policy "ann_update_own" on public.annotations
  for update using (public.vf_owns_project(project_id))
  with check (public.vf_owns_project(project_id));

create policy "ann_delete_admin" on public.annotations
  for delete using (public.vf_is_admin() or public.vf_owns_project(project_id));

-- approvals
drop policy if exists "appr_select_own" on public.deliverable_approvals;
drop policy if exists "appr_upsert_own" on public.deliverable_approvals;
drop policy if exists "appr_update_own" on public.deliverable_approvals;

create policy "appr_select_own" on public.deliverable_approvals
  for select using (public.vf_owns_project(project_id));

create policy "appr_insert_own" on public.deliverable_approvals
  for insert with check (public.vf_owns_project(project_id));

create policy "appr_update_own" on public.deliverable_approvals
  for update using (public.vf_owns_project(project_id))
  with check (public.vf_owns_project(project_id));

commit;

-- ---------------------------------------------------------------------------
-- HOW TO VERIFY RLS (manual — run as different roles in SQL editor carefully)
-- Service role bypasses RLS (expected for Express backend).
-- With anon key + a forged JWT without matching client_id, SELECT must return 0 rows.
-- App-layer test remains: routesReview assertProjectAccess rejects cross-client.
-- ---------------------------------------------------------------------------
