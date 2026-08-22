"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { api, Button, Card, Field, Select, Textarea, toast, useApi } from "@/components/AdminUI";

type Thread = { id: number; title: string; provider: string; updatedAt: string | null };
type Msg = { id: number; role: string; content: string; provider: string; createdAt: string | null };
type Skills = {
  instructions: string;
  skills: { id: string; name: string; instructions: string; enabled: boolean }[];
  preferred: string;
};

export default function AdminAiPage() {
  const { data: status } = useApi<{ provider: string; model: string; preferred: string; providers: { id: string; label: string; configured: boolean }[] }>("/api/ai/status");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [provider, setProvider] = useState("");
  const [sending, setSending] = useState(false);
  const [skills, setSkills] = useState<Skills | null>(null);
  const [savingSkills, setSavingSkills] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  async function loadThreads() {
    const res = await api<{ threads: Thread[] }>("/api/ai/status?threads=1");
    setThreads(res.threads || []);
  }
  async function loadSkills() {
    const res = await api<Skills>("/api/ai/status?skills=1");
    setSkills(res);
  }
  async function openThread(id: number) {
    const res = await api<{ messages: Msg[] }>(`/api/ai/status?conversation=${id}`);
    setActive(id);
    setMessages(res.messages || []);
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadThreads();
      void loadSkills();
    }, 0);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const res = await api<{ conversationId: number; reply: string; provider: string }>("/api/ai/chat", {
        json: { conversationId: active, message: draft, provider: provider || undefined },
      });
      setDraft("");
      setActive(res.conversationId);
      await openThread(res.conversationId);
      await loadThreads();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Chat failed", "err");
    } finally {
      setSending(false);
    }
  }

  async function saveSkills() {
    if (!skills) return;
    setSavingSkills(true);
    try {
      await api("/api/ai/save-skills", { json: skills });
      if (skills.preferred) await api("/api/ai/set-preferred", { json: { provider: skills.preferred } });
      toast("Instructions saved — copilot will not change the live website");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "err");
    } finally {
      setSavingSkills(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Studio copilot</h1>
        <p className="text-sm text-slate-500">
          Talk to Grok, Groq, Gemini or ChatGPT on this site. The copilot drafts — it never publishes or edits the live website.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Active provider</p>
          <p className="font-display mt-1 text-xl font-bold text-white">{status?.provider || "…"}</p>
          <p className="text-[11px] text-slate-500">{status?.model}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Ready keys</p>
          <p className="font-display mt-1 text-xl font-bold text-emerald-300">
            {(status?.providers || []).filter((p) => p.configured).length}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Guardrail</p>
          <p className="mt-1 text-sm text-slate-300">Draft only. Humans apply changes.</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card title="Threads">
          <Button size="sm" variant="outline" className="mb-3 w-full" onClick={() => { setActive(null); setMessages([]); }}>
            New conversation
          </Button>
          <ul className="space-y-1">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => openThread(t.id)}
                  className={`w-full truncate rounded-lg px-2 py-2 text-left text-xs ${active === t.id ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5"}`}
                >
                  {t.title}
                </button>
              </li>
            ))}
            {!threads.length && <p className="text-xs text-slate-600">No threads yet.</p>}
          </ul>
        </Card>

        <Card
          title="Chat"
          desc="Staff-only. History is stored in your database."
          actions={
            <Select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-40">
              <option value="">Auto chain</option>
              {(status?.providers || []).filter((p) => p.id !== "pollinations").map((p) => (
                <option key={p.id} value={p.id}>{p.label}{p.configured ? "" : " (no key)"}</option>
              ))}
            </Select>
          }
        >
          <div ref={scroller} className="mb-3 h-[380px] space-y-3 overflow-y-auto rounded-xl border border-white/8 bg-ink/40 p-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-brand-600 text-white" : "border border-white/10 bg-panel text-slate-200"}`}>
                  <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-widest opacity-60">
                    {m.role === "user" ? "You" : <><Bot size={10} /> Copilot</>}
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
            {!messages.length && (
              <p className="py-16 text-center text-sm text-slate-600">Ask for a lead reply, a WhatsApp draft, or a cut note. Nothing here changes the public site.</p>
            )}
          </div>
          <form onSubmit={send} className="flex gap-2">
            <Textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask the copilot…" className="flex-1" />
            <Button type="submit" disabled={sending || !draft.trim()}>
              <Send size={14} /> {sending ? "…" : "Send"}
            </Button>
          </form>
        </Card>
      </div>

      {skills && (
        <Card title="Instructions & skills" desc="These shape every copilot and WhatsApp auto-reply. They cannot publish pages.">
          <Field label="System instructions">
            <Textarea rows={6} value={skills.instructions} onChange={(e) => setSkills({ ...skills, instructions: e.target.value })} />
          </Field>
          <div className="mt-3">
          <Field label="Default provider">
            <Select value={skills.preferred} onChange={(e) => setSkills({ ...skills, preferred: e.target.value })}>
              <option value="gemini">Gemini (default)</option>
              <option value="grok">xAI Grok</option>
              <option value="groq">Groq</option>
              <option value="openai">ChatGPT</option>
              <option value="nvidia">NVIDIA NIM</option>
              <option value="auto">Auto (first configured)</option>
            </Select>
          </Field>
          </div>
          <div className="mt-4 space-y-3">
            {skills.skills.map((s, i) => (
              <div key={s.id} className="rounded-xl border border-white/8 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <button
                    onClick={() => {
                      const next = [...skills.skills];
                      next[i] = { ...s, enabled: !s.enabled };
                      setSkills({ ...skills, skills: next });
                    }}
                    className={`relative h-6 w-11 rounded-full ${s.enabled ? "bg-brand-600" : "bg-white/10"}`}
                    aria-label={`Toggle ${s.name}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${s.enabled ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
                <Textarea
                  rows={2}
                  className="mt-2"
                  value={s.instructions}
                  onChange={(e) => {
                    const next = [...skills.skills];
                    next[i] = { ...s, instructions: e.target.value };
                    setSkills({ ...skills, skills: next });
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={saveSkills} disabled={savingSkills}>
              <Sparkles size={14} /> {savingSkills ? "Saving…" : "Save instructions"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
