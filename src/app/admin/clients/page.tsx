"use client";

import { useEffect, useRef, useState } from "react";
import {
  api,
  Badge,
  Button,
  ConfirmButton,
  Empty,
  Field,
  Input,
  Modal,
  Spinner,
  StatusBadge,
  Textarea,
  toast,
  useApi,
} from "@/components/AdminUI";
import { fmtDate, timeAgo } from "@/lib/utils";
import { KeyRound, MessageSquare, Plus, Send, X } from "lucide-react";

type ClientRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  notes: string;
  projectCount: number;
  createdAt: string;
};

type Msg = { id: number; clientId: number; sender: string; body: string; read: boolean; createdAt: string };

export default function AdminClientsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [chatClient, setChatClient] = useState<ClientRow | null>(null);
  const [reset, setReset] = useState<{ name: string; password: string } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const { data: clients, loading, reload } = useApi<ClientRow[]>("/api/admin/clients");

  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", password: "", notes: "", status: "active" });

  useEffect(() => {
    if (!chatClient) return;
    api<Msg[]>(`/api/admin/messages?clientId=${chatClient.id}`).then(setMessages).catch(() => {});
    api("/api/admin/messages/read", { json: { clientId: chatClient.id } }).catch(() => {});
    const id = setInterval(() => {
      api<Msg[]>(`/api/admin/messages?clientId=${chatClient.id}`).then(setMessages).catch(() => {});
    }, 7000);
    return () => clearInterval(id);
  }, [chatClient]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, chatClient]);

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api<{ name: string; tempPassword?: string }>("/api/admin/clients", { json: form });
      toast("Client created — welcome message sent to their portal");
      if (res.tempPassword) setReset({ name: res.name, password: res.tempPassword });
      setShowAdd(false);
      setForm({ name: "", email: "", phone: "", company: "", password: "", notes: "", status: "active" });
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  async function toggleStatus(c: ClientRow) {
    const next = c.status === "active" ? "paused" : "active";
    try {
      await api(`/api/admin/clients/${c.id}`, { method: "PATCH", json: { status: next } });
      toast(`Client ${next === "active" ? "reactivated" : "paused"}`);
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  async function removeClient(c: ClientRow) {
    try {
      await api(`/api/admin/clients/${c.id}`, { method: "DELETE" });
      toast("Client deleted");
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  async function resetPassword(c: ClientRow) {
    try {
      const res = await api<{ tempPassword: string }>(`/api/admin/clients/${c.id}/reset-password`, { json: {} });
      setReset({ name: c.name, password: res.tempPassword });
      toast("Password reset");
    } catch {
      toast("Failed", "err");
    }
  }

  async function sendMessage() {
    const body = draft.trim();
    if (!body || !chatClient || sending) return;
    setSending(true);
    try {
      await api("/api/admin/messages", { json: { clientId: chatClient.id, body } });
      setDraft("");
      const rows = await api<Msg[]>(`/api/admin/messages?clientId=${chatClient.id}`);
      setMessages(rows);
    } catch {
      toast("Failed", "err");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm text-slate-500">Portal accounts, status and direct chat</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add client
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : !clients || clients.length === 0 ? (
        <Empty title="No clients yet" desc="Convert a lead or add a client manually to start a project." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {clients.map((c) => (
              <div key={c.id} className="glass flex flex-wrap items-center gap-4 rounded-2xl p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-cy-500 font-display text-lg font-bold text-white">
                  {c.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold text-white">
                    {c.name}
                    <StatusBadge status={c.status} />
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {c.email} · {c.company || "—"}
                  </p>
                </div>
                <Badge tone="in_progress">{c.projectCount} project{c.projectCount === 1 ? "" : "s"}</Badge>
                <span className="hidden text-[11px] text-slate-600 sm:block">joined {fmtDate(c.createdAt)}</span>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setChatClient(c)}>
                    <MessageSquare size={13} /> Chat
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => resetPassword(c)} title="Reset password">
                    <KeyRound size={13} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleStatus(c)}>
                    {c.status === "active" ? "Pause" : "Activate"}
                  </Button>
                  <ConfirmButton onConfirm={() => removeClient(c)} />
                </div>
              </div>
            ))}
          </div>

          <div className="glass sticky top-6 flex h-[70vh] flex-col rounded-2xl">
            {chatClient ? (
              <>
                <div className="flex items-center justify-between border-b border-white/8 p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{chatClient.name}</p>
                    <p className="text-[11px] text-slate-500">{chatClient.email}</p>
                  </div>
                  <button onClick={() => setChatClient(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                <div ref={chatRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          m.sender === "admin"
                            ? "rounded-br-md bg-gradient-to-r from-brand-600 to-brand-500 text-white"
                            : "rounded-bl-md border border-white/10 bg-white/5 text-slate-200"
                        }`}
                      >
                        {m.body}
                        <p className={`mt-1 text-[10px] ${m.sender === "admin" ? "text-white/60" : "text-slate-600"}`}>
                          {m.sender === "admin" ? "You" : chatClient.name} · {timeAgo(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="py-10 text-center text-xs text-slate-500">No messages yet. Say hello 👋</p>
                  )}
                </div>
                <div className="flex gap-2 border-t border-white/8 p-3">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Reply…"
                  />
                  <Button onClick={sendMessage} disabled={!draft.trim() || sending}>
                    <Send size={14} />
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-6 text-center">
                <div>
                  <MessageSquare size={28} className="mx-auto text-slate-600" />
                  <p className="mt-3 text-sm font-medium text-slate-400">Select a client to chat</p>
                  <p className="mt-1 text-xs text-slate-600">Replies land instantly in their portal.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add client">
        <form onSubmit={createClient} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name *">
              <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Email *">
              <Input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Company">
              <Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </Field>
          </div>
          <Field label="Portal password" hint="Leave blank to auto-generate a secure temporary password">
            <Input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters (optional)" />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Create client</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(reset)} onClose={() => setReset(null)} title="Password reset">
        {reset && (
          <div className="text-sm">
            <p className="text-slate-400">Temporary password for <span className="font-semibold text-white">{reset.name}</span>:</p>
            <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/5 p-4 text-center font-mono text-lg text-amber-200">
              {reset.password}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
