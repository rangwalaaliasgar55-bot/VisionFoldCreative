import { db } from "@/db";
import { activity, approvals, deliverables, invoices, messages, projects, ratings, updates } from "@/db/schema";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { bad, hashPassword, ok, readBody, requireClient, requestIp, verifyPassword } from "@/lib/auth";
import { originCheck } from "@/lib/security";
import { payLink } from "@/lib/paytoken";
import { formatBrief, validateBrief, type BriefAnswers } from "@/lib/intake";
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
      const [updateRows, deliverableRows, approvalRows] = projectIds.length
        ? await Promise.all([
            db.select().from(updates).where(inArray(updates.projectId, projectIds)).orderBy(sql`${updates.createdAt} desc`),
            db.select().from(deliverables).where(inArray(deliverables.projectId, projectIds)).orderBy(sql`${deliverables.createdAt} desc`),
            db.select().from(approvals).where(inArray(approvals.projectId, projectIds)).orderBy(sql`${approvals.createdAt} desc`),
          ])
        : [[], [], []];
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
        approvals: approvalRows,
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
  const csrf = originCheck(req);
  if (csrf) return csrf;
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
        .where(
          and(
            eq(ratings.clientId, client.id),
            projectId ? eq(ratings.projectId, projectId) : isNull(ratings.projectId)
          )
        )
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

    // Shareable capability link for one of the client's own invoices.
    if (action === "paylink") {
      const invoiceId = Number(body.invoiceId || 0);
      const inv = (
        await db
          .select({ id: invoices.id })
          .from(invoices)
          .where(sql`${invoices.id} = ${invoiceId} and ${invoices.clientId} = ${client.id}`)
          .limit(1)
      )[0];
      if (!inv) return bad("Invoice not found.", 404);
      return ok({ ok: true, url: payLink(inv.id) });
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
      const structured = body.answers && typeof body.answers === "object" ? (body.answers as BriefAnswers) : null;
      const title = String(body.title || structured?.title || "").trim();
      const service = String(body.service || structured?.service || "Video Editing");
      const description = String(body.description || "").trim();

      // Structured intake: one complete brief instead of three days of chasing.
      // `answers` is the new format; legacy single-field requests still work.
      let briefText = description;
      let deadline: string | null = null;
      if (structured) {
        const validation = validateBrief(structured);
        if (!validation.complete) {
          return bad(`Almost there — still needed: ${validation.missing.map((m) => m.label).join(", ")}.`);
        }
        briefText = [description, formatBrief(structured)].filter(Boolean).join("\n\n");
        const parsedDeadline = new Date(String(structured.deadline));
        if (!Number.isNaN(parsedDeadline.getTime())) {
          deadline = parsedDeadline.toISOString().slice(0, 10);
        }
      }

      if (!title) return bad("Project title is required.");

      const [newProj] = await db
        .insert(projects)
        .values({
          clientId: client.id,
          title,
          service,
          description: briefText,
          status: "intake",
          progress: 5,
          dueDate: deadline,
          budget: String(body.budget || "1500.00").replace(/[^0-9.]/g, "") || "1500.00",
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

    // Formal approval ("e-signature") of a finished project.
    if (action === "approve-project") {
      const projectId = Number(body.projectId || 0);
      const signedName = String(body.signedName || "").trim().slice(0, 120);
      const createInvoice = Boolean(body.createInvoice);
      if (!projectId || !signedName) return bad("Project and typed signature are required.");
      if (signedName.toLowerCase() !== client.name.trim().toLowerCase()) {
        return bad('Type your full name exactly as shown to sign.');
      }

      const [project] = await db
        .select()
        .from(projects)
        .where(sql`${projects.id} = ${projectId} and ${projects.clientId} = ${client.id}`)
        .limit(1);
      if (!project) return bad("Project not found.", 404);

      const [alreadyApproved] = await db
        .select({ id: approvals.id })
        .from(approvals)
        .where(eq(approvals.projectId, projectId))
        .limit(1);
      if (alreadyApproved || project.status === "completed") {
        return bad("This project is already approved.");
      }

      const ip = requestIp(req);
      const userAgent = (req.headers.get("user-agent") || "").slice(0, 250);

      // One transaction: approval record + completion + optional invoice.
      const result = await db.transaction(async (tx) => {
        await tx.insert(approvals).values({ projectId, clientId: client.id, signedName, ip, userAgent });
        await tx
          .update(projects)
          .set({ status: "completed", progress: 100, updatedAt: new Date() })
          .where(eq(projects.id, projectId));

        let invoiceCreated = false;
        if (createInvoice) {
          const existingForProject = await tx
            .select({ id: invoices.id })
            .from(invoices)
            .where(eq(invoices.projectId, projectId))
            .limit(1);
          if (!existingForProject[0]) {
            const amountNum = Number(project.budget || "1500.00") || 1500;
            await tx.insert(invoices).values({
              clientId: client.id,
              projectId,
              number: `VF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
              amount: amountNum.toFixed(2),
              status: "sent",
              dueDate: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
              notes: `Final invoice for "${project.title}" — auto-generated on approval.`,
            });
            invoiceCreated = true;
          }
        }

        await tx.insert(updates).values({
          projectId,
          title: "Master cut approved",
          body: `Digitally approved by ${signedName} on ${new Date().toDateString()}.`,
        });
        await tx.insert(messages).values({
          clientId: client.id,
          sender: "admin",
          body: `"${project.title}" is officially approved 🎉 Thank you! Your feedback means the world — a quick rating in the Activity tab would help us a lot.`,
          read: false,
        });
        return { invoiceCreated };
      });

      await db.insert(activity).values({
        actor: client.name,
        action: "project.approved",
        details: `"${project.title}" signed off by ${signedName} (${ip})`,
      });

      // Fan out: review-request automation keys off completed projects.
      const { emitEvent } = await import("@/lib/events");
      await emitEvent("project.completed", {
        id: project.id,
        title: project.title,
        clientId: client.id,
        via: "portal-approval",
      });

      return ok({ ok: true, invoiceCreated: result.invoiceCreated, signedAt: new Date().toISOString() });
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
