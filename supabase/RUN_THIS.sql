-- =============================================================================
-- VisionFold Creative — RUN THIS ONCE in Supabase → SQL Editor → Run
-- Safe to re-run (IF NOT EXISTS / drop constraint guards).
-- =============================================================================

begin;

-- 1) Core tables (if you never ran the baseline schema)
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

create table if not exists public.content_blocks (
  id text primary key,
  page text not null,
  section_key text not null,
  type text not null,
  value jsonb not null default '{}'::jsonb,
  "order" integer not null default 0,
  visible boolean not null default true,
  updated_at text not null default now()::text,
  unique(page, section_key)
);

create table if not exists public.portfolio (
  id text primary key,
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
  name text not null,
  email text not null,
  phone text not null,
  company text default '',
  project_type text not null default 'Short Form',
  budget_range text not null default 'DM for custom quote',
  deadline text default '',
  message text not null,
  status text not null default 'new',
  created_at text not null default now()::text
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

create table if not exists public.invoices (
  id text primary key,
  project_id text,
  client_id text,
  amount numeric default 0,
  status text default 'draft',
  due_date text,
  created_at text default now()::text
);

create table if not exists public.settings (
  id text primary key default 'global',
  data jsonb not null default '{}'::jsonb,
  updated_at text default now()::text
);

-- 2) Roles: admin | client | editor | contributor
alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('admin', 'client', 'editor', 'contributor'));

-- 3) CMS pages / blocks / revisions / nav
create table if not exists public.cms_pages (
  id text primary key,
  slug text not null unique,
  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'scheduled')),
  published_at timestamptz,
  scheduled_for timestamptz,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_page_blocks (
  id text primary key,
  page_id text not null references public.cms_pages(id) on delete cascade,
  type text not null,
  "order" integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cms_page_blocks_page_order on public.cms_page_blocks(page_id, "order");

create table if not exists public.cms_page_revisions (
  id text primary key,
  page_id text not null references public.cms_pages(id) on delete cascade,
  snapshot jsonb not null,
  note text default '',
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists cms_page_revisions_page on public.cms_page_revisions(page_id, created_at desc);

create table if not exists public.cms_saved_blocks (
  id text primary key,
  name text not null,
  type text not null,
  content jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cms_nav_menus (
  id text primary key,
  name text not null unique,
  location text not null default 'header',
  created_at timestamptz not null default now()
);

create table if not exists public.cms_nav_items (
  id text primary key,
  menu_id text not null references public.cms_nav_menus(id) on delete cascade,
  parent_id text references public.cms_nav_items(id) on delete cascade,
  label text not null,
  href text not null default '/',
  "order" integer not null default 0,
  open_in_new_tab boolean not null default false
);

-- 4) Storage bucket note (run in Dashboard if API cannot create):
-- Storage → New bucket → name: visionfold-uploads → Public: ON
-- Optional file size limit: 104857600 (100MB)

commit;

-- Done. App currently stores CMS pages in settings.cmsStore as well;
-- tables above are ready when you cut over fully to Supabase rows.
