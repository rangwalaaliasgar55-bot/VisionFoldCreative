-- =============================================================================
-- VISIONFOLD — FULL SQL (settings + CMS + Review Engine R1)
-- Supabase → SQL Editor → Run entire script once
-- Safe-ish to re-run (IF NOT EXISTS / guards)
-- =============================================================================

begin;

-- ---------- Core (minimal) ----------
create table if not exists public.users (
  id text primary key,
  email text not null unique,
  name text not null,
  role text not null default 'client',
  company text default '',
  phone text default '',
  created_at text not null default now()::text,
  password_hash text
);

create table if not exists public.projects (
  id text primary key,
  title text not null,
  client_id text not null,
  client_name text not null,
  client_email text not null,
  category text not null,
  status text not null default 'in_progress',
  description text not null default '',
  delivered_files jsonb not null default '[]'::jsonb,
  results_impact text default '',
  created_at text default now()::text,
  updated_at text default now()::text
);

-- ---------- Settings (durable blob) ----------
create table if not exists public.settings (
  id text primary key default 'default',
  baseline_rate numeric default 700,
  addon_rates jsonb default '{}'::jsonb,
  metrics jsonb default '{}'::jsonb,
  updated_at text not null default now()::text,
  data jsonb not null default '{}'::jsonb
);

alter table public.settings add column if not exists baseline_rate numeric default 700;
alter table public.settings add column if not exists addon_rates jsonb default '{}'::jsonb;
alter table public.settings add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.settings add column if not exists data jsonb default '{}'::jsonb;
alter table public.settings add column if not exists updated_at text;

update public.settings set updated_at = now()::text where updated_at is null;
update public.settings set data = coalesce(data, '{}'::jsonb) where data is null;

alter table public.settings alter column updated_at set default now()::text;
alter table public.settings alter column data set default '{}'::jsonb;

do $$ begin
  alter table public.settings alter column updated_at set not null;
exception when others then null;
end $$;

do $$ begin
  alter table public.settings alter column data set not null;
exception when others then null;
end $$;

insert into public.settings (id, baseline_rate, addon_rates, metrics, updated_at, data)
values (
  'default',
  700,
  '{"render4k": 100, "customSound": 200, "multiFormat": 150}'::jsonb,
  '{}'::jsonb,
  now()::text,
  '{}'::jsonb
)
on conflict (id) do update set
  updated_at = now()::text,
  data = coalesce(public.settings.data, excluded.data, '{}'::jsonb);

-- ---------- Review engine ----------
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

create or replace function public.vf_is_admin()
returns boolean language sql stable as $$
  select coalesce((auth.jwt() ->> 'role') = 'admin', false);
$$;

create or replace function public.vf_owns_project(p_project_id text)
returns boolean language sql stable as $$
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

alter table public.media_versions enable row level security;
alter table public.annotations enable row level security;
alter table public.deliverable_approvals enable row level security;

drop policy if exists "mv_select_own" on public.media_versions;
drop policy if exists "mv_insert_admin" on public.media_versions;
drop policy if exists "mv_update_admin" on public.media_versions;
drop policy if exists "mv_delete_admin" on public.media_versions;
create policy "mv_select_own" on public.media_versions for select using (public.vf_owns_project(project_id));
create policy "mv_insert_admin" on public.media_versions for insert with check (public.vf_is_admin());
create policy "mv_update_admin" on public.media_versions for update using (public.vf_is_admin()) with check (public.vf_is_admin());
create policy "mv_delete_admin" on public.media_versions for delete using (public.vf_is_admin());

drop policy if exists "ann_select_own" on public.annotations;
drop policy if exists "ann_insert_own" on public.annotations;
drop policy if exists "ann_update_own" on public.annotations;
drop policy if exists "ann_delete_admin" on public.annotations;
create policy "ann_select_own" on public.annotations for select using (public.vf_owns_project(project_id));
create policy "ann_insert_own" on public.annotations for insert with check (public.vf_owns_project(project_id));
create policy "ann_update_own" on public.annotations for update using (public.vf_owns_project(project_id)) with check (public.vf_owns_project(project_id));
create policy "ann_delete_admin" on public.annotations for delete using (public.vf_is_admin() or public.vf_owns_project(project_id));

drop policy if exists "appr_select_own" on public.deliverable_approvals;
drop policy if exists "appr_insert_own" on public.deliverable_approvals;
drop policy if exists "appr_update_own" on public.deliverable_approvals;
create policy "appr_select_own" on public.deliverable_approvals for select using (public.vf_owns_project(project_id));
create policy "appr_insert_own" on public.deliverable_approvals for insert with check (public.vf_owns_project(project_id));
create policy "appr_update_own" on public.deliverable_approvals for update using (public.vf_owns_project(project_id)) with check (public.vf_owns_project(project_id));

commit;

-- Storage (Dashboard):
-- Bucket: visionfold-uploads · Public ON · file size limit ≥ 100MB
