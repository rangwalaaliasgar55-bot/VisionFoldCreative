import { bad, ok, readBody, requireStaff } from "@/lib/auth";
import {
  assist,
  getAiStatus,
  getInsights,
  generate,
  PROVIDER_META,
  KEYED_PROVIDERS,
  activeProvider,
  diagnoseAllProviders,
  studioChat,
  listConversations,
  getConversation,
  getAiInstructions,
  getAiSkills,
  getPreferredProvider,
  enrichProspect,
  DEFAULT_AI_INSTRUCTIONS,
  DEFAULT_AI_SKILLS,
  type AiSkill,
} from "@/lib/ai";
import { setSetting } from "@/lib/settings";
import { setRuntimeKey } from "@/lib/runtimeKeys";
import { originCheck } from "@/lib/security";
import { throttled } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const admin = await requireStaff(["admin", "editor"]);
  if (!admin) return bad("Unauthorized", 401);
  const url = new URL(req.url);
  const conversationId = Number(url.searchParams.get("conversation") || 0);
  if (conversationId) {
    const data = await getConversation(conversationId);
    if (!data) return bad("Not found", 404);
    return ok(data);
  }
  if (url.searchParams.get("threads") === "1") {
    return ok({ threads: await listConversations(admin.id) });
  }
  if (url.searchParams.get("skills") === "1") {
    return ok({
      instructions: await getAiInstructions(),
      skills: await getAiSkills(),
      preferred: await getPreferredProvider(),
      defaults: { instructions: DEFAULT_AI_INSTRUCTIONS, skills: DEFAULT_AI_SKILLS },
    });
  }
  return ok({ ...(await getAiStatus()) });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ action: string }> }
) {
  const csrf = originCheck(req);
  if (csrf) return csrf;
  const admin = await requireStaff(["admin", "editor"]);
  if (!admin) return bad("Unauthorized", 401);
  const { action } = await ctx.params;
  const body = await readBody<Record<string, any>>(req);

  if (action === "insights") {
    return ok(await getInsights());
  }

  if (action === "assist") {
    const kind = String(body.kind || "");
    const input = String(body.input || "");
    return ok(await assist(kind, input));
  }

  if (action === "chat") {
    if (await throttled(`ai-chat:${admin.id}`, 40, 10 * 60_000)) {
      return bad("Slow down — daily copilot budget for this session.", 429);
    }
    const providerRaw = String(body.provider || "");
    const provider = KEYED_PROVIDERS.includes(providerRaw as any) ? (providerRaw as (typeof KEYED_PROVIDERS)[number]) : undefined;
    try {
      const result = await studioChat({
        staffId: admin.id,
        conversationId: body.conversationId ? Number(body.conversationId) : undefined,
        message: String(body.message || ""),
        provider,
      });
      return ok(result);
    } catch (err) {
      return bad(err instanceof Error ? err.message : "Chat failed");
    }
  }

  if (action === "enrich-prospect") {
    const brief = await enrichProspect({
      name: String(body.name || ""),
      website: String(body.website || ""),
      phone: String(body.phone || ""),
      types: Array.isArray(body.types) ? body.types.map(String) : [],
      address: String(body.address || ""),
    });
    return ok(brief);
  }

  if (action === "save-skills") {
    if (admin.role !== "admin") return bad("Only the owner can edit AI instructions.", 403);
    const instructions = String(body.instructions || "").slice(0, 8_000);
    await setSetting("ai_instructions", instructions || DEFAULT_AI_INSTRUCTIONS);
    setRuntimeKey("ai_instructions", instructions);
    if (Array.isArray(body.skills)) {
      const skills: AiSkill[] = body.skills
        .filter((s: any) => s && s.name)
        .map((s: any) => ({
          id: String(s.id || s.name).slice(0, 40),
          name: String(s.name).slice(0, 80),
          instructions: String(s.instructions || "").slice(0, 2_000),
          enabled: Boolean(s.enabled),
        }));
      await setSetting("ai_skills", skills);
    }
    return ok({ ok: true });
  }

  if (action === "set-preferred") {
    if (admin.role !== "admin") return bad("Only the owner can pick the default provider.", 403);
    const provider = String(body.provider || "gemini");
    const allowed = ["auto", "gemini", "grok", "groq", "nvidia", "openai"];
    if (!allowed.includes(provider)) return bad("Unknown provider.");
    await setSetting("ai_preferred_provider", provider);
    setRuntimeKey("ai_preferred_provider", provider);
    return ok({ ok: true, preferred: provider });
  }

  // --- Runtime key management (owner only; keys never echoed back) ---------
  if (action === "save-key") {
    if (admin.role !== "admin") return bad("Only the owner can manage AI keys.", 403);
    const provider = String(body.provider || "") as keyof typeof PROVIDER_META;
    const meta = PROVIDER_META[provider];
    if (!meta) return bad("Unknown provider.");
    const key = String(body.key || "").trim();
    if (!key) return bad("Paste a key first.");
    if (key.length < 12) return bad("That doesn't look like a valid API key.");
    await setSetting(meta.settingKey, key);
    return ok({ ok: true, provider, hint: `••••${key.slice(-4)}` });
  }

  if (action === "clear-key") {
    if (admin.role !== "admin") return bad("Only the owner can manage AI keys.", 403);
    const provider = String(body.provider || "") as keyof typeof PROVIDER_META;
    const meta = PROVIDER_META[provider];
    if (!meta) return bad("Unknown provider.");
    await setSetting(meta.settingKey, "");
    return ok({ ok: true, provider });
  }

  if (action === "diagnose") {
    const results = await diagnoseAllProviders();
    return ok({ results });
  }

  if (action === "test") {
    const before = await activeProvider();
    const text = await generate(
      'Reply with exactly one word: "ready".',
      "You are a connection tester. Reply with exactly one word."
    );
    const after = await activeProvider();
    return ok({
      ok: Boolean(text),
      reply: (text || "").slice(0, 40),
      provider: after.provider,
      model: after.model,
      note:
        before.provider === after.provider
          ? undefined
          : "Primary provider failed — fell back down the chain.",
    });
  }

  return bad("Unknown action", 404);
}
