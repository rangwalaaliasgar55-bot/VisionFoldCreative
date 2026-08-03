-- =============================================================================
-- VisionFold Creative - Supabase Database Schema
-- =============================================================================
-- Run this SQL in your Supabase SQL Editor to create all required tables.
-- =============================================================================

-- Users (admin and clients)
create table if not exists public.users (
  id text primary key,
  email text not null unique,
  name text not null,
  role text not null default 'client',
  company text default '',
  phone text default '',
  created_at text not null,
  password_hash text
);

-- Content blocks for CMS
create table if not exists public.content_blocks (
  id text primary key,
  page text not null,
  section_key text not null,
  type text not null,
  value jsonb not null default '{}'::jsonb,
  "order" integer not null default 0,
  visible boolean not null default true,
  updated_at text not null
);

-- Portfolio items
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

-- Client inquiry messages
create table if not exists public.messages (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null,
  company text default '',
  project_type text not null default 'Short Form',
  budget_range text not null default '₹10,000 - ₹25,000',
  deadline text default '',
  message text not null,
  status text not null default 'new',
  created_at text not null
);

-- Projects
create table if not exists public.projects (
  id text primary key,
  title text not null,
  client_id text not null,
  client_name text not null,
  client_email text not null,
  category text not null,
  status text not null,
  description text not null,
  delivered_files jsonb default '[]'::jsonb,
  results_impact text default '',
  start_date text not null,
  delivery_date text default '',
  amount_inr integer not null default 0,
  created_at text not null
);

-- Project revisions
create table if not exists public.revisions (
  id text primary key,
  project_id text not null,
  client_id text not null,
  client_name text not null,
  comment text not null,
  status text not null default 'pending',
  created_at text not null,
  updated_at text not null
);

-- Invoices
create table if not exists public.invoices (
  id text primary key,
  invoice_number text not null,
  project_id text default '',
  client_id text not null,
  client_name text not null,
  amount_inr integer not null default 0,
  due_date text not null,
  status text not null default 'unpaid',
  description text not null,
  paid_at text default '',
  created_at text not null
);

-- Studio expenses
create table if not exists public.expenses (
  id text primary key,
  title text not null,
  category text not null,
  amount_inr integer not null default 0,
  date text not null,
  description text default '',
  created_at text not null
);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
-- All application reads/writes go through the Express API (server.ts) using the
-- Supabase SERVICE ROLE key, which bypasses RLS by design. We enable RLS on all
-- tables but do NOT add permissive policies for the anon key — the browser should
-- only ever talk to /api/*, never directly to Supabase.
-- =============================================================================

alter table public.users enable row level security;
alter table public.content_blocks enable row level security;
alter table public.portfolio enable row level security;
alter table public.messages enable row level security;
alter table public.projects enable row level security;
alter table public.revisions enable row level security;
alter table public.invoices enable row level security;
alter table public.expenses enable row level security;

-- Optional: If you want public read access to portfolio content_blocks from the
-- browser (bypassing the Express API), uncomment these policies:
--
-- create policy "Public can read visible content blocks"
--   on public.content_blocks for select
--   using (visible = true);
--
-- create policy "Public can read portfolio"
--   on public.portfolio for select
--   using (true);

-- =============================================================================
-- Storage Bucket for File Uploads
-- =============================================================================
-- Bucket name must match SUPABASE_STORAGE_BUCKET env var (defaults to
-- "visionfold-uploads"). Set public=true so getPublicUrl() works for portfolio
-- thumbnails without needing signed URLs.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('visionfold-uploads', 'visionfold-uploads', true)
on conflict (id) do nothing;

-- Allow public read access to the bucket for thumbnails
create policy "Public can view visionfold-uploads files"
  on storage.objects for select
  using (bucket_id = 'visionfold-uploads');
