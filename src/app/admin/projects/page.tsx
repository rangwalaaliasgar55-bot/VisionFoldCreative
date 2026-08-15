"use client";

import { useEffect, useState } from "react";
import {
  api,
  Badge,
  Button,
  Card,
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
import {
  CalendarClock,
  CheckCircle2,
  Download,
  Film,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Plus,
  RotateCcw,
  Sliders,
  Sparkles,
} from "lucide-react";

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
type AnnotationRow = { id: number; projectId: number; clientId: number; timestamp: string; comment: string; author: string; resolved: boolean; createdAt: string };
type DeliverableRow = { id: number; projectId: number; name: string; format: string; resolution: string; sizeBytes: string; downloadUrl: string };

const EMPTY = {
  clientId: 0,
  title: "",
  service: "Brand Film",
  description: "",
  status: "in_progress",
  progress: 0,
  dueDate: "",
  budget: "2500",
};

export default function AdminProjectsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [updating, setUpdating] = useState<ProjectRow | null>(null);
  const [inspectingProj, setInspectingProj] = useState<ProjectRow | null>(null);

  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationRow[]>([]);
  const [deliverablesList, setDeliverablesList] = useState<DeliverableRow[]>([]);

  const [form, setForm] = useState(EMPTY);
  const [updateForm, setUpdateForm] = useState({ title: "", body: "" });
  const [deliverableForm, setDeliverableForm] = useState({
    name: "",
    format: "Apple ProRes 422 HQ",
    resolution: "4K UHD (3840x2160)",
    sizeBytes: "12000000000",
    downloadUrl: "",
  });

  const { data: projects, loading, reload } = useApi<ProjectRow[]>("/api/admin/projects");
  const { data: clients } = useApi<ClientOpt[]>("/api/admin/clients");

  async function loadProjectDetails(projectId: number) {
    try {
      const [uRows, aRows, dRows] = await Promise.all([
        api<UpdateRow[]>(`/api/admin/updates?projectId=${projectId}`),
        api<AnnotationRow[]>(`/api/admin/annotations?projectId=${projectId}`),
        api<DeliverableRow[]>(`/api/admin/deliverables?projectId=${projectId}`),
      ]);
      setUpdates(uRows);
      setAnnotations(aRows);
      setDeliverablesList(dRows);
    } catch {
      toast("Error loading project data", "err");
    }
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

  function openInspector(p: ProjectRow) {
    setInspectingProj(p);
    loadProjectDetails(p.id);
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
      loadProjectDetails(updating.id);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  async function handleAddDeliverable(e: React.FormEvent) {
    e.preventDefault();
    if (!inspectingProj || !deliverableForm.downloadUrl.trim() || !deliverableForm.name.trim()) return;
    try {
      await api("/api/admin/deliverables", {
        json: { projectId: inspectingProj.id, ...deliverableForm },
      });
      toast("Deliverable master linked to project!");
      setDeliverableForm({
        name: "",
        format: "Apple ProRes 422 HQ",
        resolution: "4K UHD (3840x2160)",
        sizeBytes: "12000000000",
        downloadUrl: "",
      });
      loadProjectDetails(inspectingProj.id);
    } catch {
      toast("Failed to add deliverable", "err");
    }
  }

  async function toggleAnnotationResolved(a: AnnotationRow) {
    try {
      await api(`/api/admin/annotations/${a.id}`, {
        method: "PATCH",
        json: { resolved: !a.resolved },
      });
      toast(a.resolved ? "Flag reopened" : "Revision marked resolved! ✨");
      if (inspectingProj) loadProjectDetails(inspectingProj.id);
    } catch {
      toast("Failed to update flag", "err");
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

  const [statusTab, setStatusTab] = useState("all");
  const statusFilter = (s: string) => projects?.filter((p) => p.status === s) ?? [];
  const visibleProjects = statusTab === "all" ? (projects ?? []) : statusFilter(statusTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Project Pipeline & 4K Suite</h1>
          <p className="text-sm text-slate-500">Track milestones, timecode revision notes, progress sliders, and master files</p>
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <button
              onClick={() => setStatusTab("all")}
              className={`glass hover-lift rounded-2xl p-4 text-left ${statusTab === "all" ? "border-brand-400/60 ring-1 ring-brand-400/40" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white">All</span>
                <span className="font-display text-xl font-bold text-white">{projects.length}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">total projects</p>
            </button>
            {["in_progress", "review", "revision", "completed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusTab(s)}
                className={`glass hover-lift rounded-2xl p-4 text-left ${statusTab === s ? "border-brand-400/60 ring-1 ring-brand-400/40" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <StatusBadge status={s} />
                  <span className="font-display text-xl font-bold text-white">{statusFilter(s).length}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{s.replace("_", " ")} projects</p>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {visibleProjects.map((p) => (
              <div key={p.id} className="glass card-glow rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-white">{p.title}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Client: <strong className="text-slate-200">{p.clientName}</strong> · Service: <strong className="text-cyan-300">{p.service}</strong> · Budget: <strong className="text-emerald-300">{fmtMoney(p.budget)}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => openInspector(p)}>
                      <Film size={13} className="text-cyan-300" /> Review Suite
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUpdating(p);
                        loadProjectDetails(p.id);
                      }}
                    >
                      <MessageSquarePlus size={13} /> Update
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil size={13} />
                    </Button>
                    <ConfirmButton onConfirm={() => removeProject(p)} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/8 pt-3">
                  <div className="min-w-40 flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Timeline Progress</span>
                      <span className="font-bold text-white">{p.progress}%</span>
                    </div>
                    <ProgressBar value={p.progress} />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={p.progress}
                      onChange={(e) => quickProgress(p, Number(e.target.value))}
                      className="mt-2 w-full accent-brand-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarClock size={13} className="text-amber-300" />
                    Due {fmtDate(p.dueDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Review Suite & Inspector Modal */}
      {inspectingProj && (
        <Modal
          open={Boolean(inspectingProj)}
          onClose={() => setInspectingProj(null)}
          title={`Review Suite: ${inspectingProj.title}`}
          wide
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-ink/60 p-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">{inspectingProj.service}</span>
                <h2 className="font-display text-lg font-bold text-white">{inspectingProj.title}</h2>
                <p className="text-xs text-slate-400">{inspectingProj.clientName} · Due {fmtDate(inspectingProj.dueDate)}</p>
              </div>
              <StatusBadge status={inspectingProj.status} />
            </div>

            {/* Frame Revision Annotations Table */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-cyan-300" />
                  <span>Timecode Revision Notes ({annotations.length})</span>
                </div>
              }
              desc="Time-stamped client feedback pinned directly to the master timeline"
            >
              <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-thin">
                {annotations.map((a) => (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between gap-3 rounded-xl p-3 border transition-all ${
                      a.resolved ? "border-white/5 bg-white/2 opacity-60" : "border-amber-400/30 bg-amber-500/5"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold text-cyan-300 px-2 py-0.5 rounded bg-black/50 shrink-0">
                        {a.timestamp}
                      </span>
                      <div>
                        <p className="text-xs text-slate-200">{a.comment}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">By {a.author} · {timeAgo(a.createdAt)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleAnnotationResolved(a)}
                      className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-semibold flex items-center gap-1 ${
                        a.resolved ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "bg-white/10 text-slate-300 hover:bg-white/20"
                      }`}
                    >
                      <CheckCircle2 size={13} /> {a.resolved ? "Resolved" : "Mark Resolved"}
                    </button>
                  </div>
                ))}
                {annotations.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-500">No timecode revision notes posted yet.</p>
                )}
              </div>
            </Card>

            {/* Deliverable Master Files */}
            <Card
              title="Master Deliverable Files"
              desc="Links for final ProRes masters, web cuts, and subtitle bundles"
            >
              <div className="space-y-3">
                <div className="space-y-2">
                  {deliverablesList.map((d) => (
                    <div key={d.id} className="glass flex items-center justify-between rounded-xl p-3 text-xs">
                      <div>
                        <p className="font-semibold text-white">{d.name}</p>
                        <p className="text-slate-400">{d.format} · {d.resolution}</p>
                      </div>
                      <a
                        href={d.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-300 hover:underline font-semibold"
                      >
                        <Download size={13} /> Download ↗
                      </a>
                    </div>
                  ))}
                  {deliverablesList.length === 0 && (
                    <p className="py-2 text-xs text-slate-500">No master deliverable files uploaded yet.</p>
                  )}
                </div>

                {/* Add Deliverable Form */}
                <form onSubmit={handleAddDeliverable} className="border-t border-white/8 pt-3 space-y-3">
                  <p className="text-xs font-semibold text-white">Attach New Master Render</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="File Name (e.g. Master_4K_ProRes.mov)"
                      value={deliverableForm.name}
                      onChange={(e) => setDeliverableForm({ ...deliverableForm, name: e.target.value })}
                      className="text-xs"
                    />
                    <Input
                      placeholder="Download URL (Dropbox / S3 / Frame.io)"
                      value={deliverableForm.downloadUrl}
                      onChange={(e) => setDeliverableForm({ ...deliverableForm, downloadUrl: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <Button size="sm" type="submit">
                    <Plus size={13} /> Link Master Render
                  </Button>
                </form>
              </div>
            </Card>

            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setInspectingProj(null)}>
                Close Suite
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit/Create Project Modal */}
      <Modal
        open={showAdd || Boolean(editing)}
        onClose={() => {
          setShowAdd(false);
          setEditing(null);
        }}
        title={editing ? "Edit project" : "New project"}
        wide
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title *">
              <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
            <Field label="Client *">
              <Select required value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: Number(e.target.value) }))}>
                <option value={0} disabled>
                  Select client…
                </option>
                {(clients || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Service">
              <Select value={form.service} onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}>
                {[
                  "Brand Film",
                  "YouTube Editing",
                  "Commercials & Ads",
                  "Music Video",
                  "Wedding Cinema",
                  "Podcast Editing",
                ].map((s) => (
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
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date">
              <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </Field>
          </div>
          <Field label="Progress %">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.progress}
              onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <p className="mt-1 text-xs text-slate-500">{form.progress}% — setting 100% triggers completion workflows</p>
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAdd(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save changes" : "Create project"}</Button>
          </div>
        </form>
      </Modal>

      {/* Post Timeline Update Modal */}
      <Modal open={Boolean(updating)} onClose={() => setUpdating(null)} title={`Post update — ${updating?.title || ""}`} wide>
        <form onSubmit={postUpdate} className="space-y-4">
          <Field label="Update title *">
            <Input required value={updateForm.title} onChange={(e) => setUpdateForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Cut v2 delivered in 4K ProRes" />
          </Field>
          <Field label="Details">
            <Textarea rows={4} required value={updateForm.body} onChange={(e) => setUpdateForm((f) => ({ ...f, body: e.target.value }))} placeholder="What changed in this pass? Color grading, audio mix, pacing..." />
          </Field>

          {updates.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-white/2 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Timeline</p>
              <div className="mt-3 space-y-3">
                {updates.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex gap-2.5 text-sm">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    <div>
                      <p className="font-medium text-white">
                        {u.title} <span className="text-[10px] font-normal text-slate-600">{timeAgo(u.createdAt)}</span>
                      </p>
                      <p className="text-xs text-slate-400">{u.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setUpdating(null)}>
              Close
            </Button>
            <Button type="submit">Post update</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
