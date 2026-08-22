import { db } from "@/db";
import {
  activity,
  automations,
  clients,
  invoices,
  leads,
  messages,
  projects,
  ratings,
  updates,
  type Automation,
} from "@/db/schema";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { gatherStats, rulesInsights } from "@/lib/ai";
import { automationsEnabled } from "@/lib/settings";
import { captureSnapshots, generateDueInsights } from "@/lib/social";
import { emailConfigured, emailShell, sendEmail } from "@/lib/email";
import { fmtInr } from "@/lib/money";
import {
  evaluate,
  type Effect,
  type Evaluation,
  type RuleConfig,
} from "@/lib/attention-rules";

export type AutomationRunResult = { name: string; trigger: string; effects: number };

/** The full catalog — missing rows are inserted on every run, so existing
 *  deployments pick up new automations without reseeding. */
const CATALOG: Array<{
  name: string;
  trigger: string;
  description: string;
  enabled: boolean;
  config: Record<string, unknown>;
}> = [
  {
    name: "Auto-Ack New Leads",
    trigger: "lead_created",
    description: "Acknowledges every fresh inquiry and moves it to Contacted so nothing sits unseen.",
    enabled: true,
    config: { autoReplyTemplate: "reply_lead", delaySeconds: 0 },
  },
  {
    name: "Project Progress Milestone Notification",
    trigger: "project_updated",
    description: "Messages the client in their portal when a project crosses 50% progress.",
    enabled: true,
    config: { thresholdProgress: 50 },
  },
  {
    name: "Overdue Invoice Reminder",
    trigger: "invoice_overdue",
    description: "Marks unpaid invoices overdue after the due date and pings the client with a polite reminder.",
    enabled: true,
    config: { advanceDays: 3, reminderFrequencyDays: 5 },
  },
  {
    name: "Review Request on Completion",
    trigger: "project_completed",
    description: "Asks finished clients for a rating in their portal (with coupon reward).",
    enabled: true,
    config: { rewardCoupon: "VISION10" },
  },
  {
    name: "Daily Business Digest",
    trigger: "daily_digest",
    description: "Every day, writes an AI/rule-based digest of leads, invoices and risks to the activity feed.",
    enabled: true,
    config: {},
  },
  {
    name: "Social Analytics Sync",
    trigger: "social_sync",
    description: "Pulls YouTube/LinkedIn metrics and generates day-3 / day-7 performance reviews.",
    enabled: true,
    config: {},
  },
];

async function ensureAutomationsCatalog() {
  const existing = await db.select().from(automations);
  const have = new Set(existing.map((a) => a.trigger));
  const missing = CATALOG.filter((c) => !have.has(c.trigger));
  if (missing.length > 0) {
    await db.insert(automations).values(missing);
  }
}

/** True when an identical automation effect was already logged since `since`. */
async function alreadyDone(action: string, marker: string, since: Date): Promise<boolean> {
  const rows = await db
    .select({ details: activity.details })
    .from(activity)
    .where(and(eq(activity.action, action), gte(activity.createdAt, since)));
  return rows.some((r) => r.details.includes(marker));
}

async function clientName(clientId: number): Promise<string> {
  const rows = await db.select({ name: clients.name }).from(clients).where(eq(clients.id, clientId)).limit(1);
  return rows[0]?.name ?? "there";
}

async function clientEmail(clientId: number): Promise<string> {
  const rows = await db.select({ email: clients.email }).from(clients).where(eq(clients.id, clientId)).limit(1);
  return rows[0]?.email ?? "";
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function runLeadAck(): Promise<number> {
  const fresh = await db.select().from(leads).where(eq(leads.status, "new"));
  let effects = 0;
  for (const lead of fresh.slice(0, 50)) {
    await db
      .update(leads)
      .set({
        status: "contacted",
        notes: `${lead.notes ? `${lead.notes}\n` : ""}[Auto ${new Date().toISOString().slice(0, 10)}] Acknowledgement + questionnaire sent.`,
      })
      .where(eq(leads.id, lead.id));
    if (emailConfigured()) {
      await sendEmail({
        to: lead.email,
        subject: `We got your brief, ${lead.name.split(" ")[0]} — here's what happens next`,
        html: emailShell(
          "Thanks for reaching out!",
          `<p>Hi ${lead.name.split(" ")[0]}, we received your inquiry about <b>${lead.service}</b> and someone from the studio will reply within 24 hours.</p>
           <p>To speed things up, it helps if you share: footage length, deadline, and 1–2 style references.</p>`
        ),
      });
    }
    await db.insert(activity).values({
      actor: "automation",
      action: "auto.lead_ack",
      details: `Lead #${lead.id} (${lead.name}) acknowledged and moved to Contacted${emailConfigured() ? " + email" : ""}`,
    });
    effects += 1;
  }
  return effects;
}

async function runMilestoneNotify(config: Record<string, unknown>): Promise<number> {
  const threshold = Number(config.thresholdProgress ?? 50);
  const active = await db
    .select()
    .from(projects)
    .where(and(gte(projects.progress, threshold), ne(projects.status, "completed")));
  let effects = 0;
  for (const project of active.slice(0, 30)) {
    // One milestone message per project per week.
    if (await alreadyDone("auto.milestone", `#P${project.id}#`, new Date(Date.now() - 7 * 86_400_000))) continue;
    await db.insert(messages).values({
      clientId: project.clientId,
      sender: "admin",
      body: `Progress update: "${project.title}" is now at ${project.progress}%. Open your portal to watch the latest cut and drop feedback whenever you're ready.`,
      read: false,
    });
    await db.insert(activity).values({
      actor: "automation",
      action: "auto.milestone",
      details: `Milestone notice sent for #P${project.id}# "${project.title}" at ${project.progress}%`,
    });
    effects += 1;
  }
  return effects;
}

async function runInvoiceReminders(config: Record<string, unknown>): Promise<number> {
  const freqDays = Number(config.reminderFrequencyDays ?? 5);
  const today = new Date().toISOString().slice(0, 10);
  const unpaid = await db
    .select()
    .from(invoices)
    .where(ne(invoices.status, "paid"));
  let effects = 0;
  for (const inv of unpaid.slice(0, 50)) {
    const due = inv.dueDate ? String(inv.dueDate) : null;
    const isPast = Boolean(due && due < today);
    const dueSoon = Boolean(
      due && !isPast && new Date(due).getTime() - Date.now() <= Number(config.advanceDays ?? 3) * 86_400_000
    );
    if (!isPast && !dueSoon) continue;

    // Re-reminder only after the configured frequency window.
    if (
      await alreadyDone("auto.invoice_reminder", `#INV${inv.id}#`, new Date(Date.now() - freqDays * 86_400_000))
    ) {
      continue;
    }

    if (isPast && inv.status !== "overdue") {
      await db.update(invoices).set({ status: "overdue" }).where(eq(invoices.id, inv.id));
    }

    const name = await clientName(inv.clientId);
    await db.insert(messages).values({
      clientId: inv.clientId,
      sender: "admin",
      body: isPast
        ? `Hi ${name} — a gentle nudge that invoice ${inv.number || `#${inv.id}`} was due on ${due}. Whenever you're ready, we appreciate it! Reply here with any questions.`
        : `Hi ${name} — quick heads-up: invoice ${inv.number || `#${inv.id}`} is due on ${due}. Just so nothing surprises you!`,
      read: false,
    });
    if (emailConfigured()) {
      const to = await clientEmail(inv.clientId);
      if (to) {
        await sendEmail({
          to,
          subject: `Invoice ${inv.number || `#${inv.id}`} — ${isPast ? "payment reminder" : "coming due"}`,
          html: emailShell(
            isPast ? "A gentle payment reminder" : "Your invoice is coming due",
            `<p>Hi ${name}, invoice <b>${inv.number || `#${inv.id}`}</b> (${inv.amount}) ${
              isPast ? `was due on ${due}` : `is due on ${due}`
            }. Reply to this email with any questions.</p>`
          ),
        });
      }
    }
    await db.insert(activity).values({
      actor: "automation",
      action: "auto.invoice_reminder",
      details: `Reminder for #INV${inv.id}# ${inv.number || ""}${isPast ? " (overdue)" : " (upcoming)"} sent to ${name}`,
    });
    effects += 1;
  }
  return effects;
}

async function runReviewRequests(config: Record<string, unknown>): Promise<number> {
  const done = await db.select().from(projects).where(eq(projects.status, "completed"));
  const coupon = String(config.rewardCoupon ?? "VISION10");
  let effects = 0;
  for (const project of done.slice(0, 30)) {
    const rated = await db
      .select({ id: ratings.id })
      .from(ratings)
      .where(eq(ratings.projectId, project.id))
      .limit(1);
    if (rated.length > 0) continue;
    if (await alreadyDone("auto.review_request", `#P${project.id}#`, new Date(Date.now() - 30 * 86_400_000))) continue;

    const name = await clientName(project.clientId);
    await db.insert(messages).values({
      clientId: project.clientId,
      sender: "admin",
      body: `Hi ${name} — "${project.title}" is wrapped! 🎬 Could you spare 30 seconds to rate the edit in your portal? As thanks, use code ${coupon} on your next project.`,
      read: false,
    });
    if (emailConfigured()) {
      const to = await clientEmail(project.clientId);
      if (to) {
        await sendEmail({
          to,
          subject: `"${project.title}" is wrapped — 30 seconds for a rating?`,
          html: emailShell(
            "Your project is wrapped 🎬",
            `<p>Hi ${name}, <b>${project.title}</b> is delivered. Could you rate the edit in your <a href="${process.env.APP_URL || ""}/portal" style="color:#7357FF;">client portal</a>?</p>
             <p>As thanks: use code <b>${coupon}</b> on your next project.</p>`
          ),
        });
      }
    }
    await db.insert(activity).values({
      actor: "automation",
      action: "auto.review_request",
      details: `Review request sent for completed project #P${project.id}# "${project.title}"`,
    });
    effects += 1;
  }
  return effects;
}

async function runDailyDigest(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  if (await alreadyDone("digest.daily", `#D${today}#`, new Date(Date.now() - 20 * 3600_000))) return 0;
  const [items, stats] = await Promise.all([rulesInsights(), gatherStats()]);

  // Written record in the activity feed (always).
  await db.insert(activity).values({
    actor: "automation",
    action: "digest.daily",
    details: `#D${today}# Daily digest — ${items.join(" | ")}`,
  });

  // Morning email to the owner when Resend is configured.
  let emailed = false;
  if (emailConfigured()) {
    const to = process.env.NOTIFICATION_EMAIL || String((await getSettingValue("email")) || "");
    if (to) {
      emailed = await sendEmail({
        to,
        subject: `Studio digest — ${stats.newLeads7d} new leads, ${fmtInr(stats.outstanding)} outstanding`,
        html: emailShell(
          "Your studio, this morning",
          `<table style="width:100%;font-size:13px;color:#C9CFDB;">
            <tr><td style="padding:4px 0;">New leads (7d)</td><td style="text-align:right;font-weight:bold;color:#fff;">${stats.newLeads7d}</td></tr>
            <tr><td style="padding:4px 0;">Active projects</td><td style="text-align:right;font-weight:bold;color:#fff;">${stats.activeProjects}</td></tr>
            <tr><td style="padding:4px 0;">Overdue invoices</td><td style="text-align:right;font-weight:bold;color:${Number(stats.overdueInvoices) > 0 ? "#f87171" : "#fff"};">${stats.overdueInvoices}</td></tr>
            <tr><td style="padding:4px 0;">Outstanding</td><td style="text-align:right;font-weight:bold;color:#fff;">${fmtInr(stats.outstanding)}</td></tr>
            <tr><td style="padding:4px 0;">Unread client messages</td><td style="text-align:right;font-weight:bold;color:#fff;">${stats.unreadClientMessages}</td></tr>
          </table>
          <p style="margin-top:18px;font-size:12px;letter-spacing:.15em;color:#F4A62A;font-weight:bold;">TODAY'S FOCUS</p>
          <ul style="padding-left:16px;margin:6px 0 0;">${items.map((i) => `<li style="margin-bottom:6px;">${i}</li>`).join("")}</ul>`
        ),
      });
    }
  }

  return emailed ? 2 : 1;
}

async function getSettingValue(key: string): Promise<unknown> {
  const { getSetting } = await import("@/lib/settings");
  return getSetting(key);
}

async function runSocialSync(): Promise<number> {
  const snap = await captureSnapshots();
  const ins = await generateDueInsights();
  const effects = snap.captured + ins.generated;
  if (effects > 0) {
    await db.insert(activity).values({
      actor: "automation",
      action: "auto.social_sync",
      details: `Captured ${snap.captured} metric snapshot(s), generated ${ins.generated} review(s)`,
    });
  }
  return effects;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

async function execute(auto: Automation): Promise<number> {
  switch (auto.trigger) {
    case "lead_created":
      return runLeadAck();
    case "project_updated":
      return runMilestoneNotify((auto.config ?? {}) as Record<string, unknown>);
    case "invoice_overdue":
      return runInvoiceReminders((auto.config ?? {}) as Record<string, unknown>);
    case "project_completed":
      return runReviewRequests((auto.config ?? {}) as Record<string, unknown>);
    case "daily_digest":
      return runDailyDigest();
    case "social_sync":
      return runSocialSync();
    default:
      return 0;
  }
}

/**
 * Runs all enabled automations.
 *  - `force` (admin "Run now") executes regardless of cooldown.
 *  - Cron passes `force: false`, skipping anything run in the last 12h.
 */
export async function runAutomations(opts: { force?: boolean } = {}): Promise<AutomationRunResult[]> {
  if (!(await automationsEnabled())) return [];
  await ensureAutomationsCatalog();

  const enabled = await db.select().from(automations).where(eq(automations.enabled, true));
  const results: AutomationRunResult[] = [];
  const cooldownMs = opts.force ? 0 : 12 * 3600_000;

  for (const auto of enabled) {
    if (!opts.force && auto.lastRunAt && Date.now() - new Date(auto.lastRunAt).getTime() < cooldownMs) {
      continue;
    }
    let effects = 0;
    try {
      effects = await execute(auto);
    } catch (err) {
      console.error(`[automation:${auto.trigger}] failed`, err);
    }
    await db
      .update(automations)
      .set({ lastRunAt: new Date() })
      .where(eq(automations.id, auto.id));
    results.push({ name: auto.name, trigger: auto.trigger, effects });
  }
  return results;
}

export async function runAutomationById(id: number): Promise<AutomationRunResult | null> {
  const rows = await db.select().from(automations).where(eq(automations.id, id)).limit(1);
  const auto = rows[0];
  if (!auto || !auto.enabled) return null;
  const effects = await execute(auto);
  await db.update(automations).set({ lastRunAt: new Date() }).where(eq(automations.id, id));
  return { name: auto.name, trigger: auto.trigger, effects };
}

/** Used by /api/health-style probes or dashboards. */
export async function automationStats() {
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(automations);
  const [{ live }] = await db
    .select({ live: sql<number>`count(*)::int` })
    .from(automations)
    .where(and(eq(automations.enabled, true)));
  return { total, enabled: live };
}

// ---------------------------------------------------------------------------
// Attention queue — "everything that needs a human, in one place"
// (pure rules in src/lib/attention-rules.ts; effects applied here with
// per-entity cooldowns so a client is never nudged twice for one thing)
// ---------------------------------------------------------------------------

const NUDGE_STATE_KEY = "automationState";

type NudgeState = { nudges: Record<string, string> };

async function loadNudgeState(): Promise<NudgeState> {
  const raw = (await getSettingValue(NUDGE_STATE_KEY)) as NudgeState | null;
  return raw && typeof raw === "object" && raw.nudges ? raw : { nudges: {} };
}

async function saveNudgeState(state: NudgeState) {
  const { setSetting } = await import("@/lib/settings");
  await setSetting(NUDGE_STATE_KEY, state);
}

/** Read-only evaluation for the admin queue. */
export async function getAttention(config?: Partial<RuleConfig>): Promise<Evaluation> {
  const [leadRows, projectRows, invoiceRows, state] = await Promise.all([
    db
      .select({ id: leads.id, name: leads.name, email: leads.email, status: leads.status, createdAt: leads.createdAt })
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(200),
    db
      .select({
        id: projects.id,
        clientId: projects.clientId,
        title: projects.title,
        status: projects.status,
        progress: projects.progress,
        dueDate: projects.dueDate,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .limit(300),
    db
      .select({
        id: invoices.id,
        clientId: invoices.clientId,
        number: invoices.number,
        amount: invoices.amount,
        status: invoices.status,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .limit(300),
    loadNudgeState(),
  ]);
  void emailConfigured;
  return evaluate({ now: new Date(), leads: leadRows, projects: projectRows, invoices: invoiceRows, state, config });
}

export type AttentionRunSummary = {
  flagged: number;
  applied: { invoicesMarkedOverdue: number; clientMessages: number; projectUpdates: number };
};

/** Applies the pure rules' effects with cooldown bookkeeping. */
export async function runAttentionEffects(force = false): Promise<AttentionRunSummary> {
  if (!(await automationsEnabled())) {
    return { flagged: 0, applied: { invoicesMarkedOverdue: 0, clientMessages: 0, projectUpdates: 0 } };
  }
  const state = await loadNudgeState();
  const evaluation = await getAttention();
  const applied = { invoicesMarkedOverdue: 0, clientMessages: 0, projectUpdates: 0 };
  const now = new Date();
  const cooldownMs = force ? 0 : 72 * 3_600_000;

  const canNudge = (key: string) => {
    const last = state.nudges[key];
    return !last || now.getTime() - new Date(last).getTime() >= cooldownMs;
  };
  const markNudged = (key: string) => {
    state.nudges[key] = now.toISOString();
  };

  for (const effect of evaluation.effects as Effect[]) {
    try {
      if (effect.type === "invoice_mark_overdue") {
        await db.update(invoices).set({ status: "overdue" }).where(eq(invoices.id, effect.invoiceId));
        applied.invoicesMarkedOverdue += 1;
      } else if (effect.type === "client_message") {
        if (!canNudge(effect.nudgeKey)) continue;
        const [client] = await db
          .select({ name: clients.name })
          .from(clients)
          .where(eq(clients.id, effect.clientId))
          .limit(1);
        await db.insert(messages).values({
          clientId: effect.clientId,
          sender: "admin",
          body: effect.body.replace("Hi there —", `Hi ${client?.name?.split(" ")[0] || "there"} —`),
          read: false,
        });
        markNudged(effect.nudgeKey);
        applied.clientMessages += 1;
      } else if (effect.type === "project_update") {
        if (!canNudge(effect.nudgeKey)) continue;
        await db.insert(updates).values({
          projectId: effect.projectId,
          title: effect.title,
          body: effect.body,
        });
        markNudged(effect.nudgeKey);
        applied.projectUpdates += 1;
      }
    } catch (err) {
      console.error("[attention-effect]", err);
    }
  }

  if (
    applied.clientMessages > 0 ||
    applied.invoicesMarkedOverdue > 0 ||
    applied.projectUpdates > 0 ||
    Object.keys(state.nudges).length
  ) {
    await saveNudgeState(state);
  }

  return { flagged: evaluation.items.length, applied };
}
