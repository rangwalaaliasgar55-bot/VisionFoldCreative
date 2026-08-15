"use client";

import { useEffect, useState } from "react";
import {
  api,
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  Spinner,
  Textarea,
  toast,
} from "@/components/AdminUI";
import { ArrowLeft, ArrowRight, MessageCircle, Send } from "lucide-react";

interface WaMessage {
  id: number;
  from: string;
  to: string;
  direction: "inbound" | "outbound";
  body: string;
  status: string;
  autoReplied: boolean;
  createdAt: string;
}

interface WaStatus {
  connected: boolean;
  autoReply: boolean;
  businessNumber: string;
  messages: WaMessage[];
}

export default function AdminWhatsAppPage() {
  const [data, setData] = useState<WaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api<WaStatus>("/api/admin/whatsapp");
      setData(res);
    } catch {
      toast("Failed to load WhatsApp status", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const id = setInterval(() => void load(), 20000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim() || !text.trim()) return;
    setSending(true);
    setFallback(null);
    try {
      const res = await api<{ ok: boolean; error?: string; fallback?: string }>("/api/admin/whatsapp/send", {
        json: { to, text },
      });
      if (res.ok) {
        toast("Message sent via WhatsApp Cloud API");
        setText("");
        void load();
      } else {
        toast(res.error || "Send failed — use the fallback link.", "err");
        if (res.fallback) setFallback(res.fallback);
      }
    } catch {
      toast("Failed to send", "err");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">WhatsApp Automation</h1>
          <p className="text-sm text-slate-500">Send messages, watch the inbox, and let the AI bot reply for you.</p>
        </div>
        <Badge tone={data?.connected ? "active" : "contacted"}>
          {data?.connected ? "Cloud API connected" : "Not connected"}
        </Badge>
      </div>

      {!data?.connected && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/5 p-5 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-amber-300">Connect the WhatsApp Business Cloud API</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-400">
            <li>In Meta Business → WhatsApp → API Setup, create a <strong>System User token</strong> and a test/registered <strong>phone number</strong>.</li>
            <li>Copy the <strong>Phone number ID</strong>, your business number, and the token.</li>
            <li>Add these in Vercel: <code className="text-brand-300">WHATSAPP_TOKEN</code>, <code className="text-brand-300">WHATSAPP_PHONE_NUMBER_ID</code>, <code className="text-brand-300">WHATSAPP_BUSINESS_NUMBER</code>, and a <code className="text-brand-300">WHATSAPP_VERIFY_TOKEN</code> (any secret you pick).</li>
            <li>Point Meta&rsquo;s webhook at <code className="text-brand-300">https://your-domain/api/whatsapp/webhook</code> using that verify token.</li>
            <li>Set <code className="text-brand-300">WHATSAPP_AUTO_REPLY=true</code> to let the AI bot answer inbound messages.</li>
          </ol>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Send */}
        <Card title="Send a message" desc={data?.connected ? `Sending from ${data.businessNumber || "your number"}` : "Works as a wa.me link until the API is connected"}>
          <form onSubmit={send} className="space-y-3">
            <Field label="Phone number (with country code)">
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="+91 90000 00000" />
            </Field>
            <Field label="Message">
              <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Hi! We can help with…" />
            </Field>
            {fallback && (
              <a href={fallback} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-xs text-emerald-300 hover:underline">
                API not reachable — click here to open the message in WhatsApp instead →
              </a>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={sending || !to.trim() || !text.trim()}>
                <Send size={14} /> {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Status / bot */}
        <div className="space-y-6">
          <Card title="AI auto-reply bot" desc="Answers inbound WhatsApp messages using your studio AI">
            <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-ink/50 p-4">
              <div>
                <p className="text-sm font-semibold text-white">Auto-reply</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {data?.autoReply
                    ? "ON — inbound texts get an instant, human-sounding reply."
                    : "OFF — set WHATSAPP_AUTO_REPLY=true in Vercel to enable."}
                </p>
              </div>
              <span className={`h-3 w-3 rounded-full ${data?.autoReply ? "bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.6)]" : "bg-slate-600"}`} />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              The bot uses your AI instructions: warm, human, under 60 words, one clarifying question, signs as
              “— VisionFold Studio”, and never invents prices except the ₹700 Shorts rate.
            </p>
          </Card>
        </div>
      </div>

      {/* Inbox */}
      <Card title="Inbox" desc="Last 100 inbound and outbound messages">
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : !data || data.messages.length === 0 ? (
          <Empty title="No messages yet" desc="Inbound messages from the webhook will appear here." />
        ) : (
          <div className="scrollbar-thin max-h-[480px] space-y-2 overflow-y-auto pr-1">
            {data.messages.map((m) => (
              <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.direction === "outbound" ? "rounded-tr-sm bg-gradient-to-r from-brand-600 to-cy-500 text-white" : "rounded-tl-sm border border-white/10 bg-panel text-slate-200"}`}>
                  <div className="mb-0.5 flex items-center gap-2 text-[10px] opacity-70">
                    {m.direction === "inbound" ? <ArrowLeft size={10} /> : <ArrowRight size={10} />}
                    <span className="font-mono">{m.from}</span>
                    {m.autoReplied && <span className="rounded bg-emerald-500/20 px-1 text-emerald-300">bot replied</span>}
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
