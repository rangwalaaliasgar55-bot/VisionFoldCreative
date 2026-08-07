-- =============================================================================
-- VisionFold Creative — Phase B: Schema + RLS baseline
-- =============================================================================
-- Apply in Supabase Dashboard → SQL Editor (or supabase db push).
-- Idempotent where possible (IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- IMPORTANT ARCHITECTURE NOTE
-- ---------------------------
-- The Express API currently authenticates with app JWTs and talks to Supabase
-- using SUPABASE_SERVICE_ROLE_KEY. The service role BYPASSES RLS by design.
-- These policies protect:
--   1) Direct client access with the anon key
--   2) Future Phase C when routes use a user-scoped Supabase client
--   3) Accidental exposure of the anon key in the browser
-- Application-layer checks (clientId === user.id) remain mandatory until Phase C.
-- =============================================================================

begin;

-- Extensions
create extension if not exists "pgcrypto";

-- =============================================================================
-- ORGS (single-tenant ready; multi-org later)
-- =============================================================================
create table if not exists public.orgs (
  id text primary key default 'org_visionfold',
  name text not null default 'VisionFold Creative',
  slug text not null unique default 'visionfold',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.orgs (id, name, slug)
values ('org_visionfold', 'VisionFold Creative', 'visionfold')
on conflict (id) do update set name = excluded.name, updated_at = now();

-- =============================================================================
-- CORE TABLES (align with existing app + harden types)
-- =============================================================================
create table if not exists public.users (
  id text primary key,
  org_id text not null default 'org_visionfold' references public.orgs(id),
  email text not null unique,
  name text not null,
  role text not null default 'client' check (role in ('admin', 'client', 'editor')),
  company text default '',
  phone text default '',
  created_at timestamptz not null default now(),
  password_hash text,
  supabase_auth_uid uuid unique
);

-- Backfill columns if table already existed without them
do $$ begin
  alter table public.users add column if not exists org_id text default 'org_visionfold';
  alter table public.users add column if not exists supabase_auth_uid uuid;
exception when others then null;
end $$;

create table if not exists public.content_blocks (
  id text primary key,
  org_id text not null default 'org_visionfold' references public.orgs(id),
  page text not null,
  section_key text not null,
  type text not null,
  value jsonb not null default '{}'::jsonb,
  "order" integer not null default 0,
  visible boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(page, section_key)
);

create table if not exists public.portfolio (
  id text primary key,
  org_id text not null default 'org_visionfold' references public.orgs(id),
  title text not null,
  client_name text default '',
  hide_client_name boolean not null default false,
  category text not null,
  thumbnail_url text default '',
  video_url text default '',
  teaser text default '',
  full_description text default '',
  date_created text default '',
  tools_used jsonb not null default '[]'::jsonb,
  results_impact text default '',
  "order" integer not null default 0,
  featured boolean not null default false
);

create table if not exists public.messages (
  id text primary key,
  org_id text not null default 'org_visionfold' references public.orgs(id),
  name text not null,
  email text not null,
  phone text not null,
  company text default '',
  project_type text not null default 'Short Form',
  budget_range text not null default 'Flexible / Custom Quote',
  deadline text default '',
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed')),
  lead_score integer,
  lead_score_reason text,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table public.messages add column if not exists lead_score integer;
  alter table public.messages add column if not exists lead_score_reason text;
exception when others then null;
end $$;

create table if not exists public.projects (
  id text primary key,
  org_id text not null default 'org_visionfold' references public.orgs(id),
  title text not null,
  client_id text not null,
  client_name text not null,
  client_email text not null default '',
  category text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'in_review', 'delivered')),
  description text not null default '',
  delivered_files jsonb not null default '[]'::jsonb,
  results_impact text default '',
  start_date text not null default to_char(now(), 'YYYY-MM-DD'),
  delivery_date text default '',
  amount_inr integer not null default 0,
  studio_cost_inr integer default 0,
  health_score integer,
  created_at timestamptz not null default now()
);

do $$ begin
  alter table public.projects add column if not exists studio_cost_inr integer default 0;
  alter table public.projects add column if not exists health_score integer;
exception when others then null;
end $$;

create table if not exists public.revisions (
  id text primary key,
  org_id text not null default 'org_visionfold' references public.orgs(id),
  project_id text not null,
  client_id text not null,
  client_name text not null,
  comment text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key,
  org_id text not null default 'org_visionfold' references public.orgs(id),
  invoice_number text not null unique,
  project_id text default '',
  client_id text not null,
  client_name text not null,
  amount_inr integer not null default 0,
  due_date text not null,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid', 'overdue')),
  description text not null,
  paid_at text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key,
  org_id text not null default 'org_visionfold' references public.orgs(id),
  title text not null,
  category text not null,
  amount_inr integer not null default 0,
  date text not null,
  description text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id text primary key default 'default',
  org_id text not null default 'org_visionfold' references public.orgs(id),
  baseline_rate integer default 700,
  addon_rates jsonb default '{"render4k": 100, "multiFormat": 150, "customSound": 200}'::jsonb,
  metrics jsonb default '{}'::jsonb,
  maintenance jsonb default '{"enabled": false, "until": null, "message": ""}'::jsonb,
  outreach_leads jsonb default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table public.settings add column if not exists maintenance jsonb default '{"enabled": false}'::jsonb;
  alter table public.settings add column if not exists outreach_leads jsonb default '[]'::jsonb;
exception when others then null;
end $$;

-- Tasks (foundation for Phase K meeting-notes → tasks, voice-to-task)
create table if not exists public.tasks (
  id text primary key,
  org_id text not null default 'org_visionfold' references public.orgs(id),
  project_id text,
  title text not null,
  description text default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'blocked')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_user_id text,
  client_id text,
  due_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Audit log (immutable append-only from app perspective)
create table if not exists public.audit_logs (
  id bigserial primary key,
  org_id text not null default 'org_visionfold',
  actor_user_id text,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_org on public.users(org_id);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_content_blocks_page on public.content_blocks(page);
create index if not exists idx_content_blocks_page_section on public.content_blocks(page, section_key);
create index if not exists idx_portfolio_category on public.portfolio(category);
create index if not exists idx_portfolio_featured on public.portfolio(featured);
create index if not exists idx_messages_status on public.messages(status);
create index if not exists idx_messages_created_at on public.messages(created_at desc);
create index if not exists idx_messages_lead_score on public.messages(lead_score);
create index if not exists idx_projects_client_id on public.projects(client_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_org on public.projects(org_id);
create index if not exists idx_revisions_project_id on public.revisions(project_id);
create index if not exists idx_revisions_client_id on public.revisions(client_id);
create index if not exists idx_invoices_client_id on public.invoices(client_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_expenses_date on public.expenses(date);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_assignee on public.tasks(assignee_user_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_user_id);

-- =============================================================================
-- HELPER: map Supabase auth uid → app user role / id
-- =============================================================================
create or replace function public.app_user_id()
returns text
language sql
stable
as $$
  select coalesce(
    (select id from public.users where supabase_auth_uid = auth.uid() limit 1),
    auth.uid()::text
  );
$$;

create or replace function public.app_user_role()
returns text
language sql
stable
as $$
  select coalesce(
    (select role from public.users where supabase_auth_uid = auth.uid() limit 1),
    (auth.jwt() ->> 'role'),
    'anon'
  );
$$;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
as $$
  select public.app_user_role() = 'admin';
$$;

-- =============================================================================
-- ENABLE RLS (every table)
-- =============================================================================
alter table public.orgs enable row level security;
alter table public.users enable row level security;
alter table public.content_blocks enable row level security;
alter table public.portfolio enable row level security;
alter table public.messages enable row level security;
alter table public.projects enable row level security;
alter table public.revisions enable row level security;
alter table public.invoices enable row level security;
alter table public.expenses enable row level security;
alter table public.settings enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_logs enable row level security;

-- =============================================================================
-- DROP OLD POLICIES (names from prior schema.sql)
-- =============================================================================
drop policy if exists "Public can view content blocks" on public.content_blocks;
drop policy if exists "Admin can manage content blocks" on public.content_blocks;
drop policy if exists "Public can view portfolio" on public.portfolio;
drop policy if exists "Admin can manage portfolio" on public.portfolio;
drop policy if exists "Anyone can submit messages" on public.messages;
drop policy if exists "Admin can view messages" on public.messages;
drop policy if exists "Admin can update messages" on public.messages;
drop policy if exists "Admin can manage users" on public.users;
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Admin can manage projects" on public.projects;
drop policy if exists "Clients can view own projects" on public.projects;
drop policy if exists "Anyone authenticated can create revisions" on public.revisions;
drop policy if exists "Admin can manage revisions" on public.revisions;
drop policy if exists "Clients can view own revisions" on public.revisions;
drop policy if exists "Admin can manage invoices" on public.invoices;
drop policy if exists "Clients can view own invoices" on public.invoices;
drop policy if exists "Admin can manage expenses" on public.expenses;
drop policy if exists "Admin can manage settings" on public.settings;
drop policy if exists "Public read maintenance settings" on public.settings;
drop policy if exists "orgs_select_authenticated" on public.orgs;
drop policy if exists "orgs_admin_all" on public.orgs;
drop policy if exists "tasks_admin_all" on public.tasks;
drop policy if exists "tasks_client_select_own" on public.tasks;
drop policy if exists "audit_admin_select" on public.audit_logs;
drop policy if exists "audit_insert_authenticated" on public.audit_logs;

-- =============================================================================
-- POLICIES: orgs
-- =============================================================================
create policy "orgs_select_authenticated"
  on public.orgs for select
  using (auth.role() = 'authenticated' or public.is_app_admin());

create policy "orgs_admin_all"
  on public.orgs for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- =============================================================================
-- POLICIES: users (never expose password_hash via select to non-admin —
-- prefer a view in Phase C; for now clients only see own row)
-- =============================================================================
create policy "users_admin_all"
  on public.users for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "users_select_own"
  on public.users for select
  using (id = public.app_user_id() or supabase_auth_uid = auth.uid());

-- =============================================================================
-- POLICIES: content_blocks (public read)
-- =============================================================================
create policy "content_blocks_public_select"
  on public.content_blocks for select
  using (true);

create policy "content_blocks_admin_all"
  on public.content_blocks for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- =============================================================================
-- POLICIES: portfolio (public read)
-- =============================================================================
create policy "portfolio_public_select"
  on public.portfolio for select
  using (true);

create policy "portfolio_admin_all"
  on public.portfolio for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- =============================================================================
-- POLICIES: messages (public insert lead form; admin read/update)
-- =============================================================================
create policy "messages_public_insert"
  on public.messages for insert
  with check (true);

create policy "messages_admin_select"
  on public.messages for select
  using (public.is_app_admin());

create policy "messages_admin_update"
  on public.messages for update
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "messages_admin_delete"
  on public.messages for delete
  using (public.is_app_admin());

-- =============================================================================
-- POLICIES: projects
-- =============================================================================
create policy "projects_admin_all"
  on public.projects for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "projects_client_select_own"
  on public.projects for select
  using (client_id = public.app_user_id());

-- =============================================================================
-- POLICIES: revisions
-- =============================================================================
create policy "revisions_admin_all"
  on public.revisions for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "revisions_client_select_own"
  on public.revisions for select
  using (client_id = public.app_user_id());

create policy "revisions_client_insert_own"
  on public.revisions for insert
  with check (
    client_id = public.app_user_id()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.client_id = public.app_user_id()
    )
  );

-- =============================================================================
-- POLICIES: invoices
-- =============================================================================
create policy "invoices_admin_all"
  on public.invoices for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "invoices_client_select_own"
  on public.invoices for select
  using (client_id = public.app_user_id());

-- =============================================================================
-- POLICIES: expenses (admin only)
-- =============================================================================
create policy "expenses_admin_all"
  on public.expenses for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- =============================================================================
-- POLICIES: settings
-- =============================================================================
create policy "settings_admin_all"
  on public.settings for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- Public may read only the maintenance slice via a restricted view in Phase C;
-- for now allow select of settings row but app should not expose secrets from it.
create policy "settings_public_select"
  on public.settings for select
  using (true);

-- =============================================================================
-- POLICIES: tasks
-- =============================================================================
create policy "tasks_admin_all"
  on public.tasks for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "tasks_client_select_own"
  on public.tasks for select
  using (
    client_id = public.app_user_id()
    or assignee_user_id = public.app_user_id()
  );

-- =============================================================================
-- POLICIES: audit_logs (admin read; authenticated insert for app actors)
-- =============================================================================
create policy "audit_admin_select"
  on public.audit_logs for select
  using (public.is_app_admin());

create policy "audit_insert_authenticated"
  on public.audit_logs for insert
  with check (auth.role() = 'authenticated' or public.is_app_admin());

-- No update/delete policies on audit_logs → immutable for non-service roles

-- =============================================================================
-- STORAGE
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('visionfold-uploads', 'visionfold-uploads', true)
on conflict (id) do update set public = true;

drop policy if exists "vf_uploads_public_read" on storage.objects;
drop policy if exists "vf_uploads_admin_write" on storage.objects;
drop policy if exists "vf_uploads_admin_update" on storage.objects;
drop policy if exists "vf_uploads_admin_delete" on storage.objects;

create policy "vf_uploads_public_read"
  on storage.objects for select
  using (bucket_id = 'visionfold-uploads');

create policy "vf_uploads_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'visionfold-uploads' and public.is_app_admin());

create policy "vf_uploads_admin_update"
  on storage.objects for update
  using (bucket_id = 'visionfold-uploads' and public.is_app_admin());

create policy "vf_uploads_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'visionfold-uploads' and public.is_app_admin());

commit;

-- =============================================================================
-- POST-APPLY CHECKS (run manually)
-- =============================================================================
-- select tablename, rowsecurity from pg_tables where schemaname = 'public';
-- select * from public.orgs;
-- select policyname, tablename from pg_policies where schemaname = 'public' order by tablename;
