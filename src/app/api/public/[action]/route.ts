import { db } from "@/db";
import { sendAll, studioInbox } from "@/lib/email";
import { leadAutoReplyEmail, newLeadEmail } from "@/lib/emailTemplates";
import { automations, leads, newsletter } from "@/db/schema";
import { eq } from "drizzle-orm";
import { bad, loginThrottled, ok, readBody, requestIp } from "@/lib/auth";
import { automationsEnabled } from "@/lib/settings";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ action: string }> }
) {
  const { action } = await ctx.params;

  if (action === "contact") {
    // Basic spam protection: 12 submissions / 15 min / IP.
    if (loginThrottled(`contact:${requestIp(req)}`)) {
      return bad("Too many submissions. Please try again later.", 429);
    }
    const body = await readBody<Record<string, any>>(req);
    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
    const message = String(body.message || "").trim().slice(0, 5000);
    if (!name || !EMAIL_RE.test(email) || !message) {
      return bad("Please fill in your name, a valid email and a short brief.");
    }
    if (message.length < 10) return bad("Tell us a little more about the project (at least 10 characters).");

    const row = await db
      .insert(leads)
      .values({
        name,
        email,
        phone: String(body.phone || "").trim().slice(0, 40),
        service: String(body.service || "Video Editing").slice(0, 80),
        budget: String(body.budget || "").slice(0, 80),
        message,
        status: "new",
        source: "website",
      })
      .returning();

    // Tell someone. Until now a brief could sit unseen until the admin was
    // opened. Failures here must never lose the lead, so results are ignored.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://visionfoldcreative.vercel.app";
    const leadPayload = { name, email, phone: String(body.phone || ""), service: String(body.service || ""), budget: String(body.budget || ""), message };
    const studio = newLeadEmail(leadPayload, siteUrl);
    const reply = leadAutoReplyEmail(leadPayload, siteUrl);
    void sendAll([
      { to: studioInbox(), subject: studio.subject, html: studio.html, text: studio.text, replyTo: email, tag: "lead" },
      { to: email, subject: reply.subject, html: reply.html, text: reply.text, replyTo: studioInbox(), tag: "lead-autoreply" },
    ]).catch(() => undefined);

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
    if (loginThrottled(`newsletter:${requestIp(req)}`)) {
      return bad("Too many attempts. Please try again later.", 429);
    }
    const body = await readBody<{ email?: string }>(req);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
    if (!EMAIL_RE.test(email)) return bad("Please enter a valid email.");
    await db
      .insert(newsletter)
      .values({ email })
      .onConflictDoNothing({ target: newsletter.email });
    return ok({ ok: true });
  }

  return bad("Unknown action", 404);
}
