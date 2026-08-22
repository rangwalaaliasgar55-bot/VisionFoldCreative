import { bad, ok, readBody, requireStaff } from "@/lib/auth";
import { assist, getAiStatus, getInsights, generate, PROVIDER_META, activeProvider, diagnoseAllProviders } from "@/lib/ai";
import { setSetting } from "@/lib/settings";
import { originCheck } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
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

  // --- Runtime key management (owner only; keys never echoed back) ---------
  if (action === "save-key") {
    if (admin.role !== "admin") return bad("Only the owner can manage AI keys.", 403);
    const provider = String(body.provider || "") as keyof typeof PROVIDER_META;
    const meta = PROVIDER_META[provider as "nvidia" | "gemini" | "openai"];
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
    const meta = PROVIDER_META[provider as "nvidia" | "gemini" | "openai"];
    if (!meta) return bad("Unknown provider.");
    await setSetting(meta.settingKey, "");
    return ok({ ok: true, provider });
  }

  // Full per-provider diagnostic with real error reasons.
  if (action === "diagnose") {
    const results = await diagnoseAllProviders();
    return ok({ results });
  }

  // Live check: asks the current chain a trivial question and reports who answered.
  if (action === "test") {
    const before = await activeProvider();
    const text = await generate(
      'Reply with exactly one word: "ready".',
      "You are a connection tester."
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
