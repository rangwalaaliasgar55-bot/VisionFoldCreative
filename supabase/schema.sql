-- =============================================================================
-- VisionFold Creative - Complete Supabase Database Schema
-- =============================================================================
-- Run this SQL in your Supabase SQL Editor to create all required tables.
-- Link: https://supabase.com/dashboard/project/rbtsxeisqvrcuttfxwux/sql
-- =============================================================================

-- =============================================================================
-- TABLE: users (Admin and client accounts)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'client',
  company text DEFAULT '',
  phone text DEFAULT '',
  created_at text NOT NULL,
  password_hash text
);

-- =============================================================================
-- TABLE: content_blocks (CMS content for homepage and other pages)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.content_blocks (
  id text PRIMARY KEY,
  page text NOT NULL,
  section_key text NOT NULL,
  type text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  "order" integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  updated_at text NOT NULL
);

-- =============================================================================
-- TABLE: portfolio (Portfolio items showcasing work)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.portfolio (
  id text PRIMARY KEY,
  title text NOT NULL,
  client_name text DEFAULT '',
  hide_client_name boolean NOT NULL DEFAULT false,
  category text NOT NULL,
  thumbnail_url text DEFAULT '',
  video_url text DEFAULT '',
  teaser text DEFAULT '',
  full_description text DEFAULT '',
  date_created text DEFAULT '',
  tools_used jsonb NOT NULL DEFAULT '[]'::jsonb,
  results_impact text DEFAULT '',
  "order" integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false
);

-- =============================================================================
-- TABLE: messages (Client inquiry messages/contact form submissions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company text DEFAULT '',
  project_type text NOT NULL DEFAULT 'Short Form',
  budget_range text NOT NULL DEFAULT '₹10,000 - ₹25,000',
  deadline text DEFAULT '',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at text NOT NULL
);

-- =============================================================================
-- TABLE: projects (Client projects with details and status)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id text PRIMARY KEY,
  title text NOT NULL,
  client_id text NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  category text NOT NULL,
  status text NOT NULL,
  description text NOT NULL,
  delivered_files jsonb DEFAULT '[]'::jsonb,
  results_impact text DEFAULT '',
  start_date text NOT NULL,
  delivery_date text DEFAULT '',
  amount_inr integer NOT NULL DEFAULT 0,
  created_at text NOT NULL
);

-- =============================================================================
-- TABLE: revisions (Project revision requests from clients)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.revisions (
  id text PRIMARY KEY,
  project_id text NOT NULL,
  client_id text NOT NULL,
  client_name text NOT NULL,
  comment text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at text NOT NULL,
  updated_at text NOT NULL
);

-- =============================================================================
-- TABLE: invoices (Billing invoices for clients)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id text PRIMARY KEY,
  invoice_number text NOT NULL,
  project_id text DEFAULT '',
  client_id text NOT NULL,
  client_name text NOT NULL,
  amount_inr integer NOT NULL DEFAULT 0,
  due_date text NOT NULL,
  status text NOT NULL DEFAULT 'unpaid',
  description text NOT NULL,
  paid_at text DEFAULT '',
  created_at text NOT NULL
);

-- =============================================================================
-- TABLE: expenses (Studio business expenses tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  amount_inr integer NOT NULL DEFAULT 0,
  date text NOT NULL,
  description text DEFAULT '',
  created_at text NOT NULL
);

-- =============================================================================
-- TABLE: settings (Site-wide settings and configuration)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id text PRIMARY KEY DEFAULT 'default',
  baseline_rate integer DEFAULT 700,
  addon_rates jsonb DEFAULT '{"render4k": 100, "multiFormat": 150, "customSound": 200}'::jsonb,
  metrics jsonb DEFAULT '{"retentionSplit": "+320% Watch Time", "card1Metric": "+192% Avg Watch Duration", "card2Metric": "3.8M Views • 14k+ Saves", "card3Metric": "Featured on ArchDaily"}'::jsonb,
  updated_at text NOT NULL
);

-- =============================================================================
-- INSERT DEFAULT SETTINGS
-- =============================================================================
INSERT INTO public.settings (id, baseline_rate, addon_rates, metrics, updated_at)
VALUES ('default', 700, 
  '{"render4k": 100, "multiFormat": 150, "customSound": 200}'::jsonb,
  '{"retentionSplit": "+320% Watch Time", "card1Metric": "+192% Avg Watch Duration", "card2Metric": "3.8M Views • 14k+ Saves", "card3Metric": "Featured on ArchDaily"}'::jsonb,
  NOW()::text
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- All application reads/writes go through the Express API (server.ts) using the
-- Supabase SERVICE ROLE key, which bypasses RLS by design. We enable RLS on all
-- tables but do NOT add permissive policies for the anon key — the browser should
-- only ever talk to /api/*, never directly to Supabase.
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- OPTIONAL: Public Read Access (Uncomment if needed)
-- =============================================================================
-- If you want public read access to portfolio and content_blocks from the
-- browser (bypassing the Express API), uncomment these policies:

-- CREATE POLICY "Public can read visible content blocks"
--   ON public.content_blocks FOR SELECT
--   USING (visible = true);

-- CREATE POLICY "Public can read portfolio"
--   ON public.portfolio FOR SELECT
--   USING (true);

-- =============================================================================
-- STORAGE BUCKET FOR FILE UPLOADS
-- =============================================================================
-- Bucket name must match SUPABASE_STORAGE_BUCKET env var (defaults to
-- "visionfold-uploads"). Set public=true so getPublicUrl() works for portfolio
-- thumbnails without needing signed URLs.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('visionfold-uploads', 'visionfold-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket for thumbnails
CREATE POLICY IF NOT EXISTS "Public can view visionfold-uploads files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'visionfold-uploads');

-- =============================================================================
-- INITIAL DATA SEED (Optional - Admin user)
-- =============================================================================
-- Uncomment and modify to create initial admin user:
-- 
-- INSERT INTO public.users (id, email, name, role, company, phone, created_at, password_hash)
-- VALUES (
--   'user_admin_01',
--   'your-admin-email@example.com',
--   'Admin Name',
--   'admin',
--   'Vision Fold Creative',
--   '+91 7725004639',
--   NOW()::text,
--   '$2a$10$YOUR_HASHED_PASSWORD_HERE'  -- Use bcrypt to hash password
-- ) ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- INDEXES FOR PERFORMANCE (Optional but recommended)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_revisions_project_id ON public.revisions(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON public.portfolio(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON public.portfolio(featured);
CREATE INDEX IF NOT EXISTS idx_content_blocks_page ON public.content_blocks(page);

-- =============================================================================
-- FINISHED!
-- =============================================================================
-- Your database is now set up and ready to use.
-- Deploy your app and set these environment variables in Vercel:
--   SUPABASE_URL=https://rbtsxeisqvrcuttfxwux.supabase.co
--   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
-- =============================================================================
