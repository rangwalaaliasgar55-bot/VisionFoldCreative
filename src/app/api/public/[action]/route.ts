import { db } from "@/db";
import { automations, leads, newsletter } from "@/db/schema";
import { eq } from "drizzle-orm";
import { bad, ok, readBody } from "@/lib/auth";
import { automationsEnabled } from "@/lib/settings";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ action: string }> }
) {
  const { action } = await ctx.params;

  if (action === "contact") {
    const body = await readBody<Record<string, any>>(req);
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const message = String(body.message || "").trim();
    if (!name || !EMAIL_RE.test(email) || !message) {
      return bad("Please fill in your name, a valid email and a short brief.");
    }
    if (message.length < 10) return bad("Tell us a little more about the project (at least 10 characters).");

    const row = await db
      .insert(leads)
      .values({
        name,
        email,
        phone: String(body.phone || "").trim(),
        service: String(body.service || "Video Editing"),
        budget: String(body.budget || ""),
        message,
        status: "new",
        source: "website",
      })
      .returning();

    if (await automationsEnabled()) {
      const auto = (await db.select().from(automations).where(eq(automations.trigger, "lead_created")).limit(1))[0];
      if (auto?.enabled) {
        const note = (auto.config as any)?.note || "Auto-ack queued.";
        await db.update(leads).set({ notes: note }).where(eq(leads.id, row[0].id));
      }
    }

    return ok({ ok: true, leadId: row[0].id });
  }

  if (action === "newsletter") {
    const body = await readBody<{ email?: string }>(req);
    const email = String(body.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return bad("Please enter a valid email.");
    await db
      .insert(newsletter)
      .values({ email })
      .onConflictDoNothing({ target: newsletter.email });
    return ok({ ok: true });
  }

  return bad("Unknown action", 404);
}
