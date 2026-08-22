import { bad, ok, requireStaff } from "@/lib/auth";
import { analyticsSnapshot } from "@/lib/tracking";

export const dynamic = "force-dynamic";

export async function GET() {
  const staff = await requireStaff(["admin", "editor"]);
  if (!staff) return bad("Unauthorized", 401);
  try {
    return ok(await analyticsSnapshot());
  } catch (err) {
    console.error("[analytics]", err);
    return ok({
      daily: [],
      topPages: [],
      referrers: [],
      campaigns: [],
      history: [],
      live: [],
      liveNow: 0,
      uniques30d: 0,
      views30d: 0,
      todayVisitors: 0,
      todayViews: 0,
      bounceRate: 0,
      avgDurationMs: 0,
    });
  }
}
