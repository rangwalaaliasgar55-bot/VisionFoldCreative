/**
 * The impure half of the automation system: load a snapshot, run the pure
 * rules, apply the effects. Everything that can go wrong with a scheduled job
 * — double-sending, partial failures, clock drift — is contained here.
 */

import { db } from "@/db";
import { invoices, leads, messages, projects, updates } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSetting, setSetting } from "@/lib/settings";
import {
  DEFAULT_RULES,
  evaluate,
  type AttentionItem,
  type AutomationState,
  type Effect,
  type Evaluation,
  type RuleConfig,
} from "./rules";

const STATE_KEY = "automationState";

async function loadState(): Promise<AutomationState> {
  const raw = (await getSetting(STATE_KEY)) as AutomationState | null;
  return raw && typeof raw === "object" && raw.nudges ? raw : { nudges: {} };
}

async function loadSnapshotData() {
  const [leadRows, projectRows, invoiceRows] = await Promise.all([
    db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        status: leads.status,
        createdAt: leads.createdAt,
      })
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
  ]);
  return { leadRows, projectRows, invoiceRows };
}

/**
 * Read-only: what needs a human right now. Used by the admin queue, so it
 * never writes anything or sends a nudge.
 */
export async function getAttention(config?: Partial<RuleConfig>): Promise<Evaluation> {
  const [{ leadRows, projectRows, invoiceRows }, state] = await Promise.all([
    loadSnapshotData(),
    loadState(),
  ]);
  return evaluate({
    now: new Date(),
    leads: leadRows,
    projects: projectRows,
    invoices: invoiceRows,
    state,
    config,
  });
}

export type RunSummary = {
  ran: boolean;
  items: AttentionItem[];
  applied: { invoicesMarkedOverdue: number; clientMessages: number; projectUpdates: number };
  skipped: number;
  errors: string[];
};

/**
 * Applies effects. Safe to call repeatedly: nudges are cooldown-gated by key,
 * and a failure on one effect never blocks the rest.
 */
export async function runAutomations(config?: Partial<RuleConfig>): Promise<RunSummary> {
  const state = await loadState();
  const { leadRows, projectRows, invoiceRows } = await loadSnapshotData();
  const now = new Date();

  const { items, effects } = evaluate({
    now,
    leads: leadRows,
    projects: projectRows,
    invoices: invoiceRows,
    state,
    config: { ...DEFAULT_RULES, ...(config || {}) },
  });

  const applied = { invoicesMarkedOverdue: 0, clientMessages: 0, projectUpdates: 0 };
  const errors: string[] = [];
  const nextNudges = { ...state.nudges };

  for (const effect of effects as Effect[]) {
    try {
      if (effect.type === "invoice_mark_overdue") {
        await db.update(invoices).set({ status: "overdue" }).where(eq(invoices.id, effect.invoiceId));
        applied.invoicesMarkedOverdue++;
      } else if (effect.type === "client_message") {
        await db.insert(messages).values({
          clientId: effect.clientId,
          sender: "studio",
          body: effect.body,
          read: false,
        });
        nextNudges[effect.nudgeKey] = now.toISOString();
        applied.clientMessages++;
      } else if (effect.type === "project_update") {
        await db.insert(updates).values({
          projectId: effect.projectId,
          title: effect.title,
          body: effect.body,
        });
        nextNudges[effect.nudgeKey] = now.toISOString();
        applied.projectUpdates++;
      }
    } catch (error) {
      errors.push(`${effect.type}: ${(error as Error).message}`);
    }
  }

  // Forget cooldowns older than 30 days so the record can't grow forever.
  const cutoff = now.getTime() - 30 * 86_400_000;
  for (const [key, iso] of Object.entries(nextNudges)) {
    const at = new Date(iso).getTime();
    if (!Number.isFinite(at) || at < cutoff) delete nextNudges[key];
  }

  await setSetting(STATE_KEY, { nudges: nextNudges });

  return {
    ran: true,
    items,
    applied,
    skipped: effects.length - (applied.invoicesMarkedOverdue + applied.clientMessages + applied.projectUpdates),
    errors,
  };
}
