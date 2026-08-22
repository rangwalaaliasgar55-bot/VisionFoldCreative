import { db } from "@/db";
import * as schema from "@/db/schema";

const TABLES = [
  "users",
  "clients",
  "projects",
  "updates",
  "messages",
  "leads",
  "portfolio",
  "invoices",
  "expenses",
  "ratings",
  "categories",
  "posts",
  "media",
  "settings",
  "automations",
  "activity",
  "quotas",
  "frameAnnotations",
  "deliverables",
  "webhooks",
  "waMessages",
  "socialAccounts",
  "socialPosts",
  "socialMetrics",
  "socialInsights",
] as const;

/** Full-facility JSON backup — password hashes & social tokens stripped. */
export async function buildBackup(): Promise<string> {
  const data: Record<string, unknown[]> = {};
  for (const name of TABLES) {
    const table = (schema as Record<string, unknown>)[name];
    if (!table) continue;
    // @ts-expect-error dynamic drizzle select — table identity verified above
    let rows = await db.select().from(table);
    rows = rows.map((row: Record<string, unknown>) => {
      const safe = { ...row };
      delete safe.passwordHash;
      delete safe.accessToken;
      delete safe.refreshToken;
      return safe;
    });
    data[name] = rows;
  }
  return JSON.stringify({ exportedAt: new Date().toISOString(), version: 1, data }, null, 2);
}
