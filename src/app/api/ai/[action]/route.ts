import { bad, ok, readBody, requireStaff } from "@/lib/auth";
import { assist, getAiStatus, getInsights } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return ok({ ...(await getAiStatus()) });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ action: string }> }
) {
  const admin = await requireStaff(["admin", "editor"]);
  if (!admin) return bad("Unauthorized", 401);
  const { action } = await ctx.params;
  const body = await readBody<Record<string, any>>(req);

  if (action === "insights") {
    return ok(await getInsights());
  }

  if (action === "assist") {
    const kind = String(body.kind || "");
    const input = String(body.input || "");
    return ok(await assist(kind, input));
  }

  return bad("Unknown action", 404);
}
