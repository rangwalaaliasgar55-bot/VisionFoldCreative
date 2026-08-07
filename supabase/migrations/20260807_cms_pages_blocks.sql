-- VisionFold CMS: pages, blocks, revisions, nav, saved blocks
-- Run in Supabase SQL Editor after Phase B baseline.

begin;

-- Extend roles for editor/contributor (optional; app still uses admin|client primarily)
do $$ begin
  alter table public.users drop constraint if exists users_role_check;
exception when undefined_object then null;
end $$;

alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
  check (role in ('admin', 'client', 'editor', 'contributor'));

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

-- Media metadata extensions (if media registry is table-based later)
-- Usage tracking can join from content jsonb paths.

commit;
