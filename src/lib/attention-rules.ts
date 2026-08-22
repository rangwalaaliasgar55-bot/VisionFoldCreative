/**
 * Studio automation rules.
 *
 * Deliberately PURE: `evaluate()` takes a snapshot of the studio and returns
 * what needs attention plus the side effects to apply. No database, no clock,
 * no I/O ΓÇö which is what lets the whole rulebook be tested against fixtures in
 * milliseconds, and what stops a scheduled job silently misbehaving in prod.
 *
 * The runner in `run.ts` is the only part that touches the world.
 */

export type LeadRow = {
  id: number;
  name: string;
  email: string;
  status: string;
  createdAt: Date | string | null;
};

export type ProjectRow = {
  id: number;
  clientId: number;
  title: string;
  status: string;
  progress: number;
  dueDate: Date | string | null;
  updatedAt: Date | string | null;
};

export type InvoiceRow = {
  id: number;
  clientId: number;
  number: string;
  amount: string | number;
  status: string;
  dueDate: Date | string | null;
};

/** Cooldown bookkeeping so a client is never nudged twice for one thing. */
export type AutomationState = { nudges: Record<string, string> };

export type RuleConfig = {
  /** Hours before an untouched new lead is flagged. */
  leadSlaHours: number;
  /** Days a cut can sit awaiting client approval before we nudge. */
  approvalNudgeDays: number;
  /** Days without any project movement before it's called stale. */
  staleProjectDays: number;
  /** Days before a due date that counts as "due soon". */
  dueSoonDays: number;
  /** Hours before the same nudge may fire again. */
  nudgeCooldownHours: number;
};

export const DEFAULT_RULES: RuleConfig = {
  leadSlaHours: 24,
  approvalNudgeDays: 3,
  staleProjectDays: 7,
  dueSoonDays: 3,
  nudgeCooldownHours: 72,
};

export type Severity = "high" | "medium" | "low";

export type AttentionItem = {
  /** Stable across runs ΓÇö this is what dedupes nudges. */
  key: string;
  kind: "lead_sla" | "invoice_overdue" | "invoice_due_soon" | "approval_stale" | "project_stale" | "project_due";
  severity: Severity;
  title: string;
  detail: string;
  href: string;
  entityId: number;
  ageDays: number;
};

export type Effect =
  | { type: "invoice_mark_overdue"; invoiceId: number }
  | { type: "client_message"; clientId: number; body: string; nudgeKey: string }
  | { type: "project_update"; projectId: number; title: string; body: string; nudgeKey: string };

export type Snapshot = {
  now: Date;
  leads: LeadRow[];
  projects: ProjectRow[];
  invoices: InvoiceRow[];
  state: AutomationState;
  config?: Partial<RuleConfig>;
};

export type Evaluation = {
  items: AttentionItem[];
  effects: Effect[];
  counts: Record<Severity, number>;
};

/* ------------------------------------------------------------------ */
const day = 86_400_000;

const toDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const daysBetween = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / day);

/** A nudge may fire only if it hasn't fired inside the cooldown window. */
function canNudge(state: AutomationState, key: string, now: Date, cooldownHours: number): boolean {
  const last = state.nudges?.[key];
  if (!last) return true;
  const at = toDate(last);
  if (!at) return true;
  return now.getTime() - at.getTime() >= cooldownHours * 3_600_000;
}

const money = (amount: string | number) => {
  const value = typeof amount === "number" ? amount : Number.parseFloat(amount || "0");
  return Number.isFinite(value) ? value.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "0";
};

/* ------------------------------------------------------------------ */
export function evaluate(snapshot: Snapshot): Evaluation {
  const cfg = { ...DEFAULT_RULES, ...(snapshot.config || {}) };
  const { now, state } = snapshot;
  const items: AttentionItem[] = [];
  const effects: Effect[] = [];

  /* --- Leads that have gone unanswered past the SLA --- */
  for (const lead of snapshot.leads) {
    if (lead.status !== "new") continue;
    const created = toDate(lead.createdAt);
    if (!created) continue;
    const hours = (now.getTime() - created.getTime()) / 3_600_000;
    if (hours < cfg.leadSlaHours) continue;
    items.push({
      key: `lead_sla:${lead.id}`,
      kind: "lead_sla",
      severity: hours >= cfg.leadSlaHours * 2 ? "high" : "medium",
      title: `${lead.name} hasn't had a reply`,
      detail: `Brief landed ${Math.floor(hours)}h ago ΓÇö your promise on the site is a reply within ${cfg.leadSlaHours} hours.`,
      href: "/admin/leads",
      entityId: lead.id,
      ageDays: Math.floor(hours / 24),
    });
  }

  /* --- Invoices: overdue, and the ones about to be --- */
  for (const invoice of snapshot.invoices) {
    if (invoice.status === "paid") continue;
    const due = toDate(invoice.dueDate);
    if (!due) continue;
    const overdueDays = daysBetween(due, now);

    if (overdueDays > 0) {
      items.push({
        key: `invoice_overdue:${invoice.id}`,
        kind: "invoice_overdue",
        severity: overdueDays >= 14 ? "high" : "medium",
        title: `Invoice ${invoice.number || `#${invoice.id}`} is ${overdueDays}d overdue`,
        detail: `Γé╣${money(invoice.amount)} outstanding.`,
        href: "/admin/invoices",
        entityId: invoice.id,
        ageDays: overdueDays,
      });

      // Reflect reality in the record itself.
      if (invoice.status !== "overdue") {
        effects.push({ type: "invoice_mark_overdue", invoiceId: invoice.id });
      }

      const nudgeKey = `invoice_nudge:${invoice.id}`;
      if (canNudge(state, nudgeKey, now, cfg.nudgeCooldownHours)) {
        effects.push({
          type: "client_message",
          clientId: invoice.clientId,
          nudgeKey,
          body: `Quick note: invoice ${invoice.number || `#${invoice.id}`} for Γé╣${money(invoice.amount)} is now ${overdueDays} day${overdueDays === 1 ? "" : "s"} past its due date. You can settle it from the Invoices tab here. If it's already been sent, ignore this and let us know.`,
        });
      }
    } else if (-overdueDays <= cfg.dueSoonDays) {
      items.push({
        key: `invoice_due_soon:${invoice.id}`,
        kind: "invoice_due_soon",
        severity: "low",
        title: `Invoice ${invoice.number || `#${invoice.id}`} due in ${-overdueDays}d`,
        detail: `Γé╣${money(invoice.amount)}.`,
        href: "/admin/invoices",
        entityId: invoice.id,
        ageDays: 0,
      });
    }
  }

  /* --- Projects: waiting on the client, stalled, or nearly due --- */
  for (const project of snapshot.projects) {
    if (project.status === "completed") continue;
    const touched = toDate(project.updatedAt);
    const idleDays = touched ? daysBetween(touched, now) : 0;

    if (project.status === "in_review" && idleDays >= cfg.approvalNudgeDays) {
      items.push({
        key: `approval_stale:${project.id}`,
        kind: "approval_stale",
        severity: idleDays >= cfg.approvalNudgeDays * 2 ? "high" : "medium",
        title: `ΓÇ£${project.title}ΓÇ¥ has been awaiting approval ${idleDays}d`,
        detail: "The cut is with the client and nothing has moved.",
        href: "/admin/projects",
        entityId: project.id,
        ageDays: idleDays,
      });

      const nudgeKey = `approval_nudge:${project.id}`;
      if (canNudge(state, nudgeKey, now, cfg.nudgeCooldownHours)) {
        effects.push({
          type: "client_message",
          clientId: project.clientId,
          nudgeKey,
          body: `Gentle nudge on ΓÇ£${project.title}ΓÇ¥ ΓÇö the cut has been ready for your review for ${idleDays} days. Approve it or drop your notes in the portal and we'll turn them around. Happy to jump on the timeline together if that's easier.`,
        });
      }
    } else if (idleDays >= cfg.staleProjectDays) {
      items.push({
        key: `project_stale:${project.id}`,
        kind: "project_stale",
        severity: idleDays >= cfg.staleProjectDays * 2 ? "high" : "low",
        title: `ΓÇ£${project.title}ΓÇ¥ hasn't moved in ${idleDays}d`,
        detail: `Still at ${project.progress}% and last touched ${idleDays} days ago.`,
        href: "/admin/projects",
        entityId: project.id,
        ageDays: idleDays,
      });
    }

    const due = toDate(project.dueDate);
    if (due) {
      const daysLeft = daysBetween(now, due);
      if (daysLeft >= 0 && daysLeft <= cfg.dueSoonDays && project.progress < 100) {
        items.push({
          key: `project_due:${project.id}`,
          kind: "project_due",
          severity: daysLeft <= 1 ? "high" : "medium",
          title: `ΓÇ£${project.title}ΓÇ¥ is due in ${daysLeft}d at ${project.progress}%`,
          detail: "Delivery date is close and the project isn't finished.",
          href: "/admin/projects",
          entityId: project.id,
          ageDays: 0,
        });
      } else if (daysLeft < 0 && project.status !== "completed") {
        items.push({
          key: `project_overdue:${project.id}`,
          kind: "project_due",
          severity: "high",
          title: `ΓÇ£${project.title}ΓÇ¥ passed its due date ${-daysLeft}d ago`,
          detail: `Still at ${project.progress}%.`,
          href: "/admin/projects",
          entityId: project.id,
          ageDays: -daysLeft,
        });
      }
    }
  }

  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => order[a.severity] - order[b.severity] || b.ageDays - a.ageDays);

  return {
    items,
    effects,
    counts: {
      high: items.filter((i) => i.severity === "high").length,
      medium: items.filter((i) => i.severity === "medium").length,
      low: items.filter((i) => i.severity === "low").length,
    },
  };
}
