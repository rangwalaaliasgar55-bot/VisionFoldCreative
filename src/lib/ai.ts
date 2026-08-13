import { db } from "@/db";
import {
  aiUsage,
  invoices,
  leads,
  messages,
  projects,
  ratings,
} from "@/db/schema";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";

export type AiStatus = {
  configured: boolean;
  provider: "gemini" | "none";
  model: string;
  phase: string;
  dailyBudget: number;
  usedToday: number;
};

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export async function todayTokens(): Promise<number> {
  const day = new Date().toISOString().slice(0, 10);
  const rows = await db.select().from(aiUsage).where(eq(aiUsage.day, day)).limit(1);
  return rows[0]?.tokens ?? 0;
}

export async function getAiStatus(): Promise<AiStatus> {
  const configured = Boolean(process.env.GEMINI_API_KEY);
  return {
    configured,
    provider: configured ? "gemini" : "none",
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    phase: "D",
    dailyBudget: Number(process.env.GEMINI_DAILY_TOKEN_BUDGET || 250_000),
    usedToday: await todayTokens(),
  };
}

async function trackTokens(tokens: number) {
  const day = new Date().toISOString().slice(0, 10);
  await db
    .insert(aiUsage)
    .values({ day, tokens })
    .onConflictDoUpdate({
      target: aiUsage.day,
      set: { tokens: sql`${aiUsage.tokens} + ${tokens}` },
    });
}

export async function gemini(prompt: string, system?: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const budget = Number(process.env.GEMINI_DAILY_TOKEN_BUDGET || 250_000);
  const used = await todayTokens();
  if (used > budget) return null;
  try {
    const res = await fetch(`${ENDPOINT}/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: system ? `${system}\n\n${prompt}` : prompt }] },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const text: string =
      json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
    const tokens: number = json?.usageMetadata?.totalTokenCount ?? 400;
    if (text) await trackTokens(tokens);
    return text || null;
  } catch {
    return null;
  }
}

async function gatherStats() {
  const dayAgo = new Date(Date.now() - 30 * 86400_000);
  const weekAgo = new Date(Date.now() - 7 * 86400_000);
  const newLeads = await db.select({ n: sql<number>`count(*)::int` }).from(leads).where(gte(leads.createdAt, dayAgo));
  const activeProjects = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(projects)
    .where(and(lt(projects.progress, 100), sql`${projects.status} <> 'completed'`));
  const unread = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.read, false), eq(messages.sender, "client")));
  const weekLeads = await db.select({ n: sql<number>`count(*)::int` }).from(leads).where(gte(leads.createdAt, weekAgo));
  const avgRating = await db.select({ a: sql<number>`coalesce(avg(${ratings.stars})::float, 0)` }).from(ratings);
  const overdue = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(invoices)
    .where(and(lt(invoices.dueDate, new Date().toISOString().slice(0, 10)), sql`${invoices.status} <> 'paid'`));
  return {
    newLeads30d: newLeads[0]?.n ?? 0,
    newLeads7d: weekLeads[0]?.n ?? 0,
    activeProjects: activeProjects[0]?.n ?? 0,
    unreadClientMessages: unread[0]?.n ?? 0,
    avgRating: Number(avgRating[0]?.a ?? 0).toFixed(1),
    overdueInvoices: overdue[0]?.n ?? 0,
  };
}

export async function rulesInsights(): Promise<string[]> {
  const s = await gatherStats();
  const items: string[] = [];
  if (s.newLeads30d === 0) items.push("No new leads in 30 days — consider refreshing the portfolio section or running the social caption generator.");
  if (s.newLeads7d > 0) items.push(`${s.newLeads7d} new lead${s.newLeads7d > 1 ? "s" : ""} this week — follow up within 24h for best conversion.`);
  if (s.overdueInvoices > 0) items.push(`${s.overdueInvoices} invoice${s.overdueInvoices > 1 ? "s are" : " is"} overdue — run the invoice reminder automation.`);
  if (s.activeProjects === 0) items.push("No active projects in the pipeline — consider outreach to past clients.");
  if (s.unreadClientMessages > 0) items.push(`${s.unreadClientMessages} unread client message${s.unreadClientMessages > 1 ? "s" : ""} waiting for a reply.`);
  if (Number(s.avgRating) >= 4.5) items.push(`Public rating averages ${s.avgRating}★ — great social proof, keep collecting reviews.`);
  else if (Number(s.avgRating) > 0) items.push(`Average rating is ${s.avgRating}★ — ask completing clients for a review via the completion automation.`);
  if (items.length < 4) items.push("Tip: import leads in bulk from CSV to jumpstart outreach.");
  return items.slice(0, 4);
}

export async function getInsights(): Promise<{ source: "gemini" | "rules"; items: string[] }> {
  if (process.env.GEMINI_API_KEY) {
    try {
      const stats = await gatherStats();
      const text = await gemini(
        `Studio data: ${JSON.stringify(stats)}. Return exactly 4 short actionable insights for a video editing studio owner, each max 14 words, as a JSON array of strings only.`,
        "You are the operations brain of a premium video editing studio. Be specific and punchy."
      );
      if (text) {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
            return { source: "gemini", items: parsed.slice(0, 4) };
          }
        }
      }
    } catch {
      /* fall through to rules */
    }
  }
  return { source: "rules", items: await rulesInsights() };
}

const TEMPLATES: Record<string, (input: string) => string> = {
  reply_lead: (i) =>
    `Hi there — thanks so much for reaching out about ${i || "your project"}! We'd love to learn more about your footage, timeline and goals. Could you share a few details (duration, style references, deadline)? We'll come back with a plan and a quote within 24 hours. — The VisionFold team`,
  update_copy: (i) =>
    `Great news — ${i || "your project"} just moved forward! Here's what changed in this pass:\n\n• New edit direction applied\n• Color grade and sound pass updated\n• Review link refreshed in your portal\n\nNext up: your feedback round. Watch the latest cut and drop us notes — we iterate fast.`,
  email_subject: (i) =>
    `${i || "Your project"} — fresh cut ready for review 🎬`,
  seo_keywords: (i) =>
    `Keyword ideas for "${i || "video editing"}":\n1. ${i || "video editing"} services\n2. hire a ${i || "video"} editor\n3. ${i || "video editing"} agency\n4. best ${i || "video"} editors for YouTube\n5. ${i || "video editing"} pricing\n6. professional ${i || "video"} post-production\n7. ${i || "video editing"} studio near me\n8. turnkey ${i || "video"} editing for brands`,
  social_caption: (i) =>
    `${i || "Every frame earns its place."} No fluff, no dead air — just edits that keep people watching. #videoediting #postproduction #brandfilm`,
  content_idea: (i) =>
    `Content ideas about "${i || "video editing"}":\n1. "5 signs your edit needs a story pass"\n2. Before/after timeline breakdown of a real client project\n3. "What a $500 vs $5,000 edit actually changes"\n4. Round-up of tools we use in the suite this month\n5. Client interview: how we cut their launch film in 10 days`,
};

export async function assist(
  kind: string,
  input: string
): Promise<{ source: "gemini" | "template"; text: string }> {
  const template = TEMPLATES[kind];
  const fallback = template ? template(input) : `No template for "${kind}".`;
  if (process.env.GEMINI_API_KEY) {
    const prompts: Record<string, string> = {
      reply_lead: `Draft a warm, professional reply to this lead inquiry for a premium video editing studio. Keep it under 90 words, ask for footage details, timeline and style references: "${input}"`,
      update_copy: `Write a short client-facing project progress update for a video editing studio. Friendly, concrete, bullet points. Topic: "${input}"`,
      email_subject: `Write 3 catchy email subject lines for: "${input}". Return them newline separated.`,
      seo_keywords: `Suggest 8 SEO keywords for a video editing studio page about: "${input}". Return one per line.`,
      social_caption: `Write a punchy Instagram caption for a video editing studio about: "${input}". Max 25 words plus 4 hashtags.`,
      content_idea: `Suggest 5 blog post titles for a video editing studio about: "${input}". Return one per line.`,
    };
    const prompt = prompts[kind];
    if (prompt) {
      const text = await gemini(prompt);
      if (text) return { source: "gemini", text: text.trim() };
    }
  }
  return { source: "template", text: fallback };
}

export async function recentAiUsage() {
  return db.select().from(aiUsage).orderBy(desc(aiUsage.day)).limit(14);
}
