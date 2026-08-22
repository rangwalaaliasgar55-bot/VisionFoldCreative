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
import { getSetting } from "@/lib/settings";

export type AiProviderId = "nvidia" | "gemini" | "openai" | "pollinations";
export type AiProvider = AiProviderId | "none";

export type ProviderStatus = {
  id: AiProviderId;
  label: string;
  model: string;
  configured: boolean;
  source: "env" | "runtime" | "keyless" | "none";
  keyHint?: string; // last 4 chars of a runtime-stored key
  freeTierUrl?: string;
};

export type AiStatus = {
  configured: boolean;
  provider: AiProvider;
  model: string;
  phase: string;
  dailyBudget: number;
  usedToday: number;
  providers: ProviderStatus[];
};

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const NIM_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
/** Keyless public endpoint — zero signup, used as the always-on fallback. */
const POLLINATIONS_ENDPOINT = "https://text.pollinations.ai/";

export const PROVIDER_META: Record<
  Exclude<AiProviderId, "pollinations">,
  { label: string; defaultModel: string; envVar: string; settingKey: string; freeTierUrl: string }
> = {
  nvidia: {
    label: "NVIDIA NIM",
    defaultModel: process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct",
    envVar: "NVIDIA_API_KEY",
    settingKey: "ai_key_nvidia",
    freeTierUrl: "https://build.nvidia.com",
  },
  gemini: {
    label: "Google Gemini",
    defaultModel: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    envVar: "GEMINI_API_KEY",
    settingKey: "ai_key_gemini",
    freeTierUrl: "https://aistudio.google.com/apikey",
  },
  openai: {
    label: "OpenAI · ChatGPT",
    defaultModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
    envVar: "OPENAI_API_KEY",
    settingKey: "ai_key_openai",
    freeTierUrl: "https://platform.openai.com/api-keys",
  },
} as const;

export function dailyTokenBudget(): number {
  return Number(
    process.env.AI_DAILY_TOKEN_BUDGET ||
      process.env.GEMINI_DAILY_TOKEN_BUDGET ||
      250_000
  );
}

async function resolveKey(id: Exclude<AiProviderId, "pollinations">): Promise<{
  key: string;
  source: "env" | "runtime" | "none";
}> {
  const envKey =
    id === "nvidia"
      ? process.env.NVIDIA_API_KEY
      : id === "gemini"
        ? process.env.GEMINI_API_KEY
        : process.env.OPENAI_API_KEY;
  if (envKey) return { key: envKey, source: "env" };
  try {
    const runtimeKey = await getSetting(PROVIDER_META[id].settingKey);
    if (typeof runtimeKey === "string" && runtimeKey.trim()) {
      return { key: runtimeKey.trim(), source: "runtime" };
    }
  } catch {
    /* DB not ready */
  }
  return { key: "", source: "none" };
}

/** Full provider matrix — never returns raw keys, only hints. */
export async function getProviderMatrix(): Promise<ProviderStatus[]> {
  const statuses: ProviderStatus[] = [];
  for (const id of ["gemini", "nvidia", "openai"] as const) {
    const meta = PROVIDER_META[id];
    const { key, source } = await resolveKey(id);
    statuses.push({
      id,
      label: meta.label,
      model: meta.defaultModel,
      configured: Boolean(key),
      source: source === "none" ? "none" : source,
      keyHint: source === "runtime" ? `••••${key.slice(-4)}` : undefined,
      freeTierUrl: meta.freeTierUrl,
    });
  }
  statuses.push({
    id: "pollinations",
    label: "Pollinations",
    model: "openai (free relay)",
    configured: true,
    source: "keyless",
    freeTierUrl: "https://pollinations.ai",
  });
  return statuses;
}

export async function activeProvider(): Promise<{
  provider: AiProvider;
  model: string;
}> {
  for (const id of ["gemini", "nvidia", "openai"] as const) {
    const { key } = await resolveKey(id);
    if (key) return { provider: id, model: PROVIDER_META[id].defaultModel };
  }
  // Pollinations needs no key — it is always a candidate.
  return { provider: "pollinations", model: "openai (free relay)" };
}

export async function todayTokens(): Promise<number> {
  const day = new Date().toISOString().slice(0, 10);
  const rows = await db.select().from(aiUsage).where(eq(aiUsage.day, day)).limit(1);
  return rows[0]?.tokens ?? 0;
}

export async function getAiStatus(): Promise<AiStatus> {
  const { provider, model } = await activeProvider();
  const providers = await getProviderMatrix();
  return {
    configured: true, // pollinations is always available
    provider,
    model,
    phase: "E",
    dailyBudget: dailyTokenBudget(),
    usedToday: await todayTokens(),
    providers,
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

function estimateTokens(...texts: string[]): number {
  return Math.max(1, Math.ceil(texts.      join(" ").length / 4));
}

// ---------------------------------------------------------------------------
// Diagnostics — test each provider individually and report the REAL reason
// it failed (status code + body snippet + a human hint), instead of the
// silent null-swallowing the generation chain uses.
// ---------------------------------------------------------------------------

export type ProviderDiagnosis = {
  id: AiProviderId | "pollinations";
  label: string;
  configured: boolean;
  source: "env" | "runtime" | "keyless" | "none";
  ok: boolean;
  httpStatus?: number;
  errorSnippet?: string;
  hint?: string;
};

function hintFor(id: string, status: number, body: string): string {
  const b = body.toLowerCase();
  if (id === "openai" && status === 401) return "Key is invalid or revoked. Create a new one at platform.openai.com/api-keys.";
  if (id === "openai" && status === 429 && b.includes("billing")) return "OpenAI requires billing credit. Add a payment method or use the free Gemini/NVIDIA tiers.";
  if (id === "gemini" && status === 400 && b.includes("api key")) return "Key not valid for this API. Use a key from https://aistudio.google.com/apikey (not Google Cloud/Vertex).";
  if (id === "gemini" && status === 403) return "Key lacks permission — generate a fresh AI Studio key.";
  if (id === "gemini" && status === 429) return "Free-tier quota hit. Wait a minute or add a second provider to the chain.";
  if (id === "nvidia" && (status === 401 || status === 403)) return "NVIDIA key invalid. Regenerate at build.nvidia.com (Personal key, NGC).";
  if (id === "nvidia" && status === 404) return "Model not available for this NVIDIA account — try meta/llama-3.1-8b-instruct.";
  if (id === "pollinations" && status === 402) return "Public relay is rate-limited right now — it's only a fallback; add any real provider key.";
  if (status >= 500) return "Provider had a server error — transient, try again.";
  if (status === 0) return "Network unreachable from the server (DNS/firewall/timeout).";
  return `HTTP ${status} — see snippet.`;
}

export async function diagnoseAllProviders(): Promise<ProviderDiagnosis[]> {
  const results: ProviderDiagnosis[] = [];
  const probe = "Reply with the single word: ready.";

  for (const id of ["gemini", "nvidia", "openai"] as const) {
    const { key, source } = await resolveKey(id);
    if (!key) {
      results.push({
        id,
        label: PROVIDER_META[id].label,
        configured: false,
        source: "none",
        ok: false,
        hint: `No ${PROVIDER_META[id].label} key set (${PROVIDER_META[id].envVar} env or saved here). Free key: ${PROVIDER_META[id].freeTierUrl}`,
      });
      continue;
    }
    let status = 0;
    let snippet = "";
    let text: string | null = null;
    try {
      let res: Response;
      if (id === "gemini") {
        res = await fetch(`${GEMINI_ENDPOINT}/${PROVIDER_META.gemini.defaultModel}:generateContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: probe }] }] }),
          signal: AbortSignal.timeout(20_000),
        });
      } else {
        const endpoint = id === "nvidia" ? NIM_ENDPOINT : OPENAI_ENDPOINT;
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: PROVIDER_META[id].defaultModel,
            messages: [{ role: "user", content: probe }],
            max_tokens: 8,
            stream: false,
          }),
          signal: AbortSignal.timeout(20_000),
        });
      }
      status = res.status;
      if (!res.ok) {
        snippet = (await res.text().catch(() => "")).slice(0, 180);
      } else {
        const json: any = await res.json().catch(() => null);
        text =
          json?.choices?.[0]?.message?.content ??
          json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ??
          "";
      }
    } catch (err) {
      snippet = err instanceof Error ? err.message : String(err);
    }
    const ok = Boolean(text);
    results.push({
      id,
      label: PROVIDER_META[id].label,
      configured: true,
      source,
      ok,
      httpStatus: status,
      errorSnippet: ok ? undefined : snippet,
      hint: ok ? `Answered correctly.` : hintFor(id, status, snippet),
    });
  }

  // Pollinations best-effort check.
  try {
    const res = await fetch(POLLINATIONS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai", messages: [{ role: "user", content: probe }], referrer: process.env.APP_URL || "" }),
      signal: AbortSignal.timeout(30_000),
    });
    const ok = res.ok;
    results.push({
      id: "pollinations",
      label: "Pollinations (keyless relay)",
      configured: true,
      source: "keyless",
      ok,
      httpStatus: res.status,
      errorSnippet: ok ? undefined : (await res.text().catch(() => "")).slice(0, 140),
      hint: ok ? "Relay answered." : hintFor("pollinations", res.status, ""),
    });
  } catch (err) {
    results.push({
      id: "pollinations",
      label: "Pollinations (keyless relay)",
      configured: true,
      source: "keyless",
      ok: false,
      httpStatus: 0,
      errorSnippet: err instanceof Error ? err.message : "",
      hint: hintFor("pollinations", 0, ""),
    });
  }

  return results;
}

async function callGemini(prompt: string, system?: string): Promise<string | null> {
  const { key } = await resolveKey("gemini");
  if (!key) return null;
  const model = PROVIDER_META.gemini.defaultModel;
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
    if (text) await trackTokens(json?.usageMetadata?.totalTokenCount ?? estimateTokens(prompt, text));
    return text || null;
  } catch {
    return null;
  }
}

/** OpenAI-compatible chat completion (covers NVIDIA NIM, OpenAI). */
async function callOpenAICompatible(
  id: "nvidia" | "openai",
  prompt: string,
  system?: string
): Promise<string | null> {
  const { key } = await resolveKey(id);
  if (!key) return null;
  const endpoint = id === "nvidia" ? NIM_ENDPOINT : OPENAI_ENDPOINT;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: PROVIDER_META[id].defaultModel,
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
    if (text) await trackTokens(json?.usage?.total_tokens ?? estimateTokens(prompt, text));
    return text || null;
  } catch {
    return null;
  }
}

/**
 * Pollinations — public AI relay. Historically keyless; some deployments now
 * rate-limit or gate anonymous traffic (HTTP 402), so this is a best-effort
 * LAST resort before the rules engine takes over. The app never depends on it.
 */
async function callPollinations(prompt: string, system?: string): Promise<string | null> {
  const referer = process.env.APP_URL || "https://visionfoldcreative.vercel.app";
  try {
    const res = await fetch(POLLINATIONS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Referer: referer },
      body: JSON.stringify({
        model: "openai",
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
        referrer: referer,
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return null;
    let text = (await res.text()).trim();
    if (text.startsWith("{") && text.includes("\"error\"")) return null;
    if (text) await trackTokens(estimateTokens(prompt, text));
    return text || null;
  } catch {
    return null;
  }
}

/**
 * Tries every configured provider in quality order:
 *   NVIDIA NIM → Gemini → OpenAI (ChatGPT) → Pollinations (keyless) → null
 */
export async function generate(prompt: string, system?: string): Promise<string | null> {
  const used = await todayTokens();
  if (used > dailyTokenBudget()) return null;

  // Gemini first: free tier, most reliable in practice. NVIDIA/OpenAI follow.
  const viaGemini = await callGemini(prompt, system);
  if (viaGemini) return viaGemini;

  const viaNvidia = await callOpenAICompatible("nvidia", prompt, system);
  if (viaNvidia) return viaNvidia;

  const viaOpenai = await callOpenAICompatible("openai", prompt, system);
  if (viaOpenai) return viaOpenai;

  return callPollinations(prompt, system);
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
  return { source: "rules", items: await rulesInsights() };
}

const TEMPLATES: Record<string, (input: string) => string> = {
  whatsapp_intro: (i) => {
    // input = JSON string of lead context; graceful parse for safety.
    let lead: any = {};
    try {
      lead = JSON.parse(i || "{}");
    } catch {
      /* plain input */
    }
    const name = String(lead.name || "").trim();
    const firstName = name.split(" ")[0] || "there";
    const service = String(lead.service || "your project").replace(/inquiry|enquiry/i, "").trim() || "your project";
    const budget = String(lead.budget || "").trim();
    const budgetLine = budget
      ? `Saw you're thinking around ${budget.startsWith("$") || budget.startsWith("₹") ? budget : `₹${budget}`} — we can work with that.`
      : "";
    return [
      `Hi ${firstName}! Aliasgar this side 👋`,
      ``,
      `I run VisionFold Creative — a video editing studio. We make brand films, YouTube edits and ads that people actually finish watching.`,
      ``,
      `Just read your inquiry about ${service}. Honestly? Exactly the kind of project we love.`,
      budgetLine,
      ``,
      `Super simple next step:`,
      `→ Drop your footage link + deadline`,
      `→ You get a plan and timeline back within 24 hours`,
      `→ First cut lands fast, revisions till it feels inevitable 🎬`,
      ``,
      `One quick question before we dive in — what's the ONE feeling you want viewers walking away with?`,
      ``,
      `— Aliasgar`,
      `VisionFold Creative`,
    ].filter(Boolean).join("\n");
  },
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
  {
    const prompts: Record<string, string> = {
      whatsapp_intro: `You are Aliasgar, founder of VisionFold Creative — a premium video editing studio in Indore, India (brand films, YouTube edits, ads; Shorts from ₹700). Write ONE first-contact WhatsApp message to a new lead. Lead context: "${safeInput}".
Rules:
- Sound like a real, warm, confident human founder texting from his phone — NOT a corporate bot. No "Dear Sir", no buzzwords.
- Open with the lead's first name + a light hook (reference their service/goal specifically).
- Briefly introduce VisionFold Creative + yourself by name, once.
- Make the value obvious fast: retention-first edits, 24h plan turnaround, revisions until it feels right.
- End with ONE easy question that gets them replying (deadline, footage location, or the feeling they want viewers to have).
- WhatsApp length: max ~110 words. Line breaks between thoughts. At most one emoji. No bullet spam, no links unless they asked.`,
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
