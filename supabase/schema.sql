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
  budget_range text not null default '₹10,000 - ₹25,000',
  deadline text default '',
  message text not null,
  status text not null default 'new',
  created_at text not null
);

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

create table if not exists public.expenses (
  id text primary key,
  title text not null,
  category text not null,
  amount_inr integer not null default 0,
  date text not null,
  description text default '',
  created_at text not null
);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- All application reads/writes go through the Express API (server.ts) using the
-- Supabase SERVICE ROLE key, which bypasses RLS by design. Enabling RLS with no
-- permissive policies below means the anon/public key (if it were ever used
-- directly from the browser) gets zero direct access to these tables — exactly
-- what we want, since the browser should only ever talk to /api/*, never to
-- Supabase directly.
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.content_blocks enable row level security;
alter table public.portfolio enable row level security;
alter table public.messages enable row level security;
alter table public.projects enable row level security;
alter table public.revisions enable row level security;
alter table public.invoices enable row level security;
alter table public.expenses enable row level security;

-- Exception: published content_blocks and portfolio items are meant to be public
-- marketing content. If you later add a client-side Supabase read path (bypassing
-- the Express API) for these two tables specifically, uncomment the policies below.
-- Until then, leave them commented out — the API already serves this data publicly
-- via GET /api/content and GET /api/portfolio, so no direct client access is needed.
--
-- create policy "Public can read visible content blocks"
--   on public.content_blocks for select
--   using (visible = true);
--
-- create policy "Public can read portfolio"
--   on public.portfolio for select
--   using (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded files (see src/lib/storage.ts SupabaseStorageProvider)
-- Bucket name must match SUPABASE_STORAGE_BUCKET in your .env (defaults to
-- "visionfold-uploads"). public = true so getPublicUrl() works for portfolio
-- thumbnails without needing signed URLs. Switch to a private bucket + signed URLs
-- if you later store confidential client deliverables here.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('visionfold-uploads', 'visionfold-uploads', true)
on conflict (id) do nothing;

-- The service role key already bypasses storage RLS, so the API's uploads work with
-- no further policies. This policy only matters if you want public read access to
-- the bucket's files via direct URLs (needed for getPublicUrl() to serve thumbnails).
create policy "Public can view visionfold-uploads files"
  on storage.objects for select
  using (bucket_id = 'visionfold-uploads');
