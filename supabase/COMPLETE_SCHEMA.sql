-- ============================================================================
-- VisionFold Creative — COMPLETE SUPABASE SCHEMA
-- ============================================================================
-- This file matches the ACTIVE Next.js app (src/db/schema.ts / SCHEMA_SQL in
-- src/db/index.ts) 1:1. The other SQL files in this folder belong to the old
-- Vite/Express version of the app — you do NOT need them.
--
-- HOW TO RUN:
--   1. Open Supabase Dashboard -> SQL Editor -> New query
--   2. Paste this ENTIRE file
--   3. Click "Run"
--
-- SAFE TO RUN MULTIPLE TIMES: every statement is idempotent
-- (CREATE ... IF NOT EXISTS / ON CONFLICT DO NOTHING). Existing data is
-- never deleted or altered.
--
-- ALREADY HAVE TABLES FROM THE OLD VERSION OF THE APP?
-- The pre-flight block below detects tables whose shape does not match the
-- current app (e.g. "projects" with a TEXT id from the legacy app) and
-- RENAMES them to legacy_<name> first — old data is preserved, nothing is
-- dropped. You can delete the legacy_* tables later whenever you're sure
-- you don't need them.
--
-- VERIFY AFTERWARDS (should return 22 rows):
--   select tablename from pg_tables where schemaname = 'public'
--   and tablename in ('users','clients','projects','updates','messages',
--   'leads','portfolio','invoices','expenses','ratings','categories','posts',
--   'media','settings','automations','activity','ai_usage','newsletter',
--   'quotas','frame_annotations','deliverables','webhooks');
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- PRE-FLIGHT: move incompatible legacy tables out of the way (data preserved)
-- ----------------------------------------------------------------------------
do $$
declare
  tbl       text;
  idx       record;
  idtype    text;
  new_shape boolean;
  app_tables text[] := array[
    'users', 'clients', 'projects', 'updates', 'messages', 'invoices',
    'ratings', 'frame_annotations', 'deliverables', 'leads', 'portfolio',
    'categories', 'posts', 'media', 'newsletter', 'automations', 'activity',
    'ai_usage', 'expenses', 'quotas', 'webhooks', 'settings'
  ];
begin
  foreach tbl in array app_tables loop
    -- table does not exist at all -> nothing to move
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = tbl
    ) then
      continue;
    end if;

    -- Does the existing table already match the new app's shape?
    if tbl = 'settings' then
      -- new settings is key/value jsonb (no id column)
      select exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'settings'
          and column_name = 'value' and data_type = 'jsonb'
      ) into new_shape;
    else
      -- every other new table has an integer id primary key
      select data_type into idtype
      from information_schema.columns
      where table_schema = 'public' and table_name = tbl and column_name = 'id';
      new_shape := (idtype = 'integer');
    end if;

    if new_shape then
      continue;  -- already correct -> leave it untouched
    end if;

    -- Wrong shape (legacy table). If a backup already exists from a prior
    -- run, drop the old one (its data was already preserved); otherwise
    -- rename it to legacy_<name> so the data stays available.
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'legacy_' || tbl
    ) then
      execute format('drop table public.%I cascade', tbl);
    else
      execute format('alter table public.%I rename to %I', tbl, 'legacy_' || tbl);
      -- Renaming a table does NOT rename its indexes/constraint indexes
      -- (users_pkey, users_email_key, ...). Free those names so the new
      -- tables can reuse them.
      for idx in
        select indexname from pg_indexes
        where schemaname = 'public' and tablename = 'legacy_' || tbl
      loop
        if idx.indexname not like 'legacy\_%' escape '\' then
          execute format('alter index public.%I rename to %I', idx.indexname, 'legacy_' || idx.indexname);
        end if;
      end loop;
    end if;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Core auth / people
-- ----------------------------------------------------------------------------

-- Admin/staff logins for /admin
create table if not exists public.users (
  id            serial primary key,
  email         text not null unique,
  name          text not null default 'Admin',
  password_hash text not null,
  role          text not null default 'admin',
  created_at    timestamptz default now()
);

-- Client-portal accounts
create table if not exists public.clients (
  id            serial primary key,
  name          text not null,
  email         text not null unique,
  phone         text not null default '',
  company       text not null default '',
  password_hash text not null,
  status        text not null default 'active',
  notes         text not null default '',
  created_at    timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- Client portal data
-- ----------------------------------------------------------------------------

create table if not exists public.projects (
  id          serial primary key,
  client_id   integer not null references public.clients(id) on delete cascade,
  title       text not null,
  service     text not null default 'Video Editing',
  description text not null default '',
  status      text not null default 'in_progress',
  progress    integer not null default 0,
  due_date    date,
  budget      numeric(12, 2),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists projects_client_idx on public.projects (client_id);
create index if not exists projects_status_idx on public.projects (status);

create table if not exists public.updates (
  id         serial primary key,
  project_id integer not null references public.projects(id) on delete cascade,
  title      text not null,
  body       text not null default '',
  created_at timestamptz default now()
);
create index if not exists updates_project_idx on public.updates (project_id);

create table if not exists public.messages (
  id         serial primary key,
  client_id  integer not null references public.clients(id) on delete cascade,
  sender     text not null,
  body       text not null,
  read       boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists messages_client_idx on public.messages (client_id);

create table if not exists public.invoices (
  id         serial primary key,
  client_id  integer not null references public.clients(id) on delete cascade,
  project_id integer references public.projects(id) on delete set null,
  number     text not null default '',
  amount     numeric(12, 2) not null,
  status     text not null default 'sent',
  due_date   date,
  notes      text not null default '',
  created_at timestamptz default now()
);
create index if not exists invoices_client_idx on public.invoices (client_id);

create table if not exists public.ratings (
  id         serial primary key,
  client_id  integer not null references public.clients(id) on delete cascade,
  project_id integer references public.projects(id) on delete set null,
  stars      integer not null default 5,
  comment    text not null default '',
  visible    boolean not null default true,
  created_at timestamptz default now()
);
create index if not exists ratings_client_idx on public.ratings (client_id);

create table if not exists public.frame_annotations (
  id         serial primary key,
  project_id integer not null references public.projects(id) on delete cascade,
  client_id  integer references public.clients(id) on delete cascade,
  "timestamp" text not null default '00:00',
  comment    text not null,
  author     text not null default 'Client',
  resolved   boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists annotations_project_idx on public.frame_annotations (project_id);

create table if not exists public.deliverables (
  id           serial primary key,
  project_id   integer not null references public.projects(id) on delete cascade,
  name         text not null,
  format       text not null default 'ProRes 422 HQ',
  resolution   text not null default '4K UHD (3840x2160)',
  size_bytes   numeric not null default 12400000000,
  download_url text not null,
  created_at   timestamptz default now()
);
create index if not exists deliverables_project_idx on public.deliverables (project_id);

-- ----------------------------------------------------------------------------
-- Marketing site: leads, portfolio, blog, media
-- ----------------------------------------------------------------------------

create table if not exists public.leads (
  id         serial primary key,
  name       text not null,
  email      text not null,
  phone      text not null default '',
  service    text not null default 'Video Editing',
  budget     text not null default '',
  message    text not null default '',
  notes      text not null default '',
  status     text not null default 'new',
  source     text not null default 'website',
  created_at timestamptz default now()
);
create index if not exists leads_status_idx on public.leads (status);

create table if not exists public.portfolio (
  id            serial primary key,
  title         text not null,
  category      text not null default 'Brand Film',
  description   text not null default '',
  thumbnail_url text not null default '',
  video_url     text not null default '',
  year          text not null default '',
  featured      boolean not null default false,
  created_at    timestamptz default now()
);

create table if not exists public.categories (
  id   serial primary key,
  name text not null,
  slug text not null unique
);

create table if not exists public.posts (
  id              serial primary key,
  title           text not null,
  slug            text not null unique,
  excerpt         text not null default '',
  content         text not null default '',
  status          text not null default 'draft',
  category_id     integer references public.categories(id) on delete set null,
  tags            text not null default '',
  featured_image  text not null default '',
  seo_title       text not null default '',
  seo_description text not null default '',
  views           integer not null default 0,
  published_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists posts_status_idx on public.posts (status);

create table if not exists public.media (
  id         serial primary key,
  name       text not null,
  url        text not null,
  type       text not null default 'image',
  size       integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.newsletter (
  id         serial primary key,
  email      text not null unique,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- Platform internals
-- ----------------------------------------------------------------------------

-- Key-value store (site settings, CMS page store, automations config, ...)
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists public.automations (
  id          serial primary key,
  name        text not null,
  trigger     text not null,
  description text not null default '',
  enabled     boolean not null default true,
  config      jsonb not null default '{}',
  last_run_at timestamptz
);

create table if not exists public.activity (
  id         serial primary key,
  actor      text not null default 'system',
  action     text not null,
  details    text not null default '',
  created_at timestamptz default now()
);
create index if not exists activity_created_idx on public.activity (created_at);

create table if not exists public.ai_usage (
  id     serial primary key,
  day    date not null unique,
  tokens integer not null default 0
);

create table if not exists public.expenses (
  id          serial primary key,
  category    text not null default 'Software',
  description text not null default '',
  amount      numeric(12, 2) not null,
  date        date,
  created_at  timestamptz default now()
);

create table if not exists public.quotas (
  id                      serial primary key,
  storage_used_bytes      numeric not null default 45800000000,
  storage_limit_bytes     numeric not null default 107374182400, -- 100 GB
  ai_tokens_used          integer not null default 18500,
  ai_tokens_limit         integer not null default 250000,
  render_hours_used       numeric not null default 18.5,
  render_hours_limit      numeric not null default 50.0,
  active_projects_limit   integer not null default 20,
  alert_threshold_percent integer not null default 80,
  updated_at              timestamptz default now()
);

create table if not exists public.webhooks (
  id                serial primary key,
  name              text not null,
  url               text not null,
  events            text not null default 'project.completed,invoice.paid,lead.created',
  secret            text not null default '',
  active            boolean not null default true,
  last_triggered_at timestamptz,
  created_at        timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- Storage bucket used by the media library (src/lib/storage.ts)
-- The app can also auto-create this at runtime with the service-role key,
-- this insert just guarantees it exists.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('visionfold-uploads', 'visionfold-uploads', true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Row Level Security — "safe" baseline.
--
-- The Next.js app talks to Postgres directly using the connection string
-- (server-side only), which bypasses RLS, and uses the SERVICE ROLE key for
-- Storage — which also bypasses RLS. So turning RLS ON with NO public
-- policies locks the tables away from the anonymous/public API without
-- affecting the app at all.
--
-- If you later want public read access via PostgREST (anon key), add
-- per-table SELECT policies — e.g.:
--   create policy "public read published posts" on public.posts
--     for select using (status = 'published');
-- ----------------------------------------------------------------------------
alter table public.users             enable row level security;
alter table public.clients           enable row level security;
alter table public.projects          enable row level security;
alter table public.updates           enable row level security;
alter table public.messages          enable row level security;
alter table public.invoices          enable row level security;
alter table public.ratings           enable row level security;
alter table public.frame_annotations enable row level security;
alter table public.deliverables      enable row level security;
alter table public.leads             enable row level security;
alter table public.portfolio         enable row level security;
alter table public.categories        enable row level security;
alter table public.posts             enable row level security;
alter table public.media             enable row level security;
alter table public.newsletter        enable row level security;
alter table public.settings          enable row level security;
alter table public.automations       enable row level security;
alter table public.activity          enable row level security;
alter table public.ai_usage          enable row level security;
alter table public.expenses          enable row level security;
alter table public.quotas            enable row level security;
alter table public.webhooks          enable row level security;

-- ============================================================================
-- Live visitor tracking + WhatsApp automation inbox
-- ============================================================================
create table if not exists public.visitors (
  id text primary key,
  path text not null default '/',
  first_seen timestamptz default now(),
  last_seen timestamptz default now(),
  page_views integer not null default 1
);
create index if not exists visitors_last_seen_idx on public.visitors (last_seen);

create table if not exists public.wa_messages (
  id serial primary key,
  "from" text not null,
  "to" text not null default '',
  direction text not null default 'inbound',
  body text not null default '',
  status text not null default 'received',
  auto_replied boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists wa_messages_from_idx on public.wa_messages ("from");
create index if not exists wa_messages_created_idx on public.wa_messages (created_at);

-- ============================================================================
-- Social publishing (YouTube · LinkedIn): accounts, posts, metrics, insights
-- ============================================================================
create table if not exists public.social_accounts (
  id serial primary key,
  platform text not null,
  name text not null default '',
  external_id text not null default '',
  access_token text not null default '',
  refresh_token text not null default '',
  expires_at timestamptz,
  status text not null default 'connected',
  meta jsonb default '{}',
  created_at timestamptz default now()
);
create unique index if not exists social_accounts_platform_ext_uq
  on public.social_accounts (platform, external_id);

create table if not exists public.social_posts (
  id serial primary key,
  platform text not null,
  account_id integer not null references public.social_accounts(id) on delete cascade,
  portfolio_id integer,
  title text not null default '',
  description text not null default '',
  tags text not null default '',
  hashtags text not null default '',
  video_url text not null default '',
  thumbnail_url text not null default '',
  external_post_id text not null default '',
  permalink text not null default '',
  status text not null default 'draft',
  seo_score integer not null default 0,
  last_error text not null default '',
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists social_posts_platform_idx on public.social_posts (platform);
create index if not exists social_posts_status_idx on public.social_posts (status);

create table if not exists public.social_metrics (
  id serial primary key,
  post_id integer not null references public.social_posts(id) on delete cascade,
  views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  source text not null default 'simulated',
  captured_at timestamptz default now()
);
create index if not exists social_metrics_post_idx on public.social_metrics (post_id);
create index if not exists social_metrics_captured_idx on public.social_metrics (captured_at);

create table if not exists public.social_insights (
  id serial primary key,
  post_id integer not null references public.social_posts(id) on delete cascade,
  day_offset integer not null default 3,
  kind text not null default 'review',
  body jsonb not null,
  created_at timestamptz default now()
);
create index if not exists social_insights_post_idx on public.social_insights (post_id);

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);

alter table public.visitors    enable row level security;
alter table public.wa_messages enable row level security;
alter table public.social_accounts enable row level security;
alter table public.social_posts     enable row level security;
alter table public.social_metrics   enable row level security;
alter table public.social_insights  enable row level security;
alter table public.rate_limits      enable row level security;

commit;

-- ============================================================================
-- NEXT STEPS (not SQL):
--   1. In Vercel project settings, set:
--        DATABASE_URL = Supabase -> Project Settings -> Database ->
--          "Connection string" (Transaction pooler, port 6543), e.g.
--          postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
--        CRON_SECRET  = a long random string (protects /api/cron/run-scheduled)
--   2. Redeploy. The admin login is bootstrapped automatically from
--      ADMIN_EMAIL / ADMIN_PASSWORD on first use.
-- ============================================================================
