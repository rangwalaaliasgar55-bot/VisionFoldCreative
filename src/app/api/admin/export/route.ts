import { db } from "@/db";
import * as schema from "@/db/schema";
import { bad } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

/**
 * GET /api/admin/export — one-click JSON backup of every table.
 * Secrets are stripped: password hashes and social tokens never leave.
 */
export async function GET() {
  try {
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

    return new NextResponse(
      JSON.stringify({ exportedAt: new Date().toISOString(), version: 1, data }, null, 2),
      {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="visionfold-backup-${new Date()
            .toISOString()
            .slice(0, 10)}.json"`,
        },
      }
    );
  } catch {
    return bad("Export failed", 500);
  }
}
