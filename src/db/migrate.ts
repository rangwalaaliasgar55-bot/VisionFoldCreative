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
