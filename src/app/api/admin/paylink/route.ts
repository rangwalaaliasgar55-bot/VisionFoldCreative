import { db } from "@/db";
import { invoices } from "@/db/schema";
import { bad, ok, readBody, requireStaff } from "@/lib/auth";
import { payLink } from "@/lib/paytoken";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** POST /api/admin/paylink { id } — capability URL for one invoice. */
export async function POST(req: Request) {
  const staff = await requireStaff();
  if (!staff) return bad("Unauthorized", 401);
  const body = await readBody<{ id?: number }>(req);
  const id = Number(body.id || 0);
  if (!id) return bad("Missing invoice id");
  const rows = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!rows[0]) return bad("Invoice not found", 404);
  return ok({ url: payLink(id) });
}
