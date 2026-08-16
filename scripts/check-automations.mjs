#!/usr/bin/env node
/**
 * Rulebook tests for the studio automations.
 *
 * These run against fixtures, not a database — a scheduled job that nudges
 * clients must be provably correct before it ever touches production data.
 *
 * Usage: npx tsx scripts/check-automations.mjs
 */
import { evaluate, DEFAULT_RULES } from "../src/lib/automations/rules";

const failures = [];
const check = (label, ok) => {
  if (!ok) failures.push(label);
};

const NOW = new Date("2026-03-15T12:00:00Z");
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000);
const daysAhead = (n) => new Date(NOW.getTime() + n * 86400000);
const base = { now: NOW, leads: [], projects: [], invoices: [], state: { nudges: {} } };
const keys = (r) => r.items.map((i) => i.key);
const kinds = (r) => r.items.map((i) => i.kind);

/* --- leads ------------------------------------------------------- */
let r = evaluate({
  ...base,
  leads: [
    { id: 1, name: "Fresh", email: "a@b.c", status: "new", createdAt: daysAgo(0) },
    { id: 2, name: "Late", email: "a@b.c", status: "new", createdAt: daysAgo(2) },
    { id: 3, name: "Handled", email: "a@b.c", status: "contacted", createdAt: daysAgo(9) },
  ],
});
check("fresh lead is not flagged", !keys(r).includes("lead_sla:1"));
check("stale new lead is flagged", keys(r).includes("lead_sla:2"));
check("contacted lead is never flagged", !keys(r).includes("lead_sla:3"));
check("2x SLA breach is high severity", r.items.find((i) => i.key === "lead_sla:2").severity === "high");

/* --- invoices ---------------------------------------------------- */
r = evaluate({
  ...base,
  invoices: [
    { id: 10, clientId: 1, number: "INV-1", amount: "5000", status: "sent", dueDate: daysAgo(5) },
    { id: 11, clientId: 1, number: "INV-2", amount: "5000", status: "paid", dueDate: daysAgo(30) },
    { id: 12, clientId: 2, number: "INV-3", amount: "800", status: "sent", dueDate: daysAhead(2) },
    { id: 13, clientId: 2, number: "INV-4", amount: "800", status: "sent", dueDate: daysAhead(45) },
  ],
});
check("overdue invoice flagged", keys(r).includes("invoice_overdue:10"));
check("paid invoice ignored", !keys(r).some((k) => k.endsWith(":11")));
check("due-soon invoice flagged low", r.items.find((i) => i.key === "invoice_due_soon:12")?.severity === "low");
check("far-future invoice ignored", !keys(r).some((k) => k.endsWith(":13")));
check("overdue invoice gets marked overdue", r.effects.some((e) => e.type === "invoice_mark_overdue" && e.invoiceId === 10));
check("overdue invoice nudges the client", r.effects.some((e) => e.type === "client_message" && e.clientId === 1));

// already flagged overdue in the DB -> no redundant write
r = evaluate({
  ...base,
  invoices: [{ id: 10, clientId: 1, number: "INV-1", amount: "5000", status: "overdue", dueDate: daysAgo(5) }],
});
check("no duplicate overdue write", !r.effects.some((e) => e.type === "invoice_mark_overdue"));

/* --- cooldown: the single most important safety property ---------- */
const recent = { nudges: { "invoice_nudge:10": daysAgo(1).toISOString() } };
r = evaluate({
  ...base,
  state: recent,
  invoices: [{ id: 10, clientId: 1, number: "INV-1", amount: "5000", status: "overdue", dueDate: daysAgo(5) }],
});
check("no re-nudge inside cooldown", !r.effects.some((e) => e.type === "client_message"));

const old = { nudges: { "invoice_nudge:10": daysAgo(10).toISOString() } };
r = evaluate({
  ...base,
  state: old,
  invoices: [{ id: 10, clientId: 1, number: "INV-1", amount: "5000", status: "overdue", dueDate: daysAgo(5) }],
});
check("re-nudges after cooldown", r.effects.some((e) => e.type === "client_message"));

/* --- projects ---------------------------------------------------- */
r = evaluate({
  ...base,
  projects: [
    { id: 20, clientId: 1, title: "Awaiting", status: "in_review", progress: 90, dueDate: null, updatedAt: daysAgo(5) },
    { id: 21, clientId: 1, title: "Just sent", status: "in_review", progress: 90, dueDate: null, updatedAt: daysAgo(1) },
    { id: 22, clientId: 2, title: "Stalled", status: "in_progress", progress: 30, dueDate: null, updatedAt: daysAgo(20) },
    { id: 23, clientId: 2, title: "Done", status: "completed", progress: 100, dueDate: daysAgo(40), updatedAt: daysAgo(40) },
    { id: 24, clientId: 3, title: "Due soon", status: "in_progress", progress: 40, dueDate: daysAhead(1), updatedAt: daysAgo(1) },
    { id: 25, clientId: 3, title: "Past due", status: "in_progress", progress: 80, dueDate: daysAgo(4), updatedAt: daysAgo(1) },
  ],
});
check("stale approval flagged", keys(r).includes("approval_stale:20"));
check("recent approval not flagged", !keys(r).includes("approval_stale:21"));
check("stale approval nudges client", r.effects.some((e) => e.type === "client_message" && e.clientId === 1));
check("stalled project flagged", keys(r).includes("project_stale:22"));
check("completed project ignored", !keys(r).some((k) => k.endsWith(":23")));
check("due-soon project flagged high", r.items.find((i) => i.key === "project_due:24")?.severity === "high");
check("overdue project flagged", keys(r).includes("project_overdue:25"));
check("in_review is not double-counted as stale", !keys(r).includes("project_stale:20"));

/* --- ordering, counts, hygiene ------------------------------------ */
const sev = r.items.map((i) => i.severity);
check("high severity sorts first", sev.indexOf("high") <= (sev.includes("low") ? sev.indexOf("low") : 99));
check("counts add up", r.counts.high + r.counts.medium + r.counts.low === r.items.length);
check("every item has a link", r.items.every((i) => i.href.startsWith("/admin/")));
check("keys are unique", new Set(keys(r)).size === keys(r).length);
check("no NaN in copy", !r.items.some((i) => /NaN|undefined|Invalid/.test(i.title + i.detail)));

/* --- junk input must not throw ------------------------------------ */
r = evaluate({
  ...base,
  leads: [{ id: 1, name: "x", email: "", status: "new", createdAt: null }],
  projects: [{ id: 2, clientId: 1, title: "x", status: "in_progress", progress: 0, dueDate: "not-a-date", updatedAt: null }],
  invoices: [{ id: 3, clientId: 1, number: "", amount: "abc", status: "sent", dueDate: null }],
});
check("null and malformed dates are survived", Array.isArray(r.items));

/* --- empty studio -------------------------------------------------- */
r = evaluate(base);
check("empty studio produces nothing", r.items.length === 0 && r.effects.length === 0);

check("defaults are sane", DEFAULT_RULES.leadSlaHours === 24 && DEFAULT_RULES.nudgeCooldownHours === 72);

if (failures.length) {
  console.error(`✗ ${failures.length} automation assertion(s) failed:`);
  failures.forEach((f) => console.error(`  · ${f}`));
  process.exit(1);
}
console.log("✓ automation rules: leads, invoices, approvals, stale + due projects, cooldowns and junk input all behave");
