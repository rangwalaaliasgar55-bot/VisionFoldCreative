"use client";

import { useState } from "react";
import {
  api,
  Button,
  ConfirmButton,
  Empty,
  Field,
  Input,
  Modal,
  ProgressBar,
  Select,
  Spinner,
  StatusBadge,
  Textarea,
  toast,
  useApi,
} from "@/components/AdminUI";
import { fmtDate, fmtMoney, timeAgo } from "@/lib/utils";
import { CalendarClock, MessageSquarePlus, Pencil, Plus } from "lucide-react";

type ProjectRow = {
  id: number;
  clientId: number;
  clientName: string;
  title: string;
  service: string;
  description: string;
  status: string;
  progress: number;
  dueDate: string | null;
  budget: string | null;
};

type ClientOpt = { id: number; name: string };
type UpdateRow = { id: number; projectId: number; title: string; body: string; createdAt: string };

const EMPTY = { clientId: 0, title: "", service: "Video Editing", description: "", status: "in_progress", progress: 0, dueDate: "", budget: "" };

export default function AdminProjectsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [updating, setUpdating] = useState<ProjectRow | null>(null);
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [updateForm, setUpdateForm] = useState({ title: "", body: "" });

  const { data: projects, loading, reload } = useApi<ProjectRow[]>("/api/admin/projects");
  const { data: clients } = useApi<ClientOpt[]>("/api/admin/clients");

  async function loadUpdates(projectId: number) {
    const rows = await api<UpdateRow[]>(`/api/admin/updates?projectId=${projectId}`);
    setUpdates(rows);
  }

  function openEdit(p: ProjectRow) {
    setEditing(p);
    setForm({
      clientId: p.clientId,
      title: p.title,
      service: p.service,
      description: p.description,
      status: p.status,
      progress: p.progress,
      dueDate: p.dueDate || "",
      budget: p.budget || "",
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await api(`/api/admin/projects/${editing.id}`, { method: "PATCH", json: form });
        toast("Project updated");
      } else {
        await api("/api/admin/projects", { json: form });
        toast("Project created + kickoff update posted");
      }
      setShowAdd(false);
      setEditing(null);
      setForm(EMPTY);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  async function quickProgress(p: ProjectRow, progress: number) {
    try {
      await api(`/api/admin/projects/${p.id}`, { method: "PATCH", json: { progress } });
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  async function postUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!updating) return;
    try {
      await api("/api/admin/updates", { json: { projectId: updating.id, ...updateForm } });
      toast("Update posted — visible in the client portal");
      setUpdateForm({ title: "", body: "" });
      loadUpdates(updating.id);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  async function removeProject(p: ProjectRow) {
    try {
      await api(`/api/admin/projects/${p.id}`, { method: "DELETE" });
      toast("Project deleted");
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  const statusFilter = (s: string) => projects?.filter((p) => p.status === s) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-slate-500">Set progress — clients see it live in their portal</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={14} /> New project
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : !projects || projects.length === 0 ? (
        <Empty title="No projects yet" desc="Create the first project for a client to unlock the delivery pipeline." />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {["in_progress", "review", "revision", "completed"].map((s) => (
              <div key={s} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <StatusBadge status={s} />
                  <span className="font-display text-xl font-bold text-white">{statusFilter(s).length}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">projects</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="glass rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-semibold text-white">{p.title}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.clientName} · {p.service} · budget {fmtMoney(p.budget)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => { setUpdating(p); loadUpdates(p.id); }}>
                      <MessageSquarePlus size={13} /> Update
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil size={13} />
                    </Button>
                    <ConfirmButton onConfirm={() => removeProject(p)} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="min-w-40 flex-1">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={p.progress} />
                      <span className="w-9 text-right text-sm font-bold text-white">{p.progress}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={p.progress}
                      onChange={(e) => quickProgress(p, Number(e.target.value))}
                      className="mt-2 w-full accent-violet-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarClock size={13} className="text-amber-300" />
                    due {fmtDate(p.dueDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={showAdd || Boolean(editing)} onClose={() => { setShowAdd(false); setEditing(null); }} title={editing ? "Edit project" : "New project"} wide>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title *">
              <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
            <Field label="Client *">
              <Select required value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: Number(e.target.value) }))}>
                <option value={0} disabled>Select client…</option>
                {(clients || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Service">
              <Select value={form.service} onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}>
                {["Video Editing", "Brand Film", "YouTube Editing", "Commercials", "Music Video", "Wedding", "Corporate", "Podcast Editing"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Budget (USD)">
              <Input type="number" min={0} value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {["intake", "in_progress", "review", "revision", "completed"].map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </Select>
            </Field>
            <Field label="Due date">
              <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </Field>
          </div>
          <Field label="Progress %">
            <input
              type="range" min={0} max={100} step={5} value={form.progress}
              onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
              className="w-full accent-violet-500"
            />
            <p className="mt-1 text-xs text-slate-500">{form.progress}% — setting 100% triggers the review-request automation</p>
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowAdd(false); setEditing(null); }}>Cancel</Button>
            <Button type="submit">{editing ? "Save changes" : "Create project"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(updating)} onClose={() => setUpdating(null)} title={`Post update — ${updating?.title || ""}`} wide>
        <form onSubmit={postUpdate} className="space-y-4">
          <Field label="Update title *">
            <Input required value={updateForm.title} onChange={(e) => setUpdateForm((f) => ({ ...f, title: e.target.value }))} placeholder="Cut v2 delivered" />
          </Field>
          <Field label="Details">
            <Textarea rows={4} required value={updateForm.body} onChange={(e) => setUpdateForm((f) => ({ ...f, body: e.target.value }))} placeholder="What changed in this pass?" />
          </Field>

          {updates.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-white/2 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Timeline</p>
              <div className="mt-3 space-y-3">
                {updates.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex gap-2.5 text-sm">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    <div>
                      <p className="font-medium text-white">{u.title} <span className="text-[10px] font-normal text-slate-600">{timeAgo(u.createdAt)}</span></p>
                      <p className="text-xs text-slate-400">{u.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setUpdating(null)}>Close</Button>
            <Button type="submit">Post update</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
