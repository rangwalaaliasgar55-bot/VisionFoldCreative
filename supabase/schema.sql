-- =============================================================================
-- VisionFold Creative - Complete Supabase Database Schema
-- =============================================================================
-- Run this SQL in your Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/rbtsxeisqvrcuttfxwux/sql
-- =============================================================================

-- =============================================================================
-- TABLE: users (Admin and client accounts)
-- =============================================================================
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

-- =============================================================================
-- TABLE: content_blocks (CMS content for homepage)
-- =============================================================================
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

-- =============================================================================
-- TABLE: portfolio (Portfolio items)
-- =============================================================================
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

-- =============================================================================
-- TABLE: messages (Client inquiries)
-- =============================================================================
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

-- =============================================================================
-- TABLE: projects (Client projects)
-- =============================================================================
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

-- =============================================================================
-- TABLE: revisions (Revision requests)
-- =============================================================================
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

-- =============================================================================
-- TABLE: invoices (Billing)
-- =============================================================================
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

-- =============================================================================
-- TABLE: expenses (Business expenses)
-- =============================================================================
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
-- TABLE: settings (Site settings)
-- =============================================================================
create table if not exists public.settings (
  id text primary key default 'default',
  baseline_rate integer default 700,
  addon_rates jsonb default '{"render4k": 100, "multiFormat": 150, "customSound": 200}'::jsonb,
  metrics jsonb default '{"retentionSplit": "+320% Watch Time", "card1Metric": "+192% Avg Watch Duration", "card2Metric": "3.8M Views • 14k+ Saves", "card3Metric": "Featured on ArchDaily"}'::jsonb,
  updated_at text not null
);

-- Insert default settings
insert into public.settings (id, baseline_rate, addon_rates, metrics, updated_at)
values ('default', 700, 
  '{"render4k": 100, "multiFormat": 150, "customSound": 200}'::jsonb,
  '{"retentionSplit": "+320% Watch Time", "card1Metric": "+192% Avg Watch Duration", "card2Metric": "3.8M Views • 14k+ Saves", "card3Metric": "Featured on ArchDaily"}'::jsonb,
  now()::text
) on conflict (id) do nothing;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - Security enabled
-- NOTE: Current implementation uses service_role key which bypasses RLS.
-- These policies are for when anon key is used for client-side operations.
-- =============================================================================
alter table public.users enable row level security;
alter table public.content_blocks enable row level security;
alter table public.portfolio enable row level security;
alter table public.messages enable row level security;
alter table public.projects enable row level security;
alter table public.revisions enable row level security;
alter table public.invoices enable row level security;
alter table public.expenses enable row level security;
alter table public.settings enable row level security;

-- =============================================================================
-- RLS POLICIES
-- NOTE: The server currently uses service_role key (bypasses RLS).
-- These policies support anon key usage for client-side operations.
-- =============================================================================

-- Content blocks: Public read, admin write
create policy if not exists "Public can view content blocks"
  on public.content_blocks for select
  using (true);

create policy if not exists "Admin can manage content blocks"
  on public.content_blocks for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Portfolio: Public read, admin write
create policy if not exists "Public can view portfolio"
  on public.portfolio for select
  using (true);

create policy if not exists "Admin can manage portfolio"
  on public.portfolio for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Messages: Public create, admin read/update
create policy if not exists "Anyone can submit messages"
  on public.messages for insert
  with check (true);

create policy if not exists "Admin can view messages"
  on public.messages for select
  using (auth.jwt() ->> 'role' = 'admin');

create policy if not exists "Admin can update messages"
  on public.messages for update
  using (auth.jwt() ->> 'role' = 'admin');

-- Users: Admin can view all, users can view own
create policy if not exists "Admin can manage users"
  on public.users for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy if not exists "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- Projects: Clients can view own, admin can manage all
create policy if not exists "Admin can manage projects"
  on public.projects for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy if not exists "Clients can view own projects"
  on public.projects for select
  using (auth.uid() = client_id);

-- Revisions: Clients can create/view own, admin can manage all
create policy if not exists "Anyone authenticated can create revisions"
  on public.revisions for insert
  with check (auth.role() = 'authenticated');

create policy if not exists "Admin can manage revisions"
  on public.revisions for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy if not exists "Clients can view own revisions"
  on public.revisions for select
  using (auth.uid() = client_id);

-- Invoices: Clients can view own, admin can manage all
create policy if not exists "Admin can manage invoices"
  on public.invoices for all
  using (auth.jwt() ->> 'role' = 'admin');

create policy if not exists "Clients can view own invoices"
  on public.invoices for select
  using (auth.uid() = client_id);

-- Expenses: Admin only
create policy if not exists "Admin can manage expenses"
  on public.expenses for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Settings: Admin only
create policy if not exists "Admin can manage settings"
  on public.settings for all
  using (auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- STORAGE BUCKET FOR FILE UPLOADS
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('visionfold-uploads', 'visionfold-uploads', true)
on conflict (id) do nothing;

create policy if not exists "Public can view visionfold-uploads files"
  on storage.objects for select
  using (bucket_id = 'visionfold-uploads');

create policy if not exists "Admin can upload visionfold-uploads files"
  on storage.objects for insert
  with check (bucket_id = 'visionfold-uploads' AND auth.jwt() ->> 'role' = 'admin');

create policy if not exists "Admin can delete visionfold-uploads files"
  on storage.objects for delete
  using (bucket_id = 'visionfold-uploads' AND auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================
create index if not exists idx_messages_status on public.messages(status);
create index if not exists idx_messages_created_at on public.messages(created_at);
create index if not exists idx_projects_client_id on public.projects(client_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_revisions_project_id on public.revisions(project_id);
create index if not exists idx_invoices_client_id on public.invoices(client_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_portfolio_category on public.portfolio(category);
create index if not exists idx_portfolio_featured on public.portfolio(featured);
create index if not exists idx_content_blocks_page on public.content_blocks(page);
