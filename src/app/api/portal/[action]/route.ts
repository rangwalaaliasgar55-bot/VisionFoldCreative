import { db } from "@/db";
import { invoices, messages, projects, ratings, updates } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { bad, hashPassword, ok, readBody, requireClient, verifyPassword } from "@/lib/auth";
import { money } from "@/lib/utils";
import { clients } from "@/db/schema";

export const dynamic = "force-dynamic";

async function getClient() {
  const client = await requireClient();
  if (!client) throw new Error("__unauthorized__");
  return client;
}

function handle(err: unknown) {
  if (err instanceof Error && err.message === "__unauthorized__") return bad("Unauthorized", 401);
  console.error("[portal api]", err);
  return bad("Internal error", 500);
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ action: string }> }
) {
  try {
    const client = await getClient();
    const { action } = await ctx.params;

    if (action === "overview") {
      const [clientProjects, clientMessages, clientInvoices, clientRatings, updateRows] = await Promise.all([
        db.select().from(projects).where(eq(projects.clientId, client.id)).orderBy(sql`${projects.status} = 'completed'`),
        db.select().from(messages).where(eq(messages.clientId, client.id)).orderBy(messages.createdAt),
        db.select().from(invoices).where(eq(invoices.clientId, client.id)).orderBy(sql`${invoices.createdAt} desc`),
        db.select().from(ratings).where(eq(ratings.clientId, client.id)).orderBy(sql`${ratings.createdAt} desc`),
        db.select().from(updates),
      ]);
      const unread = clientMessages.filter((m) => m.sender === "admin" && !m.read).length;
      return ok({
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          company: client.company,
          phone: client.phone,
          status: client.status,
          createdAt: client.createdAt,
        },
        projects: clientProjects,
        updates: updateRows.filter((u) => clientProjects.some((p) => p.id === u.projectId)),
        messages: clientMessages,
        invoices: clientInvoices,
        ratings: clientRatings,
        unread,
      });
    }

    if (action === "messages") {
      const rows = await db
        .select()
        .from(messages)
        .where(eq(messages.clientId, client.id))
        .orderBy(messages.createdAt);
      return ok(rows);
    }

    return bad("Unknown action", 404);
  } catch (err) {
    return handle(err);
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ action: string }> }
) {
  try {
    const client = await getClient();
    const { action } = await ctx.params;
    const body = await readBody<Record<string, any>>(req);

    if (action === "message") {
      const text = String(body.body || "").trim();
      if (!text) return bad("Message is empty.");
      const row = await db
        .insert(messages)
        .values({ clientId: client.id, sender: "client", body: text, read: false })
        .returning();
      return ok(row[0]);
    }

    if (action === "read") {
      await db
        .update(messages)
        .set({ read: true })
        .where(sql`${messages.clientId} = ${client.id} and ${messages.sender} = 'admin'`);
      return ok({ ok: true });
    }

    if (action === "rating") {
      const stars = Math.max(1, Math.min(5, Number(body.stars ?? 0)));
      const comment = String(body.comment || "").trim();
      const projectId = body.projectId ? Number(body.projectId) : null;
      const existing = await db
        .select()
        .from(ratings)
        .where(sql`${ratings.clientId} = ${client.id} and ${ratings.projectId} is not distinct from ${projectId}`)
        .limit(1);
      let row;
      if (existing.length) {
        await db
          .update(ratings)
          .set({ stars, comment, visible: true })
          .where(eq(ratings.id, existing[0].id));
        row = existing[0];
      } else {
        row = (
          await db
            .insert(ratings)
            .values({ clientId: client.id, projectId, stars, comment, visible: true })
            .returning()
        )[0];
      }
      return ok(row);
    }

    if (action === "profile") {
      const name = String(body.name || client.name).trim();
      if (!name) return bad("Name is required.");
      await db
        .update(clients)
        .set({
          name,
          company: String(body.company || ""),
          phone: String(body.phone || ""),
        })
        .where(eq(clients.id, client.id));
      return ok({ ok: true, name });
    }

    if (action === "password") {
      if (!verifyPassword(String(body.current || ""), client.passwordHash)) {
        return bad("Current password is incorrect.");
      }
      const next = String(body.next || "");
      if (next.length < 6) return bad("New password must be at least 6 characters.");
      await db
        .update(clients)
        .set({ passwordHash: hashPassword(next) })
        .where(eq(clients.id, client.id));
      return ok({ ok: true });
    }

    if (action === "pay") {
      const invoiceId = Number(body.invoiceId || 0);
      const inv = (
        await db
          .select()
          .from(invoices)
          .where(sql`${invoices.id} = ${invoiceId} and ${invoices.clientId} = ${client.id}`)
          .limit(1)
      )[0];
      if (!inv) return bad("Invoice not found.", 404);
      if (inv.status === "paid") return bad("Already paid.");
      await db.update(invoices).set({ status: "paid" }).where(eq(invoices.id, inv.id));
      await db.insert(messages).values({
        clientId: client.id,
        sender: "admin",
        body: `Payment received for ${inv.number} ($${money(inv.amount)}) — thank you! Receipt sent to ${client.email}.`,
        read: false,
      });
      return ok({ ok: true });
    }

    return bad("Unknown action", 404);
  } catch (err) {
    return handle(err);
  }
}
