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

export type AiProvider = "nvidia" | "gemini" | "none";

export type AiStatus = {
  configured: boolean;
  provider: AiProvider;
  model: string;
  phase: string;
  dailyBudget: number;
  usedToday: number;
};

/**
 * AI providers, in preference order:
 *   1. NVIDIA NIM (free tier) — NVIDIA_API_KEY, OpenAI-compatible endpoint
 *   2. Google Gemini          — GEMINI_API_KEY
 * Budget: AI_DAILY_TOKEN_BUDGET (fallback: GEMINI_DAILY_TOKEN_BUDGET for
 * backwards compatibility with older env setups).
 */
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const NIM_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

export function dailyTokenBudget(): number {
  return Number(
    process.env.AI_DAILY_TOKEN_BUDGET ||
      process.env.GEMINI_DAILY_TOKEN_BUDGET ||
      250_000
  );
}

export function activeProvider(): { provider: AiProvider; model: string } {
  if (process.env.NVIDIA_API_KEY) {
    return {
      provider: "nvidia",
      model: process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct",
    };
  }
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: "gemini",
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    };
  }
  return { provider: "none", model: "none" };
}

export async function todayTokens(): Promise<number> {
  const day = new Date().toISOString().slice(0, 10);
  const rows = await db.select().from(aiUsage).where(eq(aiUsage.day, day)).limit(1);
  return rows[0]?.tokens ?? 0;
}

export async function getAiStatus(): Promise<AiStatus> {
  const { provider, model } = activeProvider();
  return {
    configured: provider !== "none",
    provider,
    model,
    phase: "D",
    dailyBudget: dailyTokenBudget(),
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

async function callGemini(prompt: string, system?: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  try {
    const res = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent?key=${key}`, {
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

async function callNvidia(prompt: string, system?: string): Promise<string | null> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return null;
  const model = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";
  try {
    const res = await fetch(NIM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    const tokens: number = json?.usage?.total_tokens ?? 400;
    if (text) await trackTokens(tokens);
    return text || null;
  } catch {
    return null;
  }
}

export async function generate(prompt: string, system?: string): Promise<string | null> {
  const used = await todayTokens();
  if (used > dailyTokenBudget()) return null;

  const { provider } = activeProvider();
  if (provider === "nvidia") {
    const text = await callNvidia(prompt, system);
    if (text) return text;
    // Fall through to Gemini if NIM fails but a Gemini key exists.
    if (process.env.GEMINI_API_KEY) return callGemini(prompt, system);
    return null;
  }
  if (provider === "gemini") return callGemini(prompt, system);
  return null;
}

export async function gatherStats() {
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
  const outstandingRow = await db
    .select({ total: sql<number>`coalesce(sum(${invoices.amount}), 0)::float` })
    .from(invoices)
    .where(sql`${invoices.status} <> 'paid'`);
  return {
    newLeads30d: newLeads[0]?.n ?? 0,
    newLeads7d: weekLeads[0]?.n ?? 0,
    activeProjects: activeProjects[0]?.n ?? 0,
    unreadClientMessages: unread[0]?.n ?? 0,
    avgRating: Number(avgRating[0]?.a ?? 0).toFixed(1),
    overdueInvoices: overdue[0]?.n ?? 0,
    outstanding: Number(outstandingRow[0]?.total ?? 0),
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

export async function getInsights(): Promise<{ source: "ai" | "rules"; items: string[] }> {
  if (activeProvider().provider !== "none") {
    try {
      const stats = await gatherStats();
      const text = await generate(
        `Studio data: ${JSON.stringify(stats)}. Return exactly 4 short actionable insights for a video editing studio owner, each max 14 words, as a JSON array of strings only.`,
        "You are the operations brain of a premium video editing studio. Be specific and punchy."
      );
      if (text) {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
            return { source: "ai", items: parsed.slice(0, 4) };
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
  cold_email: (i) =>
    `Hi there — I came across your work and thought a quick note was worth it. We're VisionFold Creative, a video editing studio; we cut brand films, YouTube episodes and Shorts (₹700 flat) for teams who want edits that hold attention. If you have footage sitting around or a channel that could use a sharper edit, I'd be happy to show you what we'd do with one sample — no commitment. — VisionFold Studio`,
  update_copy: (i) =>
    `Great news — ${i || "your project"} just moved forward! Here's what changed in this pass:\\n\\n• New edit direction applied\\n• Color grade and sound pass updated\\n• Review link refreshed in your portal\\n\\nNext up: your feedback round. Watch the latest cut and drop us notes — we iterate fast.`,
  email_subject: (i) =>
    `${i || "Your project"} — fresh cut ready for review 🎬`,
  seo_keywords: (i) =>
    `Keyword ideas for "${i || "video editing"}":\\n1. ${i || "video editing"} services\\n2. hire a ${i || "video"} editor\\n3. ${i || "video editing"} agency\\n4. best ${i || "video"} editors for YouTube\\n5. ${i || "video editing"} pricing\\n6. professional ${i || "video"} post-production\\n7. ${i || "video editing"} studio near me\\n8. turnkey ${i || "video"} editing for brands`,
  social_caption: (i) =>
    `${i || "Every frame earns its place."} No fluff, no dead air — just edits that keep people watching. #videoediting #postproduction #brandfilm`,
  content_idea: (i) =>
    `Content ideas about "${i || "video editing"}":\\n1. "5 signs your edit needs a story pass"\\n2. Before/after timeline breakdown of a real client project\\n3. "What a $500 vs $5,000 edit actually changes"\\n4. Round-up of tools we use in the suite this month\\n5. Client interview: how we cut their launch film in 10 days`,
};

const MAX_ASSIST_INPUT = 4_000;

export async function assist(
  kind: string,
  input: string
): Promise<{ source: "ai" | "template"; text: string }> {
  const safeInput = String(input || "").slice(0, MAX_ASSIST_INPUT);
  const template = TEMPLATES[kind];
  const fallback = template ? template(safeInput) : `No template for "${kind}".`;
  if (activeProvider().provider !== "none") {
    const prompts: Record<string, string> = {
      reply_lead: `You are a senior producer at VisionFold Creative, a premium video editing studio (Shorts ₹700 flat, brand films, YouTube editing; based in Indore, India). Write ONE email reply to this lead's inquiry. Rules: sound like a real, experienced human (no corporate fluff, no "leverage/synergy"), be warm and specific, reference their actual service/budget/brief, ask 1–2 concrete questions (footage length, deadline, style references), keep it under 110 words, and end with a clear next step. Do NOT use emojis or bullet spam. Lead context: "${safeInput}"`,
      cold_email: `You are a senior producer at VisionFold Creative, a premium video editing studio. Write a short COLD outreach email (not a reply) to this prospect. Rules: authentic and human (as if written by a real editor, not a template), first line references something about THEM, one honest value point (attention-holding edits, ₹700 Shorts, fast turnaround), zero hype or spam words, under 80 words, close with one soft question. Prospect context: "${safeInput}"`,
      update_copy: `Write a short client-facing project progress update for a video editing studio. Friendly, concrete, bullet points. Topic: "${safeInput}"`,
      email_subject: `Write 3 catchy email subject lines for: "${safeInput}". Return them newline separated.`,
      seo_keywords: `Suggest 8 SEO keywords for a video editing studio page about: "${safeInput}". Return one per line.`,
      social_caption: `Write a punchy Instagram caption for a video editing studio about: "${safeInput}". Max 25 words plus 4 hashtags.`,
      content_idea: `Suggest 5 blog post titles for a video editing studio about: "${safeInput}". Return one per line.`,
    };
    const prompt = prompts[kind];
    if (prompt) {
      const text = await generate(prompt);
      if (text) return { source: "ai", text: text.trim() };
    }
  }
  return { source: "template", text: fallback };
}

export async function recentAiUsage() {
  return db.select().from(aiUsage).orderBy(desc(aiUsage.day)).limit(14);
}
