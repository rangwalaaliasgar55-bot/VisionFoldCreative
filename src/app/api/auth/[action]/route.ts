import { bad, clearSession, loginThrottled, ok, readBody, requestIp, setSessionCookie } from "@/lib/auth";
import { db } from "@/db";
import { clients, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ action: string }> }
) {
  const { action } = await ctx.params;
  if (action === "me") {
    const { readSession } = await import("@/lib/auth");
    const session = await readSession();
    if (!session) return ok({ user: null });
    return ok({ user: session });
  }
  return bad("Unknown action", 404);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ action: string }> }
) {
  const { action } = await ctx.params;

  if (action === "logout") {
    await clearSession();
    return ok({ ok: true });
  }

  if (action === "login") {
    const body = await readBody<{ email?: string; password?: string; role?: string }>(req);
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const role = body.role === "client" ? "client" : "admin";

    if (!email || !password) return bad("Email and password are required.");
    if (loginThrottled(requestIp(req))) {
      return bad("Too many attempts. Try again in 15 minutes.", 429);
    }

    if (role === "admin") {
      const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = rows[0];
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return bad("Invalid email or password.");
      }
      await setSessionCookie({ sub: user.id, role: "admin", email: user.email, name: user.name });
      return ok({ ok: true, role: "admin", name: user.name, email: user.email });
    }

    const rows = await db.select().from(clients).where(eq(clients.email, email)).limit(1);
    const client = rows[0];
    if (!client || !verifyPassword(password, client.passwordHash)) {
      return bad("Invalid email or password.");
    }
    if (client.status !== "active") {
      return bad("This account is paused. Contact the studio.", 403);
    }
    await setSessionCookie({
      sub: client.id,
      role: "client",
      email: client.email,
      name: client.name,
    });
    return ok({ ok: true, role: "client", name: client.name, email: client.email });
  }

  return bad("Unknown action", 404);
}
