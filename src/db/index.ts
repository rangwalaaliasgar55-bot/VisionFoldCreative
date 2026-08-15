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
