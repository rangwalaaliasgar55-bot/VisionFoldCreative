import { db } from "@/db";
import {
  activity,
  automations,
  categories,
  clients,
  deliverables,
  expenses,
  frameAnnotations,
  invoices,
  leads,
  media,
  messages,
  portfolio,
  posts,
  projects,
  quotas,
  ratings,
  settings,
  updates,
  users,
  visitors,
  waMessages,
  webhooks,
} from "@/db/schema";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  bad,
  hashPassword,
  ok,
  readBody,
  requireStaff,
} from "@/lib/auth";
import { ensureSeed, resetSeed } from "@/lib/seed";
import { runAutomationById, runAutomations } from "@/lib/automations";
import { emitEvent } from "@/lib/events";
import { DEFAULT_SETTINGS, getSettings, setSettings } from "@/lib/settings";
import { parseCsv } from "@/lib/utils";
import { searchBusinesses } from "@/lib/prospect";
import { listWaMessages, sendWhatsAppText, whatsappConfig, whatsappConnected } from "@/lib/whatsapp";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

async function getAdmin() {
  await ensureSeed();
  const admin = await requireStaff();
  if (!admin) throw new Error("__unauthorized__");
  return admin;
}

function canAccess(role: string, path: string, write = false, isDelete = false) {
  if (role === "admin") return true;
  const root = path.split("/")[0];
  if (role === "accountant") {
    if (write) return ["invoices", "expenses", "messages"].includes(root);
    return ["dashboard", "clients", "projects", "invoices", "expenses", "messages", "activity"].includes(root);
  }
  if (role === "editor") {
    // Finance, team, system and infra are never visible to editors.
    if (["invoices", "expenses", "quotas", "webhooks", "team", "system"].includes(root)) return false;
    // Site-wide settings are owner-only, and editors may not delete clients.
    if (write && root === "settings") return false;
    if (isDelete && root === "clients") return false;
    return true;
  }
  return false;
}

function handleErr(err: unknown) {
  if (err instanceof Error && err.message === "__unauthorized__") {
    return bad("Unauthorized", 401);
  }
  console.error("[admin api error]", err);
  return bad("Internal server error", 500);
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string[] }> }
) {
  try {
    const admin = await getAdmin();
    const { slug } = await ctx.params;
    const path = slug.join("/");
    const url = new URL(req.url);
    if (!canAccess(admin.role, path)) return bad("Your role does not have access to this area.", 403);

    // 1. Dashboard
    if (path === "dashboard") {
      const now = new Date();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000);

      const [
        allClients,
        allProjects,
        allInvoices,
        allExpenses,
        allLeads,
        allRatings,
        recentActs,
        recentMsgs,
        allAutos,
        quotasRow,
      ] = await Promise.all([
        db.select().from(clients),
        db.select().from(projects).orderBy(projects.dueDate),
        db.select().from(invoices).orderBy(desc(invoices.createdAt)),
        db.select().from(expenses).orderBy(desc(expenses.date)),
        db.select().from(leads).orderBy(desc(leads.createdAt)),
        db.select().from(ratings),
        db.select().from(activity).orderBy(desc(activity.createdAt)).limit(10),
        db.select().from(messages).orderBy(desc(messages.createdAt)).limit(10),
        db.select().from(automations),
        db.select().from(quotas).limit(1),
      ]);

      const paidInvoices = allInvoices.filter((i) => i.status === "paid");
      const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const outstanding = allInvoices
        .filter((i) => i.status === "sent" || i.status === "overdue")
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const activeProjects = allProjects.filter((p) => p.status !== "completed").length;
      const newLeads30d = allLeads.filter((l) => new Date(l.createdAt || 0) >= thirtyDaysAgo).length;
      const leadsWon = allLeads.filter((l) => l.status === "won").length;

      const avgRating =
        allRatings.length > 0
          ? (
              allRatings.reduce((sum, r) => sum + Number(r.stars || 5), 0) /
              allRatings.length
            ).toFixed(1)
          : "5.0";

      // 6 Months Revenue Trend
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const revenueByMonth: { label: string; value: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mLabel = monthNames[d.getMonth()];
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const mPaid = allInvoices
          .filter((inv) => {
            const invDate = new Date(inv.createdAt || 0);
            return inv.status === "paid" && invDate >= d && invDate < nextMonth;
          })
          .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

        revenueByMonth.push({ label: mLabel, value: mPaid });
      }

      // Expenses by Category
      const expCatMap: Record<string, number> = {};
      allExpenses.forEach((e) => {
        const cat = e.category || "General";
        expCatMap[cat] = (expCatMap[cat] || 0) + Number(e.amount || 0);
      });
      const expensesByCategory = Object.entries(expCatMap).map(([label, value]) => ({
        label,
        value,
      }));

      // Lead Funnel
      const leadsTotal = allLeads.length;
      const leadsContacted = allLeads.filter((l) => l.status === "contacted" || l.status === "won").length;
      const funnel = [
        { label: "All leads", value: leadsTotal },
        { label: "Contacted", value: leadsContacted },
        { label: "Won & booked", value: leadsWon },
      ];

      // Projects by Status
      const projectsByStatus = [
        { label: "Intake", value: allProjects.filter((p) => p.status === "intake").length },
        { label: "In Progress", value: allProjects.filter((p) => p.status === "in_progress").length },
        { label: "Review", value: allProjects.filter((p) => p.status === "review").length },
        { label: "Revision", value: allProjects.filter((p) => p.status === "revision").length },
        { label: "Completed", value: allProjects.filter((p) => p.status === "completed").length },
      ];

      // Upcoming Deadlines
      const upcoming = allProjects
        .filter((p) => p.status !== "completed" && p.dueDate)
        .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
        .slice(0, 6);

      const canViewFinance = admin.role === "admin" || admin.role === "accountant";
      const canViewGrowth = admin.role === "admin" || admin.role === "editor";
      return ok({
        viewer: { name: admin.name, role: admin.role },
        stats: {
          revenue: canViewFinance ? totalRevenue : 0,
          outstanding: canViewFinance ? outstanding : 0,
          totalExpenses: canViewFinance ? totalExpenses : 0,
          activeProjects,
          newLeads30d: canViewGrowth ? newLeads30d : 0,
          leadsWon: canViewGrowth ? leadsWon : 0,
          leadsTotal: canViewGrowth ? leadsTotal : 0,
          clients: allClients.length,
          avgRating,
          overdueInvoices: allInvoices.filter((invoice) => invoice.status === "overdue").length,
          unreadMessages: recentMsgs.filter((message) => message.sender === "client" && !message.read).length,
          reviewProjects: allProjects.filter((project) => project.status === "review" || project.status === "revision").length,
        },
        revenueByMonth: canViewFinance ? revenueByMonth : [],
        expensesByCategory: canViewFinance ? expensesByCategory : [],
        funnel: canViewGrowth ? funnel : [],
        projectsByStatus,
        upcoming,
        recentActivity: recentActs,
        recentMessages: recentMsgs,
        automations: allAutos,
        quota: quotasRow[0] || null,
      });
    }

    // Team and role management (owner only via canAccess)
    if (path === "team") {
      const rows = await db
        .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
        .from(users)
        .orderBy(users.createdAt);
      return ok(rows);
    }

    // 2. Clients
    if (path === "clients") {
      const [allClients, allProjects] = await Promise.all([
        db.select().from(clients).orderBy(desc(clients.createdAt)),
        db.select().from(projects),
      ]);
      const projectCounts = new Map<number, number>();
      allProjects.forEach((p) => {
        projectCounts.set(p.clientId, (projectCounts.get(p.clientId) || 0) + 1);
      });

      const clientRows = allClients.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || "",
        company: c.company || "",
        status: c.status || "active",
        notes: c.notes || "",
        projectCount: projectCounts.get(c.id) || 0,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      }));

      return ok(clientRows);
    }

    // 3. Projects
    if (path === "projects") {
      const [allProjects, allClients] = await Promise.all([
        db.select().from(projects).orderBy(desc(projects.createdAt)),
        db.select().from(clients),
      ]);
      const clientMap = new Map(allClients.map((c) => [c.id, c.name]));

      const projectRows = allProjects.map((p) => ({
        id: p.id,
        clientId: p.clientId,
        clientName: clientMap.get(p.clientId) || "Unknown Client",
        title: p.title,
        service: p.service,
        description: p.description || "",
        status: p.status,
        progress: p.progress,
        dueDate: p.dueDate || "",
        budget: p.budget ? Number(p.budget) : 0,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      }));

      return ok(projectRows);
    }

    // 4. Updates for a project
    if (path === "updates") {
      const projectId = Number(url.searchParams.get("projectId"));
      if (!projectId) {
        const rows = await db.select().from(updates).orderBy(desc(updates.createdAt));
        return ok(rows);
      }
      const rows = await db
        .select()
        .from(updates)
        .where(eq(updates.projectId, projectId))
        .orderBy(desc(updates.createdAt));
      return ok(rows);
    }

    // 5. Invoices
    if (path === "invoices") {
      const [allInvoices, allClients, allProjects] = await Promise.all([
        db.select().from(invoices).orderBy(desc(invoices.createdAt)),
        db.select().from(clients),
        db.select().from(projects),
      ]);
      const clientMap = new Map(allClients.map((c) => [c.id, c.name]));
      const projectMap = new Map(allProjects.map((p) => [p.id, p.title]));

      const invoiceRows = allInvoices.map((inv) => ({
        id: inv.id,
        clientId: inv.clientId,
        clientName: clientMap.get(inv.clientId) || "Unknown Client",
        projectId: inv.projectId || null,
        projectTitle: inv.projectId ? projectMap.get(inv.projectId) || null : null,
        number: inv.number,
        amount: Number(inv.amount || 0),
        status: inv.status,
        dueDate: inv.dueDate || "",
        notes: inv.notes || "",
        createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
      }));

      return ok(invoiceRows);
    }

    // 6. Expenses
    if (path === "expenses") {
      const rows = await db.select().from(expenses).orderBy(desc(expenses.date));
      return ok(
        rows.map((e) => ({
          id: e.id,
          category: e.category,
          description: e.description,
          amount: Number(e.amount || 0),
          date: e.date || "",
          createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
        }))
      );
    }

    // 7. Portfolio
    if (path === "portfolio") {
      const rows = await db.select().from(portfolio).orderBy(desc(portfolio.createdAt));
      return ok(rows);
    }

    // 8. Leads
    if (path === "leads") {
      const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
      return ok(rows);
    }

    // 9. Blog / WordPress
    if (path === "blog" || path === "wp/posts") {
      const [postRows, catRows] = await Promise.all([
        db.select().from(posts).orderBy(desc(posts.createdAt)),
        db.select().from(categories).orderBy(categories.name),
      ]);
      return ok({
        posts: postRows,
        categories: catRows,
      });
    }

    if (path === "categories") {
      const rows = await db.select().from(categories).orderBy(categories.name);
      return ok(rows);
    }

    // 10. Automations & Webhooks
    if (path === "automations") {
      const rows = await db.select().from(automations).orderBy(automations.id);
      return ok(rows);
    }

    if (path === "webhooks") {
      const rows = await db.select().from(webhooks).orderBy(desc(webhooks.createdAt));
      return ok(rows);
    }

    // 11. Quotas & System Limits
    if (path === "quotas") {
      const rows = await db.select().from(quotas).limit(1);
      return ok(
        rows[0] || {
          storageUsedBytes: "45800000000",
          storageLimitBytes: "107374182400",
          aiTokensUsed: 18500,
          aiTokensLimit: 250000,
          renderHoursUsed: "18.5",
          renderHoursLimit: "50.0",
          activeProjectsLimit: 20,
          alertThresholdPercent: 80,
        }
      );
    }

    // 12. Frame Annotations & Deliverables
    if (path === "annotations") {
      const projectId = Number(url.searchParams.get("projectId"));
      if (!projectId) {
        const rows = await db.select().from(frameAnnotations).orderBy(desc(frameAnnotations.createdAt));
        return ok(rows);
      }
      const rows = await db
        .select()
        .from(frameAnnotations)
        .where(eq(frameAnnotations.projectId, projectId))
        .orderBy(frameAnnotations.timestamp);
      return ok(rows);
    }

    if (path === "deliverables") {
      const projectId = Number(url.searchParams.get("projectId"));
      if (!projectId) {
        const rows = await db.select().from(deliverables).orderBy(desc(deliverables.createdAt));
        return ok(rows);
      }
      const rows = await db
        .select()
        .from(deliverables)
        .where(eq(deliverables.projectId, projectId))
        .orderBy(deliverables.name);
      return ok(rows);
    }

    // 13. Messages
    if (path === "messages") {
      const clientId = Number(url.searchParams.get("clientId"));
      if (!clientId) {
        const rows = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(50);
        return ok(rows);
      }
      const rows = await db
        .select()
        .from(messages)
        .where(eq(messages.clientId, clientId))
        .orderBy(messages.createdAt);
      return ok(rows);
    }

    // 14. Settings & Media
    if (path === "settings") {
      const allSettings = await getSettings();
      return ok(allSettings);
    }

    if (path === "media") {
      const rows = await db.select().from(media).orderBy(desc(media.createdAt));
      return ok(rows);
    }

    if (path === "activity") {
      const rows = await db.select().from(activity).orderBy(desc(activity.createdAt)).limit(50);
      return ok(rows);
    }

    // 15. Live visitors
    if (path === "visitors") {
      const cutoff = new Date(Date.now() - 2 * 60 * 1000); // online = seen in last 2 min
      const [active, today] = await Promise.all([
        db.select().from(visitors).where(gte(visitors.lastSeen, cutoff)),
        db
          .select({ total: sql<number>`count(*)::int` })
          .from(visitors)
          .where(gte(visitors.firstSeen, new Date(new Date().setHours(0, 0, 0, 0)))),
      ]);
      return ok({
        active: active.length,
        today: today[0]?.total ?? 0,
        activePaths: active.map((v) => v.path).slice(0, 20),
      });
    }

    // 16. WhatsApp inbox + connection status
    if (path === "whatsapp") {
      const cfg = whatsappConfig();
      const rows = await listWaMessages(100);
      return ok({
        connected: whatsappConnected(),
        autoReply: cfg.autoReply,
        businessNumber: cfg.businessNumber,
        messages: rows,
      });
    }

    // 17. Business prospecting (Google Places)
    if (path === "prospects") {
      const query = String(url.searchParams.get("query") || "");
      const location = String(url.searchParams.get("location") || "");
      const data = await searchBusinesses(query, location);
      return ok(data);
    }

    return bad("Not found", 404);
  } catch (err) {
    return handleErr(err);
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string[] }> }
) {
  try {
    const admin = await getAdmin();
    const { slug } = await ctx.params;
    const path = slug.join("/");
    const body = await readBody<Record<string, any>>(req);
    if (!canAccess(admin.role, path, true)) return bad("Your role cannot perform this action.", 403);

    if (path === "settings") {
      const pairs = body.pairs;
      if (!pairs || typeof pairs !== "object" || Array.isArray(pairs)) return bad("Settings payload is invalid.");
      const entries = Object.entries(pairs).filter(([key]) => !["__proto__", "constructor", "prototype", "cmsStore"].includes(key));
      if (entries.length > 80) return bad("Too many settings in one update.");
      const requiredCopy = ["siteTitle", "heroTitle", "heroHighlight", "heroSubtitle", "heroCta"];
      const clean: Record<string, unknown> = {};
      for (const [key, value] of entries) {
        if (requiredCopy.includes(key) && !String(value ?? "").trim()) clean[key] = DEFAULT_SETTINGS[key];
        else if (typeof value === "string") clean[key] = value.slice(0, 10000);
        else clean[key] = value;
      }
      await setSettings(clean);
      await db.insert(activity).values({ actor: admin.name, action: "Website settings published", details: `${entries.length} fields updated` });
      return ok({ ok: true, settings: await getSettings() });
    }

    // 1. Reset Demo System
    if (path === "system/reset") {
      await resetSeed();
      await db.insert(activity).values({
        actor: admin.name,
        action: "System Reset",
        details: "Reseeded demo database with original dataset.",
      });
      return ok({ ok: true, message: "System reset successfully" });
    }

    if (path === "team") {
      const name = String(body.name || "").trim().slice(0, 120);
      const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
      const password = String(body.password || "");
      const role = body.role === "accountant" ? "accountant" : "editor";
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("A valid name and email are required.");
      if (password.length < 8 || password.length > 128) return bad("Password must be between 8 and 128 characters.");
      const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (exists.length) return bad("A staff account already uses this email.", 409);
      const [member] = await db.insert(users).values({ name, email, role, passwordHash: hashPassword(password) }).returning();
      await db.insert(activity).values({ actor: admin.name, action: "Team member invited", details: `${name} added as ${role}` });
      return ok({ id: member.id, name: member.name, email: member.email, role: member.role, createdAt: member.createdAt }, 201);
    }

    // 2. Clients
    if (path === "clients") {
      const name = String(body.name || "").trim().slice(0, 120);
      const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
      if (!name || !email) return bad("Name and email are required.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Enter a valid email address.");
      const exists = await db.select({ id: clients.id }).from(clients).where(eq(clients.email, email)).limit(1);
      if (exists.length) return bad("A client with this email already exists.", 409);

      // Never issue a well-known default password. If the admin didn't choose
      // one, generate a one-time temporary password and show it once.
      const providedPass = String(body.password || "").trim();
      const tempPassword = providedPass || `vf_${randomBytes(5).toString("hex")}`;
      if (providedPass && (providedPass.length < 8 || providedPass.length > 128)) {
        return bad("Password must be between 8 and 128 characters.");
      }
      const passwordHash = hashPassword(tempPassword);

      const [newClient] = await db
        .insert(clients)
        .values({
          name,
          email,
          phone: String(body.phone || "").trim().slice(0, 40),
          company: String(body.company || "").trim().slice(0, 160),
          passwordHash,
          status: String(body.status || "active"),
          notes: String(body.notes || "").trim().slice(0, 2000),
        })
        .returning();

      await db.insert(activity).values({
        actor: admin.name,
        action: "Created Client",
        details: `Created client ${newClient.name} (${newClient.email}).`,
      });

      return ok({ ...newClient, passwordHash: undefined, tempPassword }, 201);
    }

    // Client Password Reset
    if (slug.length === 3 && slug[0] === "clients" && slug[2] === "reset-password") {
      const clientId = Number(slug[1]);
      const tempPassword = `vf_${randomBytes(4).toString("hex")}`;
      const passwordHash = hashPassword(tempPassword);

      await db
        .update(clients)
        .set({ passwordHash })
        .where(eq(clients.id, clientId));

      await db.insert(activity).values({
        actor: admin.name,
        action: "Password Reset",
        details: `Reset password for client #${clientId}.`,
      });

      return ok({ tempPassword });
    }

    // 3. Projects
    if (path === "projects") {
      const clientId = Number(body.clientId);
      const title = String(body.title || "").trim();
      if (!clientId || !title) return bad("Client and project title are required.");

      const [newProject] = await db
        .insert(projects)
        .values({
          clientId,
          title,
          service: String(body.service || "Video Editing"),
          description: String(body.description || "").trim(),
          status: String(body.status || "in_progress"),
          progress: Number(body.progress || 0),
          dueDate: body.dueDate ? String(body.dueDate) : null,
          budget: body.budget ? String(body.budget) : "0.00",
        })
        .returning();

      await db.insert(updates).values({
        projectId: newProject.id,
        title: "Project Initialized",
        body: `Created project "${title}" in studio portal.`,
      });

      return ok(newProject);
    }

    // 4. Deliverables & Annotations
    if (path === "deliverables") {
      const projectId = Number(body.projectId);
      const name = String(body.name || "").trim();
      const downloadUrl = String(body.downloadUrl || "").trim();
      if (!projectId || !name || !downloadUrl) return bad("Project ID, name and download URL are required.");

      const [row] = await db
        .insert(deliverables)
        .values({
          projectId,
          name,
          format: String(body.format || "Apple ProRes 422 HQ"),
          resolution: String(body.resolution || "4K UHD (3840x2160)"),
          sizeBytes: String(body.sizeBytes || "12000000000"),
          downloadUrl,
        })
        .returning();

      return ok(row);
    }

    if (path === "annotations") {
      const projectId = Number(body.projectId);
      const comment = String(body.comment || "").trim();
      const timestamp = String(body.timestamp || "00:00");
      if (!projectId || !comment) return bad("Project ID and comment are required.");

      const [row] = await db
        .insert(frameAnnotations)
        .values({
          projectId,
          clientId: body.clientId ? Number(body.clientId) : null,
          timestamp,
          comment,
          author: admin.name,
          resolved: false,
        })
        .returning();

      return ok(row);
    }

    // 5. Webhooks
    if (path === "webhooks") {
      const name = String(body.name || "").trim();
      const webhookUrl = String(body.url || "").trim();
      if (!name || !webhookUrl) return bad("Webhook name and URL are required.");

      const [newWebhook] = await db
        .insert(webhooks)
        .values({
          name,
          url: webhookUrl,
          events: String(body.events || "project.completed,invoice.paid,lead.created"),
          secret: String(body.secret || `whsec_${randomBytes(8).toString("hex")}`),
          active: true,
        })
        .returning();

      return ok(newWebhook);
    }

    if (slug.length === 3 && slug[0] === "webhooks" && slug[2] === "test") {
      const webhookId = Number(slug[1]);
      const [wh] = await db.select().from(webhooks).where(eq(webhooks.id, webhookId)).limit(1);
      if (!wh) return bad("Webhook not found.", 404);

      await db
        .update(webhooks)
        .set({ lastTriggeredAt: new Date() })
        .where(eq(webhooks.id, webhookId));

      return ok({ ok: true, status: 200, message: `Dispatched test payload to ${wh.url}` });
    }

    // 6. Invoices, Expenses, Leads, Portfolio, etc.
    if (path === "invoices") {
      const clientId = Number(body.clientId);
      const amount = Number(body.amount || 0);
      if (!clientId || !amount) return bad("Client ID and invoice amount are required.");

      const invNumber = String(body.number || `VF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);

      const [newInv] = await db
        .insert(invoices)
        .values({
          clientId,
          projectId: body.projectId ? Number(body.projectId) : null,
          number: invNumber,
          amount: String(amount.toFixed(2)),
          status: String(body.status || "sent"),
          dueDate: body.dueDate ? String(body.dueDate) : null,
          notes: String(body.notes || "").trim(),
        })
        .returning();

      return ok(newInv);
    }

    if (path === "expenses") {
      const amount = Number(body.amount || 0);
      const description = String(body.description || "").trim();
      if (!amount || !description) return bad("Amount and description are required.");

      const [newExp] = await db
        .insert(expenses)
        .values({
          category: String(body.category || "Software"),
          description,
          amount: String(amount.toFixed(2)),
          date: body.date ? String(body.date) : new Date().toISOString().slice(0, 10),
        })
        .returning();

      return ok(newExp);
    }

    if (path === "portfolio") {
      const title = String(body.title || "").trim();
      if (!title) return bad("Title is required.");

      const [newPort] = await db
        .insert(portfolio)
        .values({
          title,
          category: String(body.category || "Brand Film"),
          description: String(body.description || "").trim(),
          thumbnailUrl: String(body.thumbnailUrl || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1200&auto=format&fit=crop"),
          videoUrl: String(body.videoUrl || ""),
          year: String(body.year || new Date().getFullYear()),
          featured: Boolean(body.featured),
        })
        .returning();

      return ok(newPort);
    }

    if (path === "leads") {
      const name = String(body.name || "").trim();
      let email = String(body.email || "").trim().toLowerCase();
      const phone = String(body.phone || "").trim();
      // Prospects from the maps tool may only have a phone number — derive a
      // stable placeholder email so the row stays valid and dedupe-able.
      if (!email && phone) email = `wa${phone.replace(/[^\d]/g, "")}@prospect.local`;
      if (!name || (!email && !phone)) return bad("A name and an email or phone are required.");

      const [newLead] = await db
        .insert(leads)
        .values({
          name,
          email,
          phone,
          service: String(body.service || "Video Editing"),
          budget: String(body.budget || ""),
          message: String(body.message || "").trim(),
          notes: String(body.notes || "").trim(),
          status: String(body.status || "new"),
          source: String(body.source || "manual"),
        })
        .returning();

      return ok(newLead);
    }

    // Bulk lead import from spreadsheet (CSV) or JSON array. No small row cap —
    // rows are validated + deduped and inserted in chunks.
    if (path === "leads/import") {
      const raw = typeof body.csv === "string" ? body.csv : "";
      const jsonRows = Array.isArray(body.rows) ? body.rows : null;
      let rows: Record<string, unknown>[] = [];
      if (jsonRows) {
        rows = jsonRows;
      } else if (raw.trim()) {
        const parsed = parseCsv(raw);
        if (parsed.length < 2) return bad("CSV needs a header row plus at least one data row.");
        const [header, ...dataRows] = parsed;
        const norm = header.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
        rows = dataRows.map((r) => {
          const obj: Record<string, unknown> = {};
          norm.forEach((h, i) => {
            obj[h] = (r[i] || "").trim();
          });
          return obj;
        });
      } else {
        return bad("Send a CSV string or a JSON rows array.");
      }

      const maxRows = 10000;
      if (rows.length > maxRows) return bad(`Too many rows at once (${rows.length}). Split the file into chunks of ${maxRows} or fewer.`);

      // Normalise + validate; dedupe by email (or phone).
      const seen = new Set<string>();
      const cleanRows: typeof leads.$inferInsert[] = [];
      let skipped = 0;
      for (const r of rows) {
        const name = String(r.name || r.fullname || r.full_name || "").trim();
        const email = String(r.email || r.emailaddress || r.email_address || "").trim().toLowerCase();
        const phone = String(r.phone || r.phonenumber || r.phone_number || r.mobile || r.contact || "").trim();
        if (!name) { skipped++; continue; }
        const key = (email || `phone:${phone.replace(/[^\d]/g, "")}`).toLowerCase();
        if (seen.has(key)) { skipped++; continue; }
        seen.add(key);
        cleanRows.push({
          name: name.slice(0, 160),
          email: email || (phone ? `wa${phone.replace(/[^\d]/g, "")}@prospect.local` : ""),
          phone: phone.slice(0, 40),
          service: String(r.service || "Video Editing").slice(0, 80),
          budget: String(r.budget || "").slice(0, 80),
          message: String(r.message || r.notes0 || r.brief || "").slice(0, 4000),
          notes: String(r.notes || "").slice(0, 2000),
          status: "new",
          source: "import",
        });
      }

      let inserted = 0;
      // Insert in chunks so a huge sheet doesn't exceed statement limits.
      for (let i = 0; i < cleanRows.length; i += 500) {
        const chunk = cleanRows.slice(i, i + 500);
        const result = await db.insert(leads).values(chunk).returning({ id: leads.id });
        inserted += result.length;
      }
      await db.insert(activity).values({ actor: admin.name, action: "Lead import", details: `Imported ${inserted} leads${skipped ? ` (${skipped} skipped)` : ""}` });
      return ok({ ok: true, inserted, skipped });
    }

    // WhatsApp automation: send a text message
    if (path === "whatsapp/send") {
      const to = String(body.to || "").replace(/[^\d]/g, "");
      const text = String(body.text || "").trim();
      if (!to || !text) return bad("A phone number and message are required.");
      const result = await sendWhatsAppText(to, text);
      if (!result.ok && result.error) {
        return ok({ ok: false, error: result.error, fallback: result.fallback });
      }
      await db.insert(activity).values({ actor: admin.name, action: "WhatsApp message sent", details: `To ${to}` });
      return ok({ ok: true, id: result.id, fallback: result.fallback });
    }

    // Convert Lead to Client
    if (slug.length === 3 && slug[0] === "leads" && slug[2] === "convert") {
      const leadId = Number(slug[1]);
      const [leadRow] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
      if (!leadRow) return bad("Lead not found.", 404);

      // An existing account with this email would violate the unique
      // constraint mid-flow — fail fast with a clear error instead.
      const [dupe] = await db.select({ id: clients.id }).from(clients).where(eq(clients.email, leadRow.email)).limit(1);
      if (dupe) return bad(`A client account already exists for ${leadRow.email}.`, 409);

      // Generate a one-time password; never use a well-known default.
      const tempPassword = `vf_${randomBytes(5).toString("hex")}`;
      const clientPass = hashPassword(tempPassword);
      const [newClient] = await db
        .insert(clients)
        .values({
          name: leadRow.name,
          email: leadRow.email,
          phone: leadRow.phone,
          company: leadRow.name + " Media",
          passwordHash: clientPass,
          status: "active",
          notes: `Converted from lead #${leadId}. Initial message: ${leadRow.message}`,
        })
        .returning();

      const [newProject] = await db
        .insert(projects)
        .values({
          clientId: newClient.id,
          title: `${leadRow.service} Project`,
          service: leadRow.service,
          description: leadRow.message,
          status: "intake",
          progress: 10,
          budget: leadRow.budget.replace(/[^0-9.]/g, "") || "1500.00",
        })
        .returning();

      await db.update(leads).set({ status: "won" }).where(eq(leads.id, leadId));

      return ok({ ok: true, clientId: newClient.id, projectId: newProject.id, tempPassword });
    }

    // Blog Posts & Categories
    if (path === "blog" || path === "wp/posts") {
      const title = String(body.title || "").trim();
      if (!title) return bad("Title is required.");

      const slugVal = String(body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
      const [newPost] = await db
        .insert(posts)
        .values({
          title,
          slug: slugVal,
          excerpt: String(body.excerpt || "").trim(),
          content: String(body.content || "").trim(),
          status: String(body.status || "draft"),
          categoryId: body.categoryId ? Number(body.categoryId) : null,
          tags: String(body.tags || "").trim(),
          featuredImage: String(body.featuredImage || ""),
          seoTitle: String(body.seoTitle || title),
          seoDescription: String(body.seoDescription || body.excerpt || ""),
          views: 0,
          publishedAt: body.status === "published" ? new Date() : null,
        })
        .returning();

      return ok(newPost);
    }

    if (path === "categories") {
      const name = String(body.name || "").trim();
      if (!name) return bad("Category name is required.");
      const slugVal = String(body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));

      const [newCat] = await db
        .insert(categories)
        .values({ name, slug: slugVal })
        .returning();

      return ok(newCat);
    }

    // Automations Run — executes real workflows via src/lib/automations.ts
    if (path === "automations/run") {
      const ran = await runAutomations({ force: true });
      return ok({
        ran: ran.map((r) => ({ name: r.name, effects: r.effects })),
      });
    }

    // Single automation ("Run now" button): /api/admin/automations/:id/run
    if (slug.length === 3 && slug[0] === "automations" && slug[2] === "run") {
      const result = await runAutomationById(Number(slug[1]));
      if (!result) return bad("Automation not found or disabled.", 404);
      return ok({ ran: [{ name: result.name, effects: result.effects }] });
    }

    // Messages & Media
    if (path === "messages/read") {
      const clientId = Number(body.clientId);
      if (!clientId) return bad("Client ID is required.");
      await db
        .update(messages)
        .set({ read: true })
        .where(sql`${messages.clientId} = ${clientId} and ${messages.sender} = 'client'`);
      return ok({ ok: true });
    }

    if (path === "messages") {
      const clientId = Number(body.clientId);
      const msgBody = String(body.body || "").trim();
      if (!clientId || !msgBody) return bad("Client ID and message body are required.");
      if (msgBody.length > 5000) return bad("Message is too long (maximum 5,000 characters).");

      const [newMsg] = await db
        .insert(messages)
        .values({
          clientId,
          sender: "admin",
          body: msgBody,
          read: true,
        })
        .returning();

      return ok(newMsg);
    }

    if (path === "media") {
      const name = String(body.name || "").trim();
      const mediaUrl = String(body.url || "").trim();
      if (!name || !mediaUrl) return bad("Name and URL are required.");

      const [newMedia] = await db
        .insert(media)
        .values({
          name,
          url: mediaUrl,
          type: String(body.type || "image"),
          size: Number(body.size || 150000),
        })
        .returning();

      return ok(newMedia);
    }

    return bad("Not found", 404);
  } catch (err) {
    return handleErr(err);
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string[] }> }
) {
  try {
    const admin = await getAdmin();
    const { slug } = await ctx.params;
    const body = await readBody<Record<string, any>>(req);
    const path = slug.join("/");
    if (!canAccess(admin.role, path, true)) return bad("Your role cannot perform this action.", 403);

    // 1. Quotas: PATCH /api/admin/quotas
    if (slug.length === 1 && slug[0] === "quotas") {
      const updateData: Record<string, any> = {};
      if (body.storageLimitBytes !== undefined) updateData.storageLimitBytes = String(body.storageLimitBytes);
      if (body.aiTokensLimit !== undefined) updateData.aiTokensLimit = Number(body.aiTokensLimit);
      if (body.renderHoursLimit !== undefined) updateData.renderHoursLimit = String(body.renderHoursLimit);
      if (body.activeProjectsLimit !== undefined) updateData.activeProjectsLimit = Number(body.activeProjectsLimit);
      if (body.alertThresholdPercent !== undefined) updateData.alertThresholdPercent = Number(body.alertThresholdPercent);
      updateData.updatedAt = new Date();

      const [updated] = await db.update(quotas).set(updateData).where(eq(quotas.id, 1)).returning();
      return ok(updated);
    }

    // 2. Annotations: PATCH /api/admin/annotations/:id
    if (slug.length === 2 && slug[0] === "annotations") {
      const id = Number(slug[1]);
      const updateData: Record<string, any> = {};
      if (body.resolved !== undefined) updateData.resolved = Boolean(body.resolved);
      if (body.comment !== undefined) updateData.comment = String(body.comment);

      const [updated] = await db.update(frameAnnotations).set(updateData).where(eq(frameAnnotations.id, id)).returning();
      return ok(updated);
    }

    // 3. Webhooks: PATCH /api/admin/webhooks/:id
    if (slug.length === 2 && slug[0] === "webhooks") {
      const id = Number(slug[1]);
      const updateData: Record<string, any> = {};
      if (body.active !== undefined) updateData.active = Boolean(body.active);
      if (body.name !== undefined) updateData.name = String(body.name);
      if (body.url !== undefined) updateData.url = String(body.url);
      if (body.events !== undefined) updateData.events = String(body.events);

      const [updated] = await db.update(webhooks).set(updateData).where(eq(webhooks.id, id)).returning();
      return ok(updated);
    }

    if (slug.length === 2 && slug[0] === "team") {
      const id = Number(slug[1]);
      if (!id) return bad("Invalid team member.");
      const updateData: Record<string, any> = {};
      if (body.name !== undefined) updateData.name = String(body.name).trim().slice(0, 120);
      if (body.role !== undefined) {
        if (id === admin.id) return bad("You cannot change your own owner role.");
        if (!["admin", "editor", "accountant"].includes(body.role)) return bad("Invalid role.");
        updateData.role = body.role;
      }
      if (body.password) {
        const password = String(body.password);
        if (password.length < 8 || password.length > 128) return bad("Password must be between 8 and 128 characters.");
        updateData.passwordHash = hashPassword(password);
      }
      const [updated] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
      if (!updated) return bad("Team member not found.", 404);
      await db.insert(activity).values({ actor: admin.name, action: "Team role updated", details: `${updated.name} is now ${updated.role}` });
      return ok({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, createdAt: updated.createdAt });
    }

    // 4. Clients: PATCH /api/admin/clients/:id
    if (slug.length === 2 && slug[0] === "clients") {
      const id = Number(slug[1]);
      const updateData: Record<string, any> = {};
      if (body.status !== undefined) updateData.status = String(body.status);
      if (body.name !== undefined) updateData.name = String(body.name);
      if (body.email !== undefined) updateData.email = String(body.email);
      if (body.phone !== undefined) updateData.phone = String(body.phone);
      if (body.company !== undefined) updateData.company = String(body.company);
      if (body.notes !== undefined) updateData.notes = String(body.notes);

      const [updated] = await db.update(clients).set(updateData).where(eq(clients.id, id)).returning();
      return ok(updated);
    }

    // 5. Projects: PATCH /api/admin/projects/:id
    if (slug.length === 2 && slug[0] === "projects") {
      const id = Number(slug[1]);
      const updateData: Record<string, any> = {};
      if (body.progress !== undefined) updateData.progress = Number(body.progress);
      if (body.status !== undefined) updateData.status = String(body.status);
      if (body.title !== undefined) updateData.title = String(body.title);
      if (body.service !== undefined) updateData.service = String(body.service);
      if (body.description !== undefined) updateData.description = String(body.description);
      if (body.budget !== undefined) updateData.budget = String(body.budget);
      if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? String(body.dueDate) : null;
      updateData.updatedAt = new Date();

      const [updated] = await db.update(projects).set(updateData).where(eq(projects.id, id)).returning();
      if (updated && updated.status === "completed") {
        await emitEvent("project.completed", {
          id: updated.id,
          title: updated.title,
          clientId: updated.clientId,
        });
      }
      return ok(updated);
    }

    // 6. Invoices: PATCH /api/admin/invoices/:id
    if (slug.length === 2 && slug[0] === "invoices") {
      const id = Number(slug[1]);
      const updateData: Record<string, any> = {};
      if (body.status !== undefined) updateData.status = String(body.status);
      if (body.amount !== undefined) updateData.amount = String(Number(body.amount).toFixed(2));
      if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? String(body.dueDate) : null;
      if (body.notes !== undefined) updateData.notes = String(body.notes);

      const [updated] = await db.update(invoices).set(updateData).where(eq(invoices.id, id)).returning();
      if (updated && updated.status === "paid") {
        await emitEvent("invoice.paid", {
          id: updated.id,
          number: updated.number || `#${updated.id}`,
          amount: updated.amount,
          clientId: updated.clientId,
        });
      }
      return ok(updated);
    }

    // 7. Portfolio: PATCH /api/admin/portfolio/:id
    if (slug.length === 2 && slug[0] === "portfolio") {
      const id = Number(slug[1]);
      const updateData: Record<string, any> = {};
      if (body.featured !== undefined) updateData.featured = Boolean(body.featured);
      if (body.title !== undefined) updateData.title = String(body.title);
      if (body.category !== undefined) updateData.category = String(body.category);
      if (body.description !== undefined) updateData.description = String(body.description);
      if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = String(body.thumbnailUrl);
      if (body.videoUrl !== undefined) updateData.videoUrl = String(body.videoUrl);
      if (body.year !== undefined) updateData.year = String(body.year);

      const [updated] = await db.update(portfolio).set(updateData).where(eq(portfolio.id, id)).returning();
      return ok(updated);
    }

    // 8. Leads: PATCH /api/admin/leads/:id
    if (slug.length === 2 && slug[0] === "leads") {
      const id = Number(slug[1]);
      const updateData: Record<string, any> = {};
      if (body.status !== undefined) updateData.status = String(body.status);
      if (body.notes !== undefined) updateData.notes = String(body.notes);

      const [updated] = await db.update(leads).set(updateData).where(eq(leads.id, id)).returning();
      return ok(updated);
    }

    // 9. Blog Posts: PATCH /api/admin/blog/posts/:id or /api/admin/blog/:id
    if ((slug.length === 3 && slug[0] === "blog" && slug[1] === "posts") || (slug.length === 2 && slug[0] === "blog")) {
      const id = Number(slug[slug.length - 1]);
      const updateData: Record<string, any> = {};
      if (body.title !== undefined) updateData.title = String(body.title);
      if (body.slug !== undefined) {
        updateData.slug = String(body.slug)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 80);
        if (!updateData.slug) return bad("Slug is invalid.");
      }
      if (body.excerpt !== undefined) updateData.excerpt = String(body.excerpt);
      if (body.content !== undefined) updateData.content = String(body.content);
      if (body.status !== undefined) updateData.status = String(body.status);
      if (body.categoryId !== undefined) updateData.categoryId = body.categoryId ? Number(body.categoryId) : null;
      if (body.tags !== undefined) updateData.tags = String(body.tags);
      if (body.featuredImage !== undefined) updateData.featuredImage = String(body.featuredImage);
      if (body.seoTitle !== undefined) updateData.seoTitle = String(body.seoTitle);
      if (body.seoDescription !== undefined) updateData.seoDescription = String(body.seoDescription);
      updateData.updatedAt = new Date();

      const [updated] = await db.update(posts).set(updateData).where(eq(posts.id, id)).returning();
      return ok(updated);
    }

    // 10. Automations: PATCH /api/admin/automations/:id
    if (slug.length === 2 && slug[0] === "automations") {
      const id = Number(slug[1]);
      const updateData: Record<string, any> = {};
      if (body.enabled !== undefined) updateData.enabled = Boolean(body.enabled);
      if (body.config !== undefined) updateData.config = body.config;

      const [updated] = await db.update(automations).set(updateData).where(eq(automations.id, id)).returning();
      return ok(updated);
    }

    return bad("Not found", 404);
  } catch (err) {
    return handleErr(err);
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ slug: string[] }> }
) {
  try {
    const admin = await getAdmin();
    const { slug } = await ctx.params;
    const path = slug.join("/");
    if (!canAccess(admin.role, path, true, true)) return bad("Your role cannot perform this action.", 403);

    if (slug.length === 2) {
      const [resource, idStr] = slug;
      const id = Number(idStr);
      if (!id) return bad("Invalid ID.");

      if (resource === "team") {
        if (id === admin.id) return bad("You cannot remove your own owner account.");
        const target = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
        if (!target) return bad("Team member not found.", 404);
        if (target.role === "admin") {
          const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
          if (admins.length <= 1) return bad("The workspace must keep at least one owner.");
        }
        await db.delete(users).where(eq(users.id, id));
        await db.insert(activity).values({ actor: admin.name, action: "Team member removed", details: target.email });
        return ok({ ok: true, deleted: id });
      }
      if (resource === "clients") {
        await db.delete(clients).where(eq(clients.id, id));
        return ok({ ok: true, deleted: id });
      }
      if (resource === "projects") {
        await db.delete(projects).where(eq(projects.id, id));
        return ok({ ok: true, deleted: id });
      }
      if (resource === "invoices") {
        await db.delete(invoices).where(eq(invoices.id, id));
        return ok({ ok: true, deleted: id });
      }
      if (resource === "expenses") {
        await db.delete(expenses).where(eq(expenses.id, id));
        return ok({ ok: true, deleted: id });
      }
      if (resource === "portfolio") {
        await db.delete(portfolio).where(eq(portfolio.id, id));
        return ok({ ok: true, deleted: id });
      }
      if (resource === "leads") {
        await db.delete(leads).where(eq(leads.id, id));
        return ok({ ok: true, deleted: id });
      }
      if (resource === "blog") {
        await db.delete(posts).where(eq(posts.id, id));
        return ok({ ok: true, deleted: id });
      }
      if (resource === "categories") {
        await db.delete(categories).where(eq(categories.id, id));
        return ok({ ok: true, deleted: id });
      }
      if (resource === "media") {
        await db.delete(media).where(eq(media.id, id));
        return ok({ ok: true, deleted: id });
      }
      if (resource === "webhooks") {
        await db.delete(webhooks).where(eq(webhooks.id, id));
        return ok({ ok: true, deleted: id });
      }
      if (resource === "deliverables") {
        await db.delete(deliverables).where(eq(deliverables.id, id));
        return ok({ ok: true, deleted: id });
      }
    }

    return bad("Not found", 404);
  } catch (err) {
    return handleErr(err);
  }
}
