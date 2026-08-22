import { pool } from "@/db";

/**
 * Additive, idempotent schema upgrades for existing Postgres databases.
 * CREATE TABLE IF NOT EXISTS does not add columns to tables that already
 * exist — these ALTERs close that gap on boot.
 */
const STATEMENTS = [
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_reasons TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR'`,
  `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS original_amount NUMERIC(12, 2)`,
  `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS original_currency TEXT NOT NULL DEFAULT 'INR'`,
  `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fx_rate NUMERIC(12, 4) NOT NULL DEFAULT 1`,
  `ALTER TABLE visitors ADD COLUMN IF NOT EXISTS referrer TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE visitors ADD COLUMN IF NOT EXISTS utm_source TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE visitors ADD COLUMN IF NOT EXISTS utm_medium TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE visitors ADD COLUMN IF NOT EXISTS utm_campaign TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE visitors ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE visitors ADD COLUMN IF NOT EXISTS duration_ms INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE visitors ADD COLUMN IF NOT EXISTS bounced BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE visitors ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false`,
  `CREATE TABLE IF NOT EXISTS page_events (
    id SERIAL PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    path TEXT NOT NULL,
    referrer TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'view',
    duration_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS page_events_visitor_idx ON page_events (visitor_id)`,
  `CREATE INDEX IF NOT EXISTS page_events_created_idx ON page_events (created_at)`,
  `CREATE INDEX IF NOT EXISTS page_events_path_idx ON page_events (path)`,
  `CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL DEFAULT 0,
    provider TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT 'New conversation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS ai_conversations_staff_idx ON ai_conversations (staff_id)`,
  `CREATE TABLE IF NOT EXISTS ai_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    provider TEXT NOT NULL DEFAULT '',
    tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS ai_messages_conversation_idx ON ai_messages (conversation_id)`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS outreach_draft TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_by TEXT NOT NULL DEFAULT ''`,
  `CREATE INDEX IF NOT EXISTS leads_score_idx ON leads (score)`,
  `CREATE INDEX IF NOT EXISTS leads_deleted_idx ON leads (deleted_at)`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS health_score INTEGER NOT NULL DEFAULT 80`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_by TEXT NOT NULL DEFAULT ''`,
  `CREATE INDEX IF NOT EXISTS clients_deleted_idx ON clients (deleted_at)`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS effort_hours INTEGER NOT NULL DEFAULT 8`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_by TEXT NOT NULL DEFAULT ''`,
  `CREATE INDEX IF NOT EXISTS projects_deleted_idx ON projects (deleted_at)`,
  `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
  `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_by TEXT NOT NULL DEFAULT ''`,
  `CREATE INDEX IF NOT EXISTS invoices_deleted_idx ON invoices (deleted_at)`,
  `ALTER TABLE media ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
  `ALTER TABLE media ADD COLUMN IF NOT EXISTS deleted_by TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_by TEXT NOT NULL DEFAULT ''`,
  `CREATE INDEX IF NOT EXISTS posts_deleted_idx ON posts (deleted_at)`,
  `CREATE TABLE IF NOT EXISTS reply_snippets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
];

let ran: Promise<void> | null = null;

export async function ensureMigrations(): Promise<void> {
  if (!ran) {
    ran = (async () => {
      for (const statement of STATEMENTS) {
        try {
          await pool.query(statement);
        } catch {
          /* column/table already exists, or pg-mem dialect quirk — safe to skip */
        }
      }
    })();
    ran.catch(() => {
      ran = null;
    });
  }
  await ran;
}
