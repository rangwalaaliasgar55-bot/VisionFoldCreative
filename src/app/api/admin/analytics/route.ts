import { db } from "@/db";
import { visitors } from "@/db/schema";
import { bad, ok, requireStaff } from "@/lib/auth";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics — site traffic intelligence from the visitor
 * tracker, aggregated in SQL:
 *   - daily page views for the last 30 days
 *   - unique visitors (last 30d / today)
 *   - top pages by views
 */
export async function GET() {
  const staff = await requireStaff(["admin", "editor"]);
  if (!staff) return bad("Unauthorized", 401);

  try {
    const daily = await db
      .select({
        day: sql<string>`TO_CHAR(DATE(${visitors.firstSeen}), 'YYYY-MM-DD')`,
        views: sql<number>`COALESCE(SUM(${visitors.pageViews}), 0)::int`,
        visitors: sql<number>`COUNT(*)::int`,
      })
      .from(visitors)
      .where(sql`${visitors.firstSeen} > NOW() - INTERVAL '30 days'`)
      .groupBy(sql`DATE(${visitors.firstSeen})`)
      .orderBy(sql`DATE(${visitors.firstSeen})`);

    const topPages = await db
      .select({
        path: visitors.path,
        views: sql<number>`COALESCE(SUM(${visitors.pageViews}), 0)::int`,
      })
      .from(visitors)
      .groupBy(visitors.path)
      .orderBy(desc(sql`SUM(${visitors.pageViews})`))
      .limit(10);

    const [uniques] = await db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(visitors)
      .where(sql`${visitors.lastSeen} > NOW() - INTERVAL '30 days'`);

    const [today] = await db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(visitors)
      .where(sql`${visitors.lastSeen} > NOW() - INTERVAL '5 minutes'`);

    return ok({
      daily,
      topPages,
      uniques30d: uniques?.n ?? 0,
      liveNow: today?.n ?? 0,
    });
  } catch (err) {
    console.error("[analytics]", err);
    return ok({ daily: [], topPages: [], uniques30d: 0, liveNow: 0 });
  }
}
