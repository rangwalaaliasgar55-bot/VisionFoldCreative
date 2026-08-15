import { db } from "@/db";
import { deliverables, invoices, messages, projects, ratings, updates } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { bad, hashPassword, ok, readBody, requireClient, verifyPassword } from "@/lib/auth";
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
      const [clientProjects, clientMessages, clientInvoices, clientRatings] = await Promise.all([
        db.select().from(projects).where(eq(projects.clientId, client.id)).orderBy(sql`${projects.status} = 'completed'`),
        db.select().from(messages).where(eq(messages.clientId, client.id)).orderBy(messages.createdAt),
        db.select().from(invoices).where(eq(invoices.clientId, client.id)).orderBy(sql`${invoices.createdAt} desc`),
        db.select().from(ratings).where(eq(ratings.clientId, client.id)).orderBy(sql`${ratings.createdAt} desc`),
      ]);
      const projectIds = clientProjects.map((project) => project.id);
      const [updateRows, deliverableRows] = projectIds.length
        ? await Promise.all([
            db.select().from(updates).where(inArray(updates.projectId, projectIds)).orderBy(sql`${updates.createdAt} desc`),
            db.select().from(deliverables).where(inArray(deliverables.projectId, projectIds)).orderBy(sql`${deliverables.createdAt} desc`),
          ])
        : [[], []];
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
        updates: updateRows,
        deliverables: deliverableRows,
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
      if (text.length > 5000) return bad("Message is too long (maximum 5,000 characters).");
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
      const comment = String(body.comment || "").trim().slice(0, 2000);
      const projectId = body.projectId ? Number(body.projectId) : null;
      if (projectId) {
        const ownedProject = await db
          .select({ id: projects.id })
          .from(projects)
          .where(sql`${projects.id} = ${projectId} and ${projects.clientId} = ${client.id}`)
          .limit(1);
        if (!ownedProject.length) return bad("Project not found.", 404);
      }
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
      const name = String(body.name || client.name).trim().slice(0, 120);
      if (!name) return bad("Name is required.");
      await db
        .update(clients)
        .set({
          name,
          company: String(body.company || "").trim().slice(0, 160),
          phone: String(body.phone || "").trim().slice(0, 40),
        })
        .where(eq(clients.id, client.id));
      return ok({ ok: true, name });
    }

    if (action === "password") {
      if (!verifyPassword(String(body.current || ""), client.passwordHash)) {
        return bad("Current password is incorrect.");
      }
      const next = String(body.next || "");
      if (next.length < 8) return bad("New password must be at least 8 characters.");
      if (next.length > 128) return bad("New password is too long.");
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

      // Never mark an invoice paid from a browser click. A verified payment
      // provider webhook must perform that state transition. Until a provider
      // is connected, direct the client to a configured hosted checkout.
      const checkoutBase = process.env.PAYMENT_CHECKOUT_URL?.trim();
      if (!checkoutBase) {
        return bad("Online payment is not configured. Please contact the studio for payment instructions.", 503);
      }
      const checkout = new URL(checkoutBase);
      checkout.searchParams.set("invoice", inv.number);
      checkout.searchParams.set("amount", String(inv.amount));
      checkout.searchParams.set("client", String(client.id));
      return ok({ ok: true, checkoutUrl: checkout.toString() });
    }

    if (action === "request-project") {
      const title = String(body.title || "").trim();
      const service = String(body.service || "Video Editing");
      const description = String(body.description || "").trim();
      const budget = String(body.budget || "1500.00");
      if (!title) return bad("Project title is required.");

      const [newProj] = await db
        .insert(projects)
        .values({
          clientId: client.id,
          title,
          service,
          description,
          status: "intake",
          progress: 5,
          budget: budget.replace(/[^0-9.]/g, "") || "1500.00",
        })
        .returning();

      await db.insert(updates).values({
        projectId: newProj.id,
        title: "Intake Brief Submitted",
        body: `Client requested new project "${title}". Footage intake initiated.`,
      });

      await db.insert(messages).values({
        clientId: client.id,
        sender: "admin",
        body: `We received your request for "${title}"! We're reviewing your brief and will confirm timeline shortly.`,
        read: false,
      });

      return ok(newProj);
    }

    if (action === "project-feedback") {
      const projectId = Number(body.projectId);
      const timestamp = String(body.timestamp || "00:00");
      const feedback = String(body.feedback || "").trim();
      const approved = Boolean(body.approved);
      if (!projectId) return bad("Project ID is required.");
      const ownedProject = await db
        .select({ id: projects.id })
        .from(projects)
        .where(sql`${projects.id} = ${projectId} and ${projects.clientId} = ${client.id}`)
        .limit(1);
      if (!ownedProject.length) return bad("Project not found.", 404);
      if (!approved && !feedback) return bad("Revision feedback is required.");
      if (feedback.length > 5000) return bad("Feedback is too long (maximum 5,000 characters).");

      if (approved) {
        await db.update(projects).set({ status: "completed", progress: 100 }).where(eq(projects.id, projectId));
        await db.insert(updates).values({
          projectId,
          title: "Master Cut Approved by Client",
          body: "Client approved final master render. Project marked completed!",
        });
        await db.insert(messages).values({
          clientId: client.id,
          sender: "client",
          body: `I have approved the master cut for project #${projectId}! Outstanding work.`,
          read: true,
        });
      } else {
        await db.update(projects).set({ status: "revision" }).where(eq(projects.id, projectId));
        await db.insert(updates).values({
          projectId,
          title: `Revision Requested at ${timestamp}`,
          body: feedback,
        });
        await db.insert(messages).values({
          clientId: client.id,
          sender: "client",
          body: `[Revision Request at ${timestamp}]: ${feedback}`,
          read: true,
        });
      }

      return ok({ ok: true });
    }

    return bad("Unknown action", 404);
  } catch (err) {
    return handle(err);
  }
}
