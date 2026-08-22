import type { Client, Invoice, Lead, Message, Project, Rating } from "@/db/schema";

export type ClientHealth = {
  clientId: number;
  name: string;
  score: number;
  label: "healthy" | "watch" | "at_risk";
  reasons: string[];
};

function daysBetween(a: Date | string | null | undefined, b: Date | string | null | undefined): number | null {
  if (!a || !b) return null;
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  if (!Number.isFinite(t1) || !Number.isFinite(t2)) return null;
  return Math.abs(t2 - t1) / 86400_000;
}

export function winRate(leads: Pick<Lead, "status">[]): number {
  if (!leads.length) return 0;
  const won = leads.filter((l) => l.status === "won").length;
  return Math.round((won / leads.length) * 100);
}

/** Average days from project create → completed. */
export function cycleTimeDays(projects: Pick<Project, "status" | "createdAt" | "updatedAt">[]): number {
  const done = projects.filter((p) => p.status === "completed");
  const samples = done
    .map((p) => daysBetween(p.createdAt, p.updatedAt))
    .filter((n): n is number => n !== null && n >= 0);
  if (!samples.length) return 0;
  return Math.round((samples.reduce((s, n) => s + n, 0) / samples.length) * 10) / 10;
}

export function conversionFunnel(leads: Pick<Lead, "status">[]) {
  const total = leads.length;
  const contacted = leads.filter((l) => l.status === "contacted" || l.status === "won" || l.status === "proposal").length;
  const proposal = leads.filter((l) => l.status === "proposal" || l.status === "won").length;
  const won = leads.filter((l) => l.status === "won").length;
  return [
    { label: "Leads", value: total },
    { label: "Contacted", value: contacted },
    { label: "Proposal", value: proposal },
    { label: "Won", value: won },
  ];
}

/**
 * 0–100 health score per client from real operational signals:
 * overdue invoices, stalled projects, unread messages, ratings.
 */
export function clientHealthScores(input: {
  clients: Pick<Client, "id" | "name" | "status">[];
  projects: Pick<Project, "id" | "clientId" | "status" | "progress" | "updatedAt" | "dueDate">[];
  invoices: Pick<Invoice, "clientId" | "status" | "dueDate">[];
  messages: Pick<Message, "clientId" | "sender" | "read" | "createdAt">[];
  ratings: Pick<Rating, "clientId" | "stars">[];
}): ClientHealth[] {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = Date.now() - 7 * 86400_000;

  return input.clients.map((client) => {
    let score = 80;
    const reasons: string[] = [];
    const theirs = input.projects.filter((p) => p.clientId === client.id);
    const bills = input.invoices.filter((i) => i.clientId === client.id);
    const msgs = input.messages.filter((m) => m.clientId === client.id);
    const reviews = input.ratings.filter((r) => r.clientId === client.id);

    if (client.status !== "active") {
      score -= 25;
      reasons.push("Account is not active");
    }

    const overdue = bills.filter((i) => i.status === "overdue" || (i.status !== "paid" && i.dueDate && i.dueDate < today));
    if (overdue.length) {
      score -= Math.min(30, overdue.length * 12);
      reasons.push(`${overdue.length} overdue invoice${overdue.length > 1 ? "s" : ""}`);
    }

    const stalled = theirs.filter((p) => {
      if (p.status === "completed") return false;
      const updated = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
      return updated > 0 && updated < weekAgo && (p.progress || 0) < 100;
    });
    if (stalled.length) {
      score -= Math.min(20, stalled.length * 8);
      reasons.push(`${stalled.length} stalled project${stalled.length > 1 ? "s" : ""}`);
    }

    const unread = msgs.filter((m) => m.sender === "client" && !m.read).length;
    if (unread) {
      score -= Math.min(15, unread * 5);
      reasons.push(`${unread} unread client message${unread > 1 ? "s" : ""}`);
    }

    if (reviews.length) {
      const avg = reviews.reduce((s, r) => s + Number(r.stars || 0), 0) / reviews.length;
      if (avg >= 4.5) {
        score += 8;
        reasons.push(`Strong reviews (${avg.toFixed(1)}★)`);
      } else if (avg < 3.5) {
        score -= 12;
        reasons.push(`Low reviews (${avg.toFixed(1)}★)`);
      }
    }

    if (!theirs.length && !bills.length) {
      score -= 10;
      reasons.push("No active work on file");
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    const label: ClientHealth["label"] = score >= 75 ? "healthy" : score >= 50 ? "watch" : "at_risk";
    if (!reasons.length) reasons.push("On track");
    return { clientId: client.id, name: client.name, score, label, reasons };
  });
}

export function editorWorkload(projects: Pick<Project, "status" | "progress" | "dueDate" | "title">[]) {
  const open = projects.filter((p) => p.status !== "completed");
  const review = open.filter((p) => p.status === "review" || p.status === "revision");
  const dueSoon = open.filter((p) => {
    if (!p.dueDate) return false;
    const due = new Date(p.dueDate).getTime();
    return due - Date.now() < 7 * 86400_000 && due >= Date.now();
  });
  const overdue = open.filter((p) => p.dueDate && p.dueDate < new Date().toISOString().slice(0, 10));
  const avgProgress = open.length
    ? Math.round(open.reduce((s, p) => s + Number(p.progress || 0), 0) / open.length)
    : 0;
  return {
    open: open.length,
    review: review.length,
    dueSoon: dueSoon.length,
    overdue: overdue.length,
    avgProgress,
    capacityUsed: Math.min(100, Math.round((open.length / 20) * 100)),
  };
}
