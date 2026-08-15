"use client";

import { useMemo, useState } from "react";
import {
  api,
  Badge,
  Button,
  Card,
  ConfirmButton,
  Empty,
  Field,
  IconBtn,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
  toast,
  useApi,
} from "@/components/AdminUI";
import { fmtDate } from "@/lib/utils";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Copy,
  DollarSign,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Sparkles,
  Target,
  UserCheck,
  Zap,
} from "lucide-react";

type LeadRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  message: string;
  notes: string;
  status: "new" | "contacted" | "won" | "lost";
  source: string;
  createdAt: string;
};

export default function AdminLeadsPage() {
  const { data: leads, loading, reload } = useApi<LeadRow[]>("/api/admin/leads");
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRow | null>(null);
  const [converting, setConverting] = useState<number | null>(null);
  const [aiProposalLead, setAiProposalLead] = useState<LeadRow | null>(null);
  const [proposalText, setProposalText] = useState<string>("");
  const [generatingProposal, setGeneratingProposal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "Brand Films",
    budget: "$2,500 - $5,000",
    message: "",
    notes: "",
    status: "new",
    source: "website",
  });

  const filtered = useMemo(() => {
    if (!leads) return [];
    return leads.filter((l) => {
      const matchFilter = filter === "all" || l.status === filter;
      const matchSearch =
        search === "" ||
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        l.service.toLowerCase().includes(search.toLowerCase()) ||
        l.message.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [leads, filter, search]);

  const stats = useMemo(() => {
    if (!leads) return { total: 0, new: 0, contacted: 0, won: 0, conversion: 0 };
    const total = leads.length;
    const newL = leads.filter((l) => l.status === "new").length;
    const contacted = leads.filter((l) => l.status === "contacted").length;
    const won = leads.filter((l) => l.status === "won").length;
    const conversion = total > 0 ? Math.round((won / total) * 100) : 0;
    return { total, new: newL, contacted, won, conversion };
  }, [leads]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/admin/leads", { json: form });
      toast("Lead added successfully");
      setShowAdd(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        service: "Brand Films",
        budget: "$2,500 - $5,000",
        message: "",
        notes: "",
        status: "new",
        source: "website",
      });
      reload();
    } catch {
      toast("Failed to add lead", "err");
    }
  }

  async function handleUpdateStatus(lead: LeadRow, nextStatus: LeadRow["status"]) {
    try {
      await api(`/api/admin/leads/${lead.id}`, { method: "PATCH", json: { status: nextStatus } });
      toast(`Lead status set to ${nextStatus}`);
      reload();
    } catch {
      toast("Failed to update status", "err");
    }
  }

  async function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLead) return;
    try {
      await api(`/api/admin/leads/${editingLead.id}`, {
        method: "PATCH",
        json: { notes: editingLead.notes, status: editingLead.status },
      });
      toast("Lead updated");
      setEditingLead(null);
      reload();
    } catch {
      toast("Failed to update lead", "err");
    }
  }

  async function handleConvert(lead: LeadRow) {
    setConverting(lead.id);
    try {
      const res = await api<{ ok: boolean; clientId: number; projectId: number }>(
        `/api/admin/leads/${lead.id}/convert`,
        { json: {} }
      );
      toast(`Converted ${lead.name} to Client #${res.clientId} & Project #${res.projectId}!`);
      reload();
    } catch {
      toast("Failed to convert lead", "err");
    } finally {
      setConverting(null);
    }
  }

  async function handleGenerateProposal(lead: LeadRow) {
    setAiProposalLead(lead);
    setGeneratingProposal(true);
    try {
      const res = await api<{ text: string; source: string }>("/api/ai/assist", {
        json: {
          kind: "reply_lead",
          input: `Client Name: ${lead.name}, Service: ${lead.service}, Budget: ${lead.budget}, Inquired: "${lead.message}"`,
        },
      });
      setProposalText(res.text);
    } catch {
      setProposalText(
        `Hi ${lead.name},\n\nThank you for reaching out to VisionFold Creative regarding your ${lead.service} project!\n\nWe've reviewed your brief: "${lead.message}". We would love to take on this cut and deliver studio-grade cinema color, sound design, and pacing.\n\nCould you share a Google Drive/Dropbox link to your raw footage and your target delivery deadline? We'll provide a milestone schedule within 24 hours.\n\nBest,\nAliasgar & VisionFold Studio Team`
      );
    } finally {
      setGeneratingProposal(false);
    }
  }

  function getScore(l: LeadRow): { label: string; tone: "won" | "contacted" | "new" } {
    const b = l.budget.toLowerCase();
    if (b.includes("5,000") || b.includes("6,000") || b.includes("10,000") || b.includes("+")) {
      return { label: "High Value", tone: "won" };
    }
    if (b.includes("2,000") || b.includes("3,000") || b.includes("month")) {
      return { label: "Warm Lead", tone: "contacted" };
    }
    return { label: "Standard", tone: "new" };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Leads & Inquiries CRM</h1>
          <p className="text-sm text-slate-500">Track prospective clients, send proposals, and convert into projects</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add new lead
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="glass rounded-2xl p-4">
          <p className="font-display text-2xl font-bold text-white">{stats.total}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">Total Leads</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="font-display text-2xl font-bold text-cyan-300">{stats.new}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">New / Uncontacted</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="font-display text-2xl font-bold text-amber-300">{stats.contacted}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">In Discussion</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="font-display text-2xl font-bold text-emerald-300">{stats.won}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">Won & Booked</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="font-display text-2xl font-bold text-brand-300">{stats.conversion}%</p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">Win Rate</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-panel p-4">
        <div className="flex flex-wrap gap-1.5">
          {(["all", "new", "contacted", "won", "lost"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === st
                  ? "bg-brand-600 text-white shadow-[0_0_16px_-4px_rgba(115,87,255,0.8)]"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {st} {st !== "all" && leads ? `(${leads.filter((l) => l.status === st).length})` : ""}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads…"
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Leads List */}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Empty
          title="No leads found"
          desc={filter !== "all" ? `No leads in status "${filter}".` : "No leads in pipeline yet."}
          action={<Button onClick={() => setShowAdd(true)}><Plus size={14} /> Create lead</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const score = getScore(lead);
            const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
            return (
              <div
                key={lead.id}
                className="glass card-glow flex flex-col justify-between gap-4 rounded-2xl p-5 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-display text-base font-bold text-white">{lead.name}</h3>
                    <Badge tone={lead.status}>{lead.status}</Badge>
                    <Badge tone={score.tone}>{score.label}</Badge>
                    <span className="text-[11px] text-slate-500">· {fmtDate(lead.createdAt)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Mail size={13} className="text-brand-300" /> {lead.email}
                    </span>
                    {lead.phone && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <Phone size={13} className="text-cyan-300" /> {lead.phone}
                      </span>
                    )}
                    <span className="font-semibold text-amber-300">Service: {lead.service}</span>
                    {lead.budget && (
                      <span className="font-semibold text-emerald-300">Budget: {lead.budget}</span>
                    )}
                  </div>

                  {lead.message && (
                    <p className="rounded-xl border border-white/6 bg-ink/50 p-3 text-xs leading-relaxed text-slate-300">
                      “{lead.message}”
                    </p>
                  )}

                  {lead.notes && (
                    <p className="text-[11px] text-slate-400">
                      <span className="font-semibold uppercase tracking-wider text-slate-500">Internal Note:</span>{" "}
                      {lead.notes}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/8 pt-3 md:border-t-0 md:pt-0">
                  {/* Status Dropdown */}
                  <Select
                    value={lead.status}
                    onChange={(e) => handleUpdateStatus(lead, e.target.value as any)}
                    className="h-8 py-0 text-xs w-32"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </Select>

                  {/* AI Proposal */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateProposal(lead)}
                    title="Generate tailored AI proposal reply"
                  >
                    <Sparkles size={13} className="text-cyan-300" /> Draft Reply
                  </Button>

                  {/* Convert to Client */}
                  {lead.status !== "won" && (
                    <Button
                      size="sm"
                      onClick={() => handleConvert(lead)}
                      disabled={converting === lead.id}
                      title="Convert lead to active client & portal project"
                    >
                      <UserCheck size={13} /> {converting === lead.id ? "Converting…" : "Convert to Client"}
                    </Button>
                  )}

                  {/* WhatsApp Direct */}
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                        `Hi ${lead.name}, Aliasgar here from VisionFold Creative regarding your ${lead.service} inquiry!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                      title="Direct WhatsApp"
                    >
                      <MessageSquare size={13} /> WhatsApp
                    </a>
                  )}

                  {/* Edit Notes */}
                  <Button size="sm" variant="ghost" onClick={() => setEditingLead(lead)}>
                    Notes
                  </Button>

                  {/* Delete */}
                  <ConfirmButton
                    title="Delete lead"
                    onConfirm={async () => {
                      try {
                        await api(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
                        toast("Lead deleted");
                        reload();
                      } catch {
                        toast("Failed to delete lead", "err");
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Prospective Lead">
        <form onSubmit={handleAdd} className="space-y-4">
          <Field label="Full Name">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. David Miller"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="david@example.com"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Service Required">
              <Select
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
              >
                <option value="Brand Films">Brand Films</option>
                <option value="YouTube Editing">YouTube Editing</option>
                <option value="Commercials & Ads">Commercials & Ads</option>
                <option value="Music Video">Music Video</option>
                <option value="Podcast Editing">Podcast Editing</option>
                <option value="Wedding Cinema">Wedding Cinema</option>
              </Select>
            </Field>
            <Field label="Budget Range">
              <Input
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="e.g. $3,000 - $5,000"
              />
            </Field>
          </div>
          <Field label="Project Brief / Message">
            <Textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Describe the footage, style references, and expectations…"
            />
          </Field>
          <Field label="Internal Notes">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Found us on YouTube; needs completion by Sep 15"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Lead</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Notes Modal */}
      {editingLead && (
        <Modal open={Boolean(editingLead)} onClose={() => setEditingLead(null)} title={`Edit Notes for ${editingLead.name}`}>
          <form onSubmit={handleSaveNotes} className="space-y-4">
            <Field label="Status">
              <Select
                value={editingLead.status}
                onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value as any })}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </Select>
            </Field>
            <Field label="Internal Notes & History">
              <Textarea
                rows={4}
                value={editingLead.notes}
                onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                placeholder="Log discussion notes, timeline agreements, or next steps…"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditingLead(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Notes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* AI Proposal Drawer Modal */}
      {aiProposalLead && (
        <Modal
          open={Boolean(aiProposalLead)}
          onClose={() => setAiProposalLead(null)}
          title={`Draft Reply for ${aiProposalLead.name}`}
          wide
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3 text-xs text-slate-300">
              <p className="font-semibold text-cyan-300">Lead Context</p>
              <p className="mt-0.5">
                Service: <strong>{aiProposalLead.service}</strong> · Budget: <strong>{aiProposalLead.budget || "Not specified"}</strong>
              </p>
              <p className="mt-1 text-slate-400">“{aiProposalLead.message}”</p>
            </div>

            {generatingProposal ? (
              <div className="py-8 text-center">
                <Spinner />
                <p className="mt-2 text-xs text-slate-400">Crafting tailored studio proposal with AI…</p>
              </div>
            ) : (
              <Field label="Proposed Email / Message Draft">
                <Textarea
                  rows={8}
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                  className="font-mono text-xs leading-relaxed"
                />
              </Field>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-3">
              <p className="text-[11px] text-slate-500">Edit draft before sending or copying.</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(proposalText);
                    toast("Proposal copied to clipboard!");
                  }}
                >
                  <Copy size={14} /> Copy Text
                </Button>
                <a
                  href={`mailto:${aiProposalLead.email}?subject=${encodeURIComponent(
                    `VisionFold Creative — ${aiProposalLead.service} Proposal`
                  )}&body=${encodeURIComponent(proposalText)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-brand-500"
                >
                  <Mail size={14} /> Open in Email App
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
