"use client";

import { useState } from "react";
import { api, Badge, Button, Card, ConfirmButton, Field, Input, Modal, PageSkeleton, Select, toast, useApi } from "@/components/AdminUI";
import { Calculator, Crown, Pencil, Plus, ShieldCheck, UserCog } from "lucide-react";

type Member = { id: number; name: string; email: string; role: "admin" | "editor" | "accountant"; createdAt: string };
const EMPTY = { name: "", email: "", password: "", role: "editor" };
const roles = {
  admin: { label: "Owner", desc: "Full access, team roles, security, content, clients and finance.", Icon: Crown, tone: "published" },
  editor: { label: "Editor", desc: "Pages, posts, portfolio, media, projects, clients and AI tools.", Icon: UserCog, tone: "review" },
  accountant: { label: "Accountant", desc: "Finance, invoices, expenses plus read-only client and project context.", Icon: Calculator, tone: "contacted" },
};

export default function TeamPage() {
  const { data, loading, reload } = useApi<Member[]>("/api/admin/team");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(EMPTY);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/admin/team", { json: form });
      toast("Team member added with role-based access");
      setForm(EMPTY); setShowAdd(false); reload();
    } catch (error) { toast(error instanceof Error ? error.message : "Could not add member", "err"); }
  }

  async function update(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await api(`/api/admin/team/${editing.id}`, { method: "PATCH", json: { name: editing.name, role: editing.role, password: form.password || undefined } });
      toast("Role and permissions updated"); setEditing(null); setForm(EMPTY); reload();
    } catch (error) { toast(error instanceof Error ? error.message : "Could not update role", "err"); }
  }

  async function remove(member: Member) {
    try { await api(`/api/admin/team/${member.id}`, { method: "DELETE" }); toast("Team access removed"); reload(); }
    catch (error) { toast(error instanceof Error ? error.message : "Could not remove member", "err"); }
  }

  if (loading || !data) return <PageSkeleton cards={3} rows={3} />;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-brand-300"><ShieldCheck size={13} /> Access control</div><h2 className="font-display text-3xl font-bold text-white">Team & roles</h2><p className="mt-1 text-sm text-slate-500">Give every person exactly the workspace they need—nothing more.</p></div>
      <Button onClick={() => setShowAdd(true)}><Plus size={15} /> Add team member</Button>
    </div>

    <div className="grid gap-3 md:grid-cols-3">{Object.entries(roles).map(([key, role]) => <Card key={key} className="!p-4"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-brand-300"><role.Icon size={18} /></span><div><p className="text-sm font-semibold text-white">{role.label}</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">{role.desc}</p></div></div></Card>)}</div>

    <Card title="Workspace members" desc={`${data.length} active staff account${data.length === 1 ? "" : "s"}`}>
      <div className="divide-y divide-white/[0.06]">{data.map((member) => { const role = roles[member.role] || roles.editor; return <div key={member.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0"><span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500/25 to-amber/10 font-display font-bold text-white ring-1 ring-white/8">{member.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{member.name}</p><p className="truncate text-[11px] text-slate-500">{member.email}</p></div><Badge tone={role.tone}><role.Icon size={11} className="mr-1" />{role.label}</Badge><Button size="sm" variant="ghost" onClick={() => { setEditing(member); setForm({ ...EMPTY }); }}><Pencil size={13} /> Edit</Button><ConfirmButton title="Remove access" confirm="Remove?" onConfirm={() => remove(member)} /></div>; })}</div>
    </Card>

    <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add team member"><form onSubmit={create} className="space-y-4"><Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Work email"><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Temporary password" hint="Share this securely. They can sign in through Staff login."><Input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field><Field label="Role"><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="editor">Editor</option><option value="accountant">Accountant</option></Select></Field><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit">Create staff account</Button></div></form></Modal>

    <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit access">{editing && <form onSubmit={update} className="space-y-4"><Field label="Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field><Field label="Email"><Input value={editing.email} disabled /></Field><Field label="Role"><Select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as Member["role"] })}><option value="admin">Owner</option><option value="editor">Editor</option><option value="accountant">Accountant</option></Select></Field><Field label="Reset password" hint="Leave blank to keep the current password."><Input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field><div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-3 text-[11px] text-slate-400">Role changes apply on the member’s next authenticated request. Existing sessions cannot bypass server permissions.</div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit">Save permissions</Button></div></form>}</Modal>
  </div>;
}
