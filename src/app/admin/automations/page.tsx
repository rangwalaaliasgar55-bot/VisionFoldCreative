"use client";

import { useState } from "react";
import {
  api,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
  toast,
  useApi,
} from "@/components/AdminUI";
import { fmtDate } from "@/lib/utils";
import { Brain, Copy, Play, Sparkles, Wand2, Zap } from "lucide-react";

type AutoRow = { id: number; name: string; trigger: string; description: string; enabled: boolean; lastRunAt: string | null };
type ProviderRow = {
  id: "nvidia" | "gemini" | "openai" | "pollinations";
  label: string;
  model: string;
  configured: boolean;
  source: "env" | "runtime" | "keyless" | "none";
  keyHint?: string;
  freeTierUrl?: string;
};
type AiStatus = {
  configured: boolean;
  provider: string;
  model: string;
  dailyBudget: number;
  usedToday: number;
  phase: string;
  providers?: ProviderRow[];
};

const TOOLS = [
  { key: "reply_lead", label: "Reply to a lead", placeholder: "Paste the lead's inquiry here…" },
  { key: "update_copy", label: "Project update copy", placeholder: "e.g. Brand film v2 delivered, new music, faster opening" },
  { key: "email_subject", label: "Email subject lines", placeholder: "e.g. Fresh cut ready for review" },
  { key: "seo_keywords", label: "SEO keywords", placeholder: "e.g. color grading services" },
  { key: "social_caption", label: "Social caption", placeholder: "e.g. We edited a launch film in 10 days" },
  { key: "content_idea", label: "Blog content ideas", placeholder: "e.g. wedding films" },
];

export default function AdminAutomationsPage() {
  const { data: automations, loading, reload } = useApi<AutoRow[]>("/api/admin/automations");
  const { data: aiStatus, reload: reloadAi } = useApi<AiStatus>("/api/ai/status");
  const { data: me } = useApi<{ user: { role: string } | null }>("/api/auth/me");
  const isAdmin = me?.user?.role === "admin";
  const [running, setRunning] = useState<string | null>(null);
  const [tool, setTool] = useState(TOOLS[0].key);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<{ text: string; source: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [keyDrafts, setKeyDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; provider?: string; reply?: string } | null>(null);

  async function toggle(auto: AutoRow) {
    try {
      await api(`/api/admin/automations/${auto.id}`, { method: "PATCH", json: { enabled: !auto.enabled } });
      toast(`${auto.name} ${auto.enabled ? "disabled" : "enabled"}`);
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  async function saveKey(provider: string) {
    try {
      setSaving(provider);
      await api("/api/ai/save-key", { json: { provider, key: keyDrafts[provider] } });
      toast("Key saved — live immediately, no deploy needed");
      setKeyDrafts((d) => ({ ...d, [provider]: "" }));
      reloadAi();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "err");
    } finally {
      setSaving(null);
    }
  }

  async function clearKey(provider: string) {
    try {
      await api("/api/ai/clear-key", { json: { provider } });
      toast("Key removed");
      reloadAi();
    } catch {
      toast("Failed", "err");
    }
  }

  async function testAi() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api<{ ok: boolean; provider?: string; reply?: string }>("/api/ai/test", { json: {} });
      setTestResult(res);
      if (res.ok) reloadAi();
    } catch {
      setTestResult({ ok: false });
    } finally {
      setTesting(false);
    }
  }

  async function runOne(auto: AutoRow) {
    setRunning(auto.name);
    try {
      const res = await api<{ ran: { name: string; effects: number }[] }>(`/api/admin/automations/${auto.id}/run`, { json: {} });
      if (res.ran.length === 0) toast(`${auto.name}: nothing due right now`);
      else toast(`${auto.name}: executed (${res.ran[0].effects} effects)`);
      reload();
    } catch {
      toast("Failed", "err");
    } finally {
      setRunning(null);
    }
  }

  async function generate() {
    if (!input.trim()) return;
    setGenerating(true);
    try {
      const res = await api<{ text: string; source: string }>("/api/ai/assist", { json: { kind: tool, input } });
      setOutput(res);
    } catch {
      toast("Failed", "err");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Automations & AI</h1>
          <p className="text-sm text-slate-500">Event-driven workflows that actually execute + AI growth tools</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            const res = await api<{ ran: { name: string; effects: number }[] }>("/api/admin/automations/run", { json: {} });
            toast(res.ran.length ? `Ran: ${res.ran.map((r) => r.name).join(", ")}` : "Nothing due right now");
            reload();
          }}
        >
          <Play size={14} /> Run all due
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card
            title="Automation engine"
            desc="Toggle the master switch in Blog → SEO & Plugins"
            actions={
              <Badge tone={aiStatus ? "contacted" : "new"}>
                {aiStatus ? `${aiStatus.phase} · ${aiStatus.provider}` : "…"}
              </Badge>
            }
          >
            {loading ? (
              <Spinner />
            ) : (
              <div className="space-y-3">
                {automations?.map((auto) => (
                  <div key={auto.id} className="rounded-2xl border border-white/8 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-white">
                          <Zap size={14} className="text-amber-300" /> {auto.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{auto.description}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-widest text-slate-600">
                          trigger: {auto.trigger} · last run: {auto.lastRunAt ? fmtDate(auto.lastRunAt) : "never"}
                        </p>
                      </div>
                      <button
                        onClick={() => toggle(auto)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${auto.enabled ? "bg-brand-600" : "bg-white/10"}`}
                        aria-label={`Toggle ${auto.name}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${auto.enabled ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div className="mt-3">
                      <Button size="sm" variant="outline" onClick={() => runOne(auto)} disabled={running === auto.name}>
                        <Play size={12} /> {running === auto.name ? "Running…" : "Run now"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="AI providers"
            desc="ChatGPT, Gemini & more — paste a free key here, no deploy needed. Pollinations works with zero keys."
            actions={
              <Button size="sm" variant="outline" onClick={testAi} disabled={testing}>
                {testing ? "Testing…" : "Test connection"}
              </Button>
            }
          >
            {testResult && (
              <div className={`mb-3 rounded-xl border p-3 text-xs ${testResult.ok ? "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-200" : "border-red-400/25 bg-red-400/[0.06] text-red-200"}`}>
                {testResult.ok
                  ? `Connected via ${testResult.provider} — replied “${testResult.reply}”`
                  : "No provider answered (network or all relays down) — rules engine still covers you."}
              </div>
            )}
            <div className="space-y-3">
              {(aiStatus?.providers ?? []).map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/8 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{p.label}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        model: {p.model}
                        {p.source === "runtime" && p.keyHint ? ` · saved key ${p.keyHint}` : ""}
                      </p>
                    </div>
                    <Badge tone={p.configured ? "won" : "draft"}>
                      {p.source === "keyless" ? "free · no key" : p.source === "env" ? "env key" : p.source === "runtime" ? "saved" : "not set"}
                    </Badge>
                  </div>

                  {isAdmin && p.id !== "pollinations" && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Input
                        type="password"
                        placeholder={`Paste ${p.label} API key…`}
                        value={keyDrafts[p.id] ?? ""}
                        onChange={(e) => setKeyDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                        className="min-w-0 flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => saveKey(p.id)}
                        disabled={!keyDrafts[p.id]?.trim() || saving === p.id}
                      >
                        {saving === p.id ? "Saving…" : "Save"}
                      </Button>
                      {p.source === "runtime" && (
                        <Button size="sm" variant="ghost" onClick={() => clearKey(p.id)}>
                          Clear
                        </Button>
                      )}
                      {p.freeTierUrl && (
                        <a href={p.freeTierUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-brand-300 underline">
                          Get a free key ↗
                        </a>
                      )}
                    </div>
                  )}

                  {!isAdmin && p.freeTierUrl && (
                    <a href={p.freeTierUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[11px] font-semibold text-brand-300 underline">
                      Get a free key ↗
                    </a>
                  )}
                </div>
              ))}
            </div>

            {aiStatus && (
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/8 pt-4 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-slate-500">Active chain head</p>
                  <p className="mt-1 font-semibold text-white">{aiStatus.provider}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-slate-500">Tokens today / budget</p>
                  <p className="mt-1 font-semibold text-white">
                    {aiStatus.usedToday.toLocaleString()} / {aiStatus.dailyBudget.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card title="AI growth tools" desc="Generate copy, keywords and ideas for outreach and content">
          <div className="space-y-4">
            <Field label="Tool">
              <Select value={tool} onChange={(e) => { setTool(e.target.value); setOutput(null); }}>
                {TOOLS.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Input">
              <Textarea
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={TOOLS.find((t) => t.key === tool)?.placeholder}
              />
            </Field>
            <Button onClick={generate} disabled={!input.trim() || generating}>
              <Wand2 size={14} /> {generating ? "Generating…" : "Generate"}
            </Button>

            {output && (
              <div className="rounded-2xl border border-brand-400/25 bg-brand-500/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    <Brain size={13} className="text-brand-300" />
                    {output.source === "gemini" ? "Gemini output" : "Template output"}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(output.text);
                      toast("Copied to clipboard");
                    }}
                  >
                    <Copy size={13} /> Copy
                  </Button>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-200">{output.text}</p>
              </div>
            )}

            {output?.source === "template" && (
              <p className="flex items-center gap-1.5 text-xs text-slate-600">
                <Sparkles size={12} /> Template mode — add <code>GEMINI_API_KEY</code> for personalized output.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
