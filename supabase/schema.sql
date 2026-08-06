-- =============================================================================
-- VisionFold Creative - Complete Supabase SQL Setup
-- =============================================================================
-- How to use:
-- 1) Open Supabase Dashboard > SQL Editor.
-- 2) Paste this whole file and click Run.
-- 3) In Vercel, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
-- 4) Admin login seeded below: visionfoldcreative@gmail.com / aliasgar134
-- =============================================================================

begin;

-- =============================================================================
-- TABLES
-- =============================================================================
create table if not exists public.users (
  id text primary key,
  email text not null unique,
  name text not null,
  -- Self-registered visitors are always inserted as client accounts by the app API.
  -- Admin accounts should only be created from trusted server-side/admin flows.
  role text not null default 'client' check (role in ('admin', 'client', 'editor')),
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
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed')),
  created_at text not null default now()::text
);

create table if not exists public.projects (
  id text primary key,
  title text not null,
  client_id text not null,
  client_name text not null,
  client_email text not null,
  category text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'in_review', 'delivered')),
  description text not null default '',
  delivered_files jsonb not null default '[]'::jsonb,
  results_impact text default '',
  start_date text not null default now()::text,
  delivery_date text default '',
  amount_inr integer not null default 0,
  created_at text not null default now()::text
);

create table if not exists public.revisions (
  id text primary key,
  project_id text not null,
  client_id text not null,
  client_name text not null,
  comment text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'resolved')),
  created_at text not null default now()::text,
  updated_at text not null default now()::text
);

create table if not exists public.invoices (
  id text primary key,
  invoice_number text not null unique,
  project_id text default '',
  client_id text not null,
  client_name text not null,
  amount_inr integer not null default 0,
  due_date text not null,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid', 'overdue')),
  description text not null,
  paid_at text default '',
  created_at text not null default now()::text
);

create table if not exists public.expenses (
  id text primary key,
  title text not null,
  category text not null,
  amount_inr integer not null default 0,
  date text not null,
  description text default '',
  created_at text not null default now()::text
);

create table if not exists public.settings (
  id text primary key default 'default',
  baseline_rate integer default 700,
  addon_rates jsonb default '{"render4k": 100, "multiFormat": 150, "customSound": 200}'::jsonb,
  metrics jsonb default '{"retentionSplit": "+320% Watch Time", "card1Metric": "+192% Avg Watch Duration", "card2Metric": "3.8M Views • 14k+ Saves", "card3Metric": "Featured on ArchDaily"}'::jsonb,
  updated_at text not null default now()::text
);

-- =============================================================================
-- ADMIN + SAMPLE CLIENT SEEDS
-- =============================================================================
insert into public.users (id, email, name, role, company, phone, created_at, password_hash)
values
  (
    'user_admin_01',
    'visionfoldcreative@gmail.com',
    'Aliasgar',
    'admin',
    'Vision Fold Creative',
    '+91 7725004639',
    now()::text,
    '$2b$10$EeMYFCfte3hqfmWBYMB9ueafcUkwfZKH2ZvnFLEt1tFfsQeURd2Hm'
  ),
  (
    'user_client_01',
    'client@aurastudios.com',
    'Rohan Sharma',
    'client',
    'Aura Apparel',
    '+91 9876543210',
    now()::text,
    '$2b$10$8PWVG8rzkf90hyiC2k0AgODrScOmS6dzNl9qIEhdrszI/4yrYu2O6'
  )
on conflict (email) do update set
  name = excluded.name,
  role = excluded.role,
  company = excluded.company,
  phone = excluded.phone,
  password_hash = excluded.password_hash;

-- =============================================================================
-- CMS CONTENT SEEDS USED BY THE CURRENT HOMEPAGE
-- =============================================================================
insert into public.content_blocks (id, page, section_key, type, value, "order", visible, updated_at)
values
  ('cb_home_hero_kicker', 'home', 'home_hero_kicker', 'text', to_jsonb('Premium consumer-focused video agency'::text), 1, true, now()::text),
  ('cb_home_hero_headline', 'home', 'home_hero_headline', 'text', to_jsonb('Make every scroll stop, watch, and buy.'::text), 2, true, now()::text),
  ('cb_home_hero_subline', 'home', 'home_hero_subline', 'text', to_jsonb('VisionFold Creative Studio edits high-retention short-form videos, launch creatives, and custom long-form stories for consumer brands, creators, and premium businesses.'::text), 3, true, now()::text),
  ('cb_contact_email', 'contact', 'email', 'text', to_jsonb('visionfoldcreative@gmail.com'::text), 4, true, now()::text),
  ('cb_contact_phone', 'contact', 'phone_whatsapp', 'text', to_jsonb('+91 7725004639'::text), 5, true, now()::text),
  ('cb_service_short_rate', 'services', 'short_form_rate_per_min', 'price', to_jsonb('700'::text), 6, true, now()::text),
  ('cb_service_long_rate', 'services', 'long_form_rate_per_min', 'price', to_jsonb('Custom quote in DMs'::text), 7, true, now()::text)
on conflict (page, section_key) do update set
  value = excluded.value,
  type = excluded.type,
  "order" = excluded."order",
  visible = excluded.visible,
  updated_at = now()::text;

-- =============================================================================
-- PORTFOLIO / PROJECT / INVOICE SAMPLE DATA
-- =============================================================================
insert into public.portfolio (id, title, client_name, hide_client_name, category, thumbnail_url, video_url, teaser, full_description, date_created, tools_used, results_impact, "order", featured)
values
  ('port_01', 'Viral Brand Reel — Modern Apparel Launch', 'Aura Apparel', false, 'Short Form', 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'High-retention Instagram Reel & TikTok edit with kinetic captions, pattern interrupts, and audio sync.', 'Transformed raw model and lifestyle clips into a fast-paced consumer launch showcase.', '2026-05-15', '["CapCut", "AI Audio Cleanup", "Motion Design", "Color Grading"]'::jsonb, '+340,000 views in 7 days and stronger product page click-through.', 1, true),
  ('port_02', 'Docu-Style YouTube Feature — Founder Journey', 'Nexus Tech', false, 'Long Form', 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '12-minute long-form documentary narrative featuring cinematic grading, archival B-roll, and story pacing.', 'Distilled founder interviews into a tight long-form story with clear narrative arcs.', '2026-06-02', '["Modern Storytelling", "CapCut Pro", "Audio Balancing", "Cinematic Grade"]'::jsonb, '78% average watch duration and subscriber growth.', 2, true),
  ('port_03', 'High-Convert Product Showcase — Tech Accessories', 'Velo Audio', false, 'Brand Content', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Sleek commercial video with 3D text tracking and punchy sound design.', 'Built a paid-social product spot with macro detail, speed ramps, and CTA cards.', '2026-06-20', '["Motion Graphics", "CapCut", "Sound Effects", "Pattern Interrupts"]'::jsonb, '3.2x ROAS and lower cost-per-click.', 3, true)
on conflict (id) do update set
  title = excluded.title,
  client_name = excluded.client_name,
  hide_client_name = excluded.hide_client_name,
  category = excluded.category,
  thumbnail_url = excluded.thumbnail_url,
  video_url = excluded.video_url,
  teaser = excluded.teaser,
  full_description = excluded.full_description,
  date_created = excluded.date_created,
  tools_used = excluded.tools_used,
  results_impact = excluded.results_impact,
  "order" = excluded."order",
  featured = excluded.featured;

insert into public.projects (id, title, client_id, client_name, client_email, category, status, description, delivered_files, results_impact, start_date, delivery_date, amount_inr, created_at)
values
  ('proj_01', 'Aura Apparel Summer Reel Campaign', 'user_client_01', 'Rohan Sharma', 'client@aurastudios.com', 'Short Form', 'delivered', 'Batch edit of 5 vertical short-form reels for summer collection drop.', '[{"name":"Reel_1_SummerDrop_Final.mp4","url":"https://visionfoldcreative.com/files/reel1.mp4"}]'::jsonb, 'Achieved 420K organic impressions across Instagram and TikTok.', '2026-06-01', '2026-06-10', 14000, now()::text),
  ('proj_02', 'Brand Story Interview & B-Roll Master', 'user_client_01', 'Rohan Sharma', 'client@aurastudios.com', 'Long Form', 'in_review', '8-minute brand origin story video with custom lower thirds and audio balancing.', '[{"name":"BrandStory_Draft_V2.mp4","url":"https://visionfoldcreative.com/files/brandstory_v2.mp4"}]'::jsonb, '', '2026-07-15', '', 21000, now()::text)
on conflict (id) do update set
  title = excluded.title,
  client_id = excluded.client_id,
  client_name = excluded.client_name,
  client_email = excluded.client_email,
  category = excluded.category,
  status = excluded.status,
  description = excluded.description,
  delivered_files = excluded.delivered_files,
  results_impact = excluded.results_impact,
  start_date = excluded.start_date,
  delivery_date = excluded.delivery_date,
  amount_inr = excluded.amount_inr;

insert into public.invoices (id, invoice_number, project_id, client_id, client_name, amount_inr, due_date, status, description, paid_at, created_at)
values
  ('inv_01', 'INV-2026-001', 'proj_01', 'user_client_01', 'Rohan Sharma', 14000, '2026-06-15', 'paid', 'Summer Reel Campaign - Batch of 5 Short Form Videos', '2026-06-12T14:20:00Z', now()::text),
  ('inv_02', 'INV-2026-002', 'proj_02', 'user_client_01', 'Rohan Sharma', 21000, '2026-08-10', 'unpaid', 'Brand Story Interview - Long Form Video Edit', '', now()::text)
on conflict (invoice_number) do update set
  project_id = excluded.project_id,
  client_id = excluded.client_id,
  client_name = excluded.client_name,
  amount_inr = excluded.amount_inr,
  due_date = excluded.due_date,
  status = excluded.status,
  description = excluded.description,
  paid_at = excluded.paid_at;

insert into public.revisions (id, project_id, client_id, client_name, comment, status, created_at, updated_at)
values
  ('rev_01', 'proj_02', 'user_client_01', 'Rohan Sharma', 'Please increase the background music volume slightly during the founder transition at 02:15 and slow down the text animation at 04:30.', 'in_progress', now()::text, now()::text)
on conflict (id) do update set
  comment = excluded.comment,
  status = excluded.status,
  updated_at = now()::text;

insert into public.expenses (id, title, category, amount_inr, date, description, created_at)
values
  ('exp_01', 'CapCut Pro & Motion Asset Subscriptions', 'Software/Tools', 2800, '2026-06-05', 'Monthly video editor licenses and sound effect libraries.', now()::text),
  ('exp_02', 'AI Audio Cleanup API Services', 'Software/Tools', 1200, '2026-07-02', 'Vocal isolation and noise removal software tokens.', now()::text)
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  amount_inr = excluded.amount_inr,
  date = excluded.date,
  description = excluded.description;

insert into public.settings (id, baseline_rate, addon_rates, metrics, updated_at)
values (
  'default',
  700,
  '{"render4k": 100, "multiFormat": 150, "customSound": 200}'::jsonb,
  '{"retentionSplit": "+320% Watch Time", "card1Metric": "+192% Avg Watch Duration", "card2Metric": "3.8M Views • 14k+ Saves", "card3Metric": "Featured on ArchDaily"}'::jsonb,
  now()::text
)
on conflict (id) do update set
  baseline_rate = excluded.baseline_rate,
  addon_rates = excluded.addon_rates,
  metrics = excluded.metrics,
  updated_at = now()::text;

-- =============================================================================
-- RLS + POLICIES
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

drop policy if exists "Public can view content blocks" on public.content_blocks;
drop policy if exists "Admin can manage content blocks" on public.content_blocks;
drop policy if exists "Public can view portfolio" on public.portfolio;
drop policy if exists "Admin can manage portfolio" on public.portfolio;
drop policy if exists "Anyone can submit messages" on public.messages;
drop policy if exists "Admin can view messages" on public.messages;
drop policy if exists "Admin can update messages" on public.messages;
drop policy if exists "Admin can manage users" on public.users;
drop policy if exists "Editors can view assigned work" on public.users;
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

create policy "Public can view content blocks" on public.content_blocks for select using (true);
create policy "Admin can manage content blocks" on public.content_blocks for all using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

create policy "Public can view portfolio" on public.portfolio for select using (true);
create policy "Admin can manage portfolio" on public.portfolio for all using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

create policy "Anyone can submit messages" on public.messages for insert with check (true);
create policy "Admin can view messages" on public.messages for select using (auth.jwt() ->> 'role' = 'admin');
create policy "Admin can update messages" on public.messages for update using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

create policy "Admin can manage users" on public.users for all using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "Users can view own profile" on public.users for select using (auth.uid()::text = id);
-- Public client registration is handled by /api/auth/register with the Supabase
-- service role key so raw password hashes are never accepted from browser-side
-- Supabase clients.

create policy "Admin can manage projects" on public.projects for all using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "Clients can view own projects" on public.projects for select using (auth.uid()::text = client_id);

create policy "Anyone authenticated can create revisions" on public.revisions for insert with check (auth.role() = 'authenticated');
create policy "Admin can manage revisions" on public.revisions for all using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "Clients can view own revisions" on public.revisions for select using (auth.uid()::text = client_id);

create policy "Admin can manage invoices" on public.invoices for all using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "Clients can view own invoices" on public.invoices for select using (auth.uid()::text = client_id);

create policy "Admin can manage expenses" on public.expenses for all using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');
create policy "Admin can manage settings" on public.settings for all using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- STORAGE BUCKET
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('visionfold-uploads', 'visionfold-uploads', true)
on conflict (id) do update set public = true;

-- =============================================================================
-- INDEXES
-- =============================================================================
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_content_blocks_page on public.content_blocks(page);
create index if not exists idx_content_blocks_page_section on public.content_blocks(page, section_key);
create index if not exists idx_portfolio_category on public.portfolio(category);
create index if not exists idx_portfolio_featured on public.portfolio(featured);
create index if not exists idx_messages_status on public.messages(status);
create index if not exists idx_messages_created_at on public.messages(created_at);
create index if not exists idx_projects_client_id on public.projects(client_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_revisions_project_id on public.revisions(project_id);
create index if not exists idx_revisions_client_id on public.revisions(client_id);
create index if not exists idx_invoices_client_id on public.invoices(client_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_expenses_date on public.expenses(date);

commit;

-- =============================================================================
-- QUICK CHECKS AFTER RUNNING
-- =============================================================================
-- select email, role from public.users order by created_at;
-- select count(*) as portfolio_items from public.portfolio;
-- select id, public from storage.buckets where id = 'visionfold-uploads';
