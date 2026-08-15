import { bad, clearSession, hashPassword, isStaffRole, loginThrottled, ok, readBody, requestIp, setSessionCookie } from "@/lib/auth";
import { db } from "@/db";
import { activity, clients, messages, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

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

  if (action === "register-client") {
    const body = await readBody<{ name?: string; email?: string; password?: string; company?: string; phone?: string }>(req);
    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
    const password = String(body.password || "");
    if (loginThrottled(`register:${requestIp(req)}`)) return bad("Too many attempts. Try again later.", 429);
    if (name.length < 2) return bad("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Enter a valid email address.");
    if (password.length < 8 || password.length > 128) return bad("Password must be between 8 and 128 characters.");
    const [existingClient, existingStaff] = await Promise.all([
      db.select({ id: clients.id }).from(clients).where(eq(clients.email, email)).limit(1),
      db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1),
    ]);
    if (existingClient.length || existingStaff.length) return bad("An account already exists for this email.", 409);
    const [client] = await db.insert(clients).values({
      name,
      email,
      passwordHash: hashPassword(password),
      company: String(body.company || "").trim().slice(0, 160),
      phone: String(body.phone || "").trim().slice(0, 40),
      status: "active",
      notes: "Self-registered through the client portal.",
    }).returning();
    await Promise.all([
      db.insert(messages).values({ clientId: client.id, sender: "admin", body: `Welcome to VisionFold, ${client.name.split(" ")[0]}! Your private workspace is ready. Submit a project brief whenever you are ready to begin.`, read: false }),
      db.insert(activity).values({ actor: client.name, action: "Client registered", details: client.email }),
    ]);
    await setSessionCookie({ sub: client.id, role: "client", email: client.email, name: client.name });
    return ok({ ok: true, role: "client", name: client.name, email: client.email }, 201);
  }

  if (action === "login") {
    await ensureSeed();
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
      if (!isStaffRole(user.role)) return bad("This account does not have staff access.", 403);
      await setSessionCookie({ sub: user.id, role: user.role, email: user.email, name: user.name });
      return ok({ ok: true, role: user.role, name: user.name, email: user.email });
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
