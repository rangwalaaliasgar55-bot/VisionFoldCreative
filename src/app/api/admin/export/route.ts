import { bad } from "@/lib/auth";
import { buildBackup } from "@/lib/exportData";
import { requireStaff } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/export — one-click JSON backup of every table.
 * Secrets are stripped: password hashes and social tokens never leave.
 */
export async function GET() {
  try {
    const staff = await requireStaff();
    if (!staff) return bad("Unauthorized", 401);

    const json = await buildBackup();
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="visionfold-backup-${new Date()
          .toISOString()
          .slice(0, 10)}.json"`,
      },
    });
  } catch {
    return bad("Export failed", 500);
  }
}
