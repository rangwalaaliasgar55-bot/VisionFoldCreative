import { db, isMemoryDb } from "@/db";
import { bad, ok, requireStaff } from "@/lib/auth";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/system — infrastructure status for the admin shell.
 * dbMode = "memory" means NO DATABASE_URL is configured: everything the user
 * types is stored in RAM and vanishes on the next deploy/restart.
 */
export async function GET() {
  const staff = await requireStaff();
  if (!staff) return bad("Unauthorized", 401);
  try {
    await db.execute(sql`SELECT 1`);
    return ok({
      dbMode: isMemoryDb ? "memory" : "postgres",
      nodeEnv: process.env.NODE_ENV || "development",
      appUrl: process.env.APP_URL || "",
    });
  } catch {
    return ok({ dbMode: "error", nodeEnv: process.env.NODE_ENV || "development" });
  }
}
