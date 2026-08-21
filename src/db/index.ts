import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { newDb } from "pg-mem";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool | any;
  __arenaNextJsDrizzleDb?: any;
  __arenaPgMemInstance?: any;
  __arenaSchemaInitialized?: boolean;
};

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Admin',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  service TEXT NOT NULL DEFAULT 'Video Editing',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_progress',
  progress INTEGER NOT NULL DEFAULT 0,
  due_date DATE,
  budget NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS updates (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  sender TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT 'Video Editing',
  budget TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Brand Film',
  description TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  project_id INTEGER,
  number TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  due_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'Software',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12, 2) NOT NULL,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  project_id INTEGER,
  stars INTEGER NOT NULL DEFAULT 5,
  comment TEXT NOT NULL DEFAULT '',
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  category_id INTEGER,
  tags TEXT NOT NULL DEFAULT '',
  featured_image TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  last_run_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS activity (
  id SERIAL PRIMARY KEY,
  actor TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id SERIAL PRIMARY KEY,
  day DATE NOT NULL UNIQUE,
  tokens INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS newsletter (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotas (
  id SERIAL PRIMARY KEY,
  storage_used_bytes NUMERIC NOT NULL DEFAULT 45800000000,
  storage_limit_bytes NUMERIC NOT NULL DEFAULT 107374182400,
  ai_tokens_used INTEGER NOT NULL DEFAULT 18500,
  ai_tokens_limit INTEGER NOT NULL DEFAULT 250000,
  render_hours_used NUMERIC NOT NULL DEFAULT 18.5,
  render_hours_limit NUMERIC NOT NULL DEFAULT 50.0,
  active_projects_limit INTEGER NOT NULL DEFAULT 20,
  alert_threshold_percent INTEGER NOT NULL DEFAULT 80,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS frame_annotations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  client_id INTEGER,
  timestamp TEXT NOT NULL DEFAULT '00:00',
  comment TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Client',
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deliverables (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'ProRes 422 HQ',
  resolution TEXT NOT NULL DEFAULT '4K UHD (3840x2160)',
  size_bytes NUMERIC NOT NULL DEFAULT 12400000000,
  download_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT NOT NULL DEFAULT 'project.completed,invoice.paid,lead.created',
  secret TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL DEFAULT '/',
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  page_views INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS wa_messages (
  id SERIAL PRIMARY KEY,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT 'inbound',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'received',
  auto_replied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  external_id TEXT NOT NULL DEFAULT '',
  access_token TEXT NOT NULL DEFAULT '',
  refresh_token TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'connected',
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_platform_ext_uq ON social_accounts (platform, external_id);

CREATE TABLE IF NOT EXISTS social_posts (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL,
  account_id INTEGER NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  portfolio_id INTEGER,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  hashtags TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  external_post_id TEXT NOT NULL DEFAULT '',
  permalink TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  seo_score INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NOT NULL DEFAULT '',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS social_posts_platform_idx ON social_posts (platform);
CREATE INDEX IF NOT EXISTS social_posts_status_idx ON social_posts (status);

CREATE TABLE IF NOT EXISTS social_metrics (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'simulated',
  captured_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS social_metrics_post_idx ON social_metrics (post_id);
CREATE INDEX IF NOT EXISTS social_metrics_captured_idx ON social_metrics (captured_at);

CREATE TABLE IF NOT EXISTS social_insights (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  day_offset INTEGER NOT NULL DEFAULT 3,
  kind TEXT NOT NULL DEFAULT 'review',
  body JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS social_insights_post_idx ON social_insights (post_id);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);
`;

function wrapQuery(origQuery: any) {
  return function (this: any, queryTextOrConfig: any, values?: any, callback?: any) {
    const text = typeof queryTextOrConfig === "string" ? queryTextOrConfig : queryTextOrConfig?.text;
    const params = Array.isArray(values)
      ? values
      : typeof queryTextOrConfig === "object"
      ? queryTextOrConfig?.values
      : [];
    const rowMode = typeof queryTextOrConfig === "object" ? queryTextOrConfig?.rowMode : undefined;
    const cb = typeof values === "function" ? values : callback;

    return new Promise((resolve, reject) => {
      origQuery.call(this, text, params, (err: any, res: any) => {
        if (err) {
          if (cb) cb(err);
          return reject(err);
        }
        if (res && rowMode === "array") {
          res.rows = res.rows.map((row: any) => (Array.isArray(row) ? row : Object.values(row)));
        }
        if (cb) cb(null, res);
        resolve(res);
      });
    });
  };
}

function createMemoryDatabase() {
  if (globalForDb.__arenaPgMemInstance) {
    return globalForDb.__arenaPgMemInstance;
  }
  const mem = newDb({ autoCreateForeignKeyIndices: true });
  mem.public.none(SCHEMA_SQL);
  globalForDb.__arenaPgMemInstance = mem;
  globalForDb.__arenaSchemaInitialized = true;
  return mem;
}

let clientPool: Pool | any;

if (databaseUrl) {
  clientPool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
    });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = clientPool;
  }
} else {
  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    const mem = createMemoryDatabase();
    const pgAdapter = mem.adapters.createPg();
    const memPool = new pgAdapter.Pool();

    memPool.query = wrapQuery(memPool.query.bind(memPool));
    const origConnect = memPool.connect.bind(memPool);
    memPool.connect = function (callback?: any) {
      return origConnect().then((client: any) => {
        if (client && !client.__wrapped) {
          client.query = wrapQuery(client.query.bind(client));
          client.__wrapped = true;
        }
        if (callback) callback(null, client, () => {});
        return client;
      });
    };
    globalForDb.__arenaNextJsPostgresqlPool = memPool;
  }
  clientPool = globalForDb.__arenaNextJsPostgresqlPool;
}

export const pool = clientPool;
export const db = drizzle(pool, { schema });

/** True when DATABASE_URL is absent and data lives in per-instance memory. */
export const isMemoryDb = !databaseUrl;
