"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  ProgressBar,
  Select,
  PortalSkeleton,
  StatusBadge,
  Textarea,
  toast,
} from "@/components/AdminUI";
import { fmtDate, fmtMoney, timeAgo } from "@/lib/utils";
import { BRIEF_FIELDS, validateBrief, type BriefField } from "@/lib/intake";
import {
  AlertCircle,
  Activity,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  TrendingUp,
  Wallet,
  Eye,
  Film,
  FolderKanban,
  Link2,
  Maximize2,
  MessageSquare,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Send,
  Sliders,
  Sparkles,
  Star,
  User,
  Zap,
} from "lucide-react";

type OverviewData = {
  client: {
    id: number;
    name: string;
    email: string;
    company: string;
    phone: string;
    status: string;
    createdAt: string;
  };
  projects: any[];
  updates: any[];
  deliverables: any[];
  messages: any[];
  invoices: any[];
  ratings: any[];
  unread: number;
};

const EMPTY_INTAKE: Record<string, string | string[]> = {
  title: "",
  service: "Brand film",
  deadline: "",
  footageUrl: "",
  runtime: "1â€“3 minutes",
  aspectRatios: ["16:9 landscape"],
  captions: "Burned-in captions",
  music: "You choose a licensed track",
  brandKit: "",
  references: "",
  notes: "",
  budget: "1500.00",
};

function IntakeField({
  field,
  value,
  onChange,
}: {
  field: BriefField;
  value: string | string[] | undefined;
  onChange: (next: string | string[]) => void;
}) {
  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <Field label={`${field.label}${field.required ? " *" : ""}`} hint={field.help}>
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onChange(active ? selected.filter((s) => s !== option) : [...selected, option])
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-brand-400/60 bg-brand-500/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </Field>
    );
  }

  const label = `${field.label}${field.required ? " *" : ""}`;
  if (field.type === "select") {
    return (
      <Field label={label} hint={field.help}>
        <Select required={field.required} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
      </Field>
    );
  }
  return (
    <Field label={label} hint={field.help}>
      <Input
        type={field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
        required={field.required}
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export default function ClientPortalPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"projects" | "messages" | "invoices" | "activity" | "profile">("projects");

  // Review Player State
  const [activeReviewProj, setActiveReviewProj] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(38);
  const [duration] = useState(195);
  const [splitPosition, setSplitPosition] = useState(50);
  const [showColorSplit, setShowColorSplit] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Messages State
  const [chatDraft, setChatDraft] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // New Project Intake Modal â€” structured brief (deadline, formats, captionsâ€¦)
  const [showIntake, setShowIntake] = useState(false);
  const [intakeForm, setIntakeForm] = useState<Record<string, string | string[]>>({ ...EMPTY_INTAKE });

  // Approval ("e-signature") Modal
  const [approvingProj, setApprovingProj] = useState<any>(null);
  const [signName, setSignName] = useState("");
  const [withInvoice, setWithInvoice] = useState(false);
  const [signing, setSigning] = useState(false);

  // Rating Modal
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingProject, setRatingProject] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);

  const existingRating = (data?.ratings || [])[0] as { id?: number; stars?: number; comment?: string; visible?: boolean } | undefined;

  function openRatingModal() {
    if (existingRating) {
      setRatingStars(existingRating.stars || 5);
      setRatingComment(existingRating.comment || "");
    }
    setShowRatingModal(true);
  }

  // Pay Modal
  const [payingInvoice, setPayingInvoice] = useState<any | null>(null);
  const [processingPay, setProcessingPay] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/overview");
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (d.projects?.length) {
          setActiveReviewProj((current: any) => current || d.projects[0]);
        }
      }
    } catch {
      toast("Failed to load portal data", "err");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadData(), 0);
    // Faster heartbeat while the client is actively chatting.
    const period = tab === "messages" ? 3000 : 8000;
    const interval = window.setInterval(() => {
      // Pause background polling while the tab is hidden — saves battery
      // and stops needless re-renders when the studio OS sits in another tab.
      if (document.visibilityState === "hidden") return;
      void loadData();
    }, period);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [loadData, tab]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
    if (tab === "messages" && data?.unread) {
      void fetch("/api/portal/read", { method: "POST" }).then((response) => {
        if (response.ok) setData((current) => current ? { ...current, unread: 0 } : current);
      });
    }
  }, [data?.messages, data?.unread, tab]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatDraft.trim()) return;
    setSendingMsg(true);
    try {
      const res = await fetch("/api/portal/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: chatDraft }),
      });
      if (res.ok) {
        setChatDraft("");
        await loadData();
      } else {
        toast("Failed to send message", "err");
      }
    } catch {
      toast("Network error", "err");
    } finally {
      setSendingMsg(false);
    }
  }

  async function handleReviewFeedback(approved: boolean) {
    if (!activeReviewProj) return;
    if (!approved && !feedbackText.trim()) {
      toast("Please enter your revision notes before submitting", "err");
      return;
    }
    setSubmittingFeedback(true);
    try {
      const formatTime = `${Math.floor(playTime / 60)
        .toString()
        .padStart(2, "0")}:${Math.floor(playTime % 60)
        .toString()
        .padStart(2, "0")}`;

      const res = await fetch("/api/portal/project-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeReviewProj.id,
          timestamp: formatTime,
          feedback: feedbackText,
          approved,
        }),
      });

      if (res.ok) {
        toast(approved ? "Master cut approved! Thank you!" : `Revision notes pinned at ${formatTime}`);
        setFeedbackText("");
        await loadData();
      } else {
        toast("Failed to submit feedback", "err");
      }
    } catch {
      toast("Error submitting review", "err");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  async function handleIntakeSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/portal/request-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(intakeForm.title || ""),
          service: String(intakeForm.service || "Video Editing"),
          description: String(intakeForm.notes || intakeForm.description || ""),
          budget: intakeForm.budget,
          answers: intakeForm,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        toast("Brief received â€” the studio will confirm your schedule shortly!");
        setShowIntake(false);
        setIntakeForm({ ...EMPTY_INTAKE });
        await loadData();
      } else {
        toast(result.error || "Submission failed", "err");
      }
    } catch {
      toast("Network error", "err");
    }
  }

  async function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    if (!approvingProj) return;
    setSigning(true);
    try {
      const res = await fetch("/api/portal/approve-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: approvingProj.id,
          signedName: signName,
          createInvoice: withInvoice,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(result.error || "Approval failed", "err");
        return;
      }
      toast(
        result.invoiceCreated
          ? "Approved & signed â€” final invoice generated ðŸŽ‰"
          : "Approved & signed â€” thank you! ðŸŽ‰"
      );
      setApprovingProj(null);
      setSignName("");
      setWithInvoice(false);
      await loadData();
    } catch {
      toast("Network error", "err");
    } finally {
      setSigning(false);
    }
  }

  async function copyPayLink(invoiceId: number) {    try {
      const res = await fetch("/api/portal/paylink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) return toast(result.error || "Could not create link", "err");
      const absolute = result.url.startsWith("http") ? result.url : `${window.location.origin}${result.url}`;
      await navigator.clipboard.writeText(absolute);
      toast("Payment link copied â€” share it with your finance team");
    } catch {
      toast("Network error", "err");
    }
  }

  async function handlePayInvoice(invoiceId: number) {
    setProcessingPay(true);
    try {
      const res = await fetch("/api/portal/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result.checkoutUrl) {
        toast("Opening secure checkoutâ€¦");
        window.location.assign(result.checkoutUrl);
      } else {
        toast(result.error || "Secure payment is not available yet", "err");
      }
    } catch {
      toast("Payment network error", "err");
    } finally {
      setProcessingPay(false);
    }
  }

  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/portal/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), company: form.get("company"), phone: form.get("phone") }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) return toast(result.error || "Could not update profile", "err");
    toast("Profile updated");
    await loadData();
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const element = e.currentTarget;
    const form = new FormData(element);
    const next = String(form.get("next") || "");
    const confirm = String(form.get("confirm") || "");
    if (next !== confirm) return toast("New passwords do not match", "err");
    const res = await fetch("/api/portal/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: form.get("current"), next }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) return toast(result.error || "Could not change password", "err");
    element.reset();
    toast("Password changed securely");
  }

  async function handleRatingSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/portal/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stars: ratingStars,
          comment: ratingComment,
          projectId: ratingProject || undefined,
        }),
      });
      if (res.ok) {
        toast(existingRating ? "Your review was updated!" : "Thank you for your rating!");
        setShowRatingModal(false);
        await loadData();
      }
    } catch {
      toast("Error submitting review", "err");
    }
  }

  if (loading || !data) return <PortalSkeleton />;

  const client = data.client;
  const projects = data.projects || [];
  const updates = data.updates || [];
  const messages = data.messages || [];
  const invoices = data.invoices || [];
  const deliverables = data.deliverables || [];
  const activeProjects = projects.filter((project) => project.status !== "completed");
  const outstandingInvoices = invoices.filter((invoice) => invoice.status !== "paid");
  const nextDue = [...activeProjects]
    .filter((project) => project.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0];
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
  const totalInvested = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const avgProgress = activeProjects.length
    ? Math.round(activeProjects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / activeProjects.length)
    : 0;
  const projectTitle = (id: number) => projects.find((project) => project.id === id)?.title || "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="animate-page-in mx-auto max-w-6xl px-5 py-8 space-y-6">
      {/* Welcome Banner */}
      <div className="glass card-glow flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-cy-500 font-display text-xl font-bold text-white shadow-lg shadow-brand-500/30">
            {client.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-white">{greeting}, {client.name.split(" ")[0]}</h1>
              <Badge tone="active">{client.status}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {avgProgress > 0 ? `${activeProjects.length} active project${activeProjects.length === 1 ? "" : "s"} Â· ${avgProgress}% complete overall Â· ` : ""}
              Client ID #{client.id}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openRatingModal}>
            <Star size={14} className="text-amber-300" /> {existingRating ? "Update Review" : "Leave a Review"}
          </Button>
          <Button onClick={() => setShowIntake(true)}>
            <Plus size={15} /> Request New Cut
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Active projects", value: activeProjects.length, detail: `${projects.length} total`, Icon: FolderKanban, tone: "text-brand-300 bg-brand-500/10" },
          { label: "Ready files", value: deliverables.length, detail: "secure downloads", Icon: Download, tone: "text-cyan-300 bg-cyan-500/10" },
          { label: "Total invested", value: fmtMoney(totalInvested), detail: `${paidInvoices.length} paid`, Icon: Wallet, tone: "text-emerald-300 bg-emerald-500/10" },
          { label: "Avg progress", value: `${avgProgress}%`, detail: "across active cuts", Icon: TrendingUp, tone: "text-brand-300 bg-brand-500/10" },
          { label: "Open invoices", value: outstandingInvoices.length, detail: outstandingInvoices.length ? fmtMoney(outstandingInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)) : "all settled", Icon: CreditCard, tone: "text-amber-300 bg-amber-500/10" },
          { label: "Next deadline", value: nextDue?.dueDate || "Flexible", detail: nextDue?.title || "No deadline set", Icon: Clock, tone: "text-emerald-300 bg-emerald-500/10" },
        ].map(({ label, value, detail, Icon, tone }) => (
          <div key={label} className="hover-lift rounded-2xl border border-white/[0.07] bg-panel/70 p-4">
            <div className={`mb-3 grid h-8 w-8 place-items-center rounded-lg ${tone}`}><Icon size={15} /></div>
            <p className="truncate font-display text-xl font-bold text-white">{value}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-1 truncate text-[10px] text-slate-600">{detail}</p>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/8 pb-3">
        {[
          { id: "projects", label: "Projects & Review Player", Icon: Film, count: projects.length },
          { id: "messages", label: "Studio Chat", Icon: MessageSquare, count: data.unread > 0 ? data.unread : undefined },
          { id: "invoices", label: "Invoices & Receipts", Icon: CreditCard, count: invoices.length },
          { id: "activity", label: "Activity", Icon: Activity },
          { id: "profile", label: "Settings", Icon: User },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-brand-600 text-white shadow-[0_0_20px_-6px_rgba(115,87,255,0.9)]"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <t.Icon size={16} />
            {t.label}
            {t.count !== undefined && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                tab === t.id ? "bg-white/20 text-white" : "bg-white/10 text-slate-300"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. PROJECTS & REVIEW PLAYER TAB */}
      {tab === "projects" && (
        <div className="space-y-6">
          {/* Active Project Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((proj) => {
              const isSelected = activeReviewProj?.id === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => setActiveReviewProj(proj)}
                  className={`glass card-glow cursor-pointer rounded-2xl p-5 transition-all ${
                    isSelected ? "border-brand-500 shadow-[0_0_30px_-8px_rgba(115,87,255,0.6)]" : "hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">{proj.service}</span>
                      <h3 className="font-display mt-1 text-lg font-bold text-white">{proj.title}</h3>
                    </div>
                    <StatusBadge status={proj.status} />
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-slate-400 line-clamp-2">{proj.description}</p>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Production Progress</span>
                      <span className="font-semibold text-white">{proj.progress}%</span>
                    </div>
                    <ProgressBar value={proj.progress} />
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-xs text-slate-400">
                    <span>Due: {proj.dueDate || "Flexible"}</span>
                    <span className="font-semibold text-emerald-300">{fmtMoney(proj.budget)}</span>
                  </div>

                  {proj.status !== "completed" && proj.progress >= 80 && (
                    <div className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setApprovingProj(proj);
                          setSignName("");
                          setWithInvoice(true);
                        }}
                      >
                        âœ’ Approve final cut
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {projects.length === 0 && (
            <div className="relative overflow-hidden rounded-3xl border border-dashed border-brand-400/25 bg-brand-500/[0.04] px-6 py-14 text-center">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(115,87,255,.18),transparent_55%)]" />
              <Film size={34} className="relative mx-auto text-brand-300" />
              <h3 className="relative mt-4 font-display text-xl font-bold text-white">Your first production starts here</h3>
              <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">Send the studio your brief, footage link, goals and budget. We will review it and turn this empty workspace into a live production timeline.</p>
              <Button className="relative mt-5" onClick={() => setShowIntake(true)}><Plus size={14} /> Submit your first brief</Button>
            </div>
          )}

          {/* 4K DELIVERABLE REVIEW PLAYER */}
          {activeReviewProj && (
            <Card
              title={
                <div className="flex items-center gap-2">
                  <Film size={18} className="text-brand-300" />
                  <span>4K Review Player: {activeReviewProj.title}</span>
                </div>
              }
              desc="Interactive timeline review with split-screen color grading comparison"
              actions={<Badge tone={activeReviewProj.status}>{activeReviewProj.status}</Badge>}
            >
              <div className="space-y-4">
                {/* Cinema Canvas Viewport */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                  {/* Left Side: Cinema Color Grade */}
                  <img
                    src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop"
                    alt="Master Color Graded Cut"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                      filter: showColorSplit
                        ? "contrast(1.15) saturate(1.25) drop-shadow(0 0 10px rgba(115,87,255,0.4))"
                        : "none",
                    }}
                  />

                  {/* Right Side: RAW Log Footage Split (if enabled) */}
                  {showColorSplit && (
                    <div
                      className="absolute inset-y-0 right-0 overflow-hidden border-l-2 border-amber-400"
                      style={{ width: `${100 - splitPosition}%` }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop"
                        alt="Raw Log Sensor Footage"
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{
                          filter: "contrast(0.65) brightness(1.1) saturate(0.4) sepia(0.1)",
                          width: `${100 / ((100 - splitPosition) / 100)}%`,
                          maxWidth: "none",
                          right: 0,
                        }}
                      />
                      <div className="absolute top-3 right-3 rounded-lg bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md">
                        Raw Log Flat
                      </div>
                    </div>
                  )}

                  {showColorSplit && (
                    <div className="absolute top-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300 backdrop-blur-md">
                      Cinema Grade & VFX
                    </div>
                  )}

                  {/* Center Split Slider Handle */}
                  {showColorSplit && (
                    <div
                      className="pointer-events-none absolute inset-y-0 flex items-center justify-center"
                      style={{ left: `${splitPosition}%` }}
                    >
                      <div className="h-8 w-8 -translate-x-1/2 rounded-full border-2 border-white bg-brand-600 shadow-xl flex items-center justify-center text-white text-xs">
                        â†”
                      </div>
                    </div>
                  )}

                  {/* Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
                    {/* Scrub Bar */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-lg transition-transform hover:scale-105"
                      >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-0.5" />}
                      </button>

                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max={duration}
                          value={playTime}
                          onChange={(e) => setPlayTime(Number(e.target.value))}
                          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-brand-500"
                        />
                      </div>

                      <span className="font-mono text-xs font-semibold text-slate-300">
                        {Math.floor(playTime / 60)
                          .toString()
                          .padStart(2, "0")}
                        :
                        {Math.floor(playTime % 60)
                          .toString()
                          .padStart(2, "0")}{" "}
                        / 03:15
                      </span>

                      <button
                        onClick={() => setShowColorSplit(!showColorSplit)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                          showColorSplit ? "bg-amber-500/20 text-cyan-300 border border-amber-400/30" : "bg-white/10 text-slate-400"
                        }`}
                        title="Toggle RAW Log vs Cinema Grade Split Comparison"
                      >
                        <Sliders size={13} className="inline mr-1" /> Log vs Grade
                      </button>
                    </div>

                    {showColorSplit && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                        <span>Split Comparison:</span>
                        <input
                          type="range"
                          min="5"
                          max="95"
                          value={splitPosition}
                          onChange={(e) => setSplitPosition(Number(e.target.value))}
                          className="h-1 w-36 cursor-pointer rounded-full bg-white/20 accent-amber-400"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Actions & Feedback Submission */}
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="space-y-3 lg:col-span-2">
                    <Field
                      label="Submit Timestamped Revision Feedback"
                      hint={`Feedback will be pinned at ${Math.floor(playTime / 60)
                        .toString()
                        .padStart(2, "0")}:${Math.floor(playTime % 60)
                        .toString()
                        .padStart(2, "0")}`}
                    >
                      <Textarea
                        rows={3}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="e.g. Cut 3 frames earlier on the kick drum, adjust color warmth on the close-up..."
                      />
                    </Field>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleReviewFeedback(false)}
                          disabled={submittingFeedback || !feedbackText.trim()}
                        >
                          <RotateCcw size={14} /> Request Revision
                        </Button>
                        <Button
                          onClick={() => handleReviewFeedback(true)}
                          disabled={submittingFeedback}
                          className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30"
                        >
                          <CheckCircle2 size={14} /> Approve Final Master Cut
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {deliverables.filter((file) => file.projectId === activeReviewProj.id).map((file) => (
                          <a
                            key={file.id}
                            href={file.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/15 bg-amber-500/[0.05] px-3 py-2 text-xs transition hover:border-amber-400/35 hover:bg-amber-500/10"
                          >
                            <span className="flex min-w-0 items-center gap-2 text-amber-200"><Download size={13} /><span className="truncate font-semibold">{file.name}</span></span>
                            <span className="shrink-0 text-[9px] uppercase tracking-wider text-slate-500">{file.format} Â· {file.resolution}</span>
                          </a>
                        ))}
                        {!deliverables.some((file) => file.projectId === activeReviewProj.id) && (
                          <p className="text-[11px] text-slate-500">Final downloads will appear here when the studio publishes a deliverable.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Project Timeline Milestones */}
                  <div className="rounded-2xl border border-white/8 bg-ink/60 p-4 space-y-2.5">
                    <p className="font-display text-xs font-bold uppercase tracking-wider text-slate-400">
                      Studio Timeline Updates
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
                      {updates
                        .filter((u) => u.projectId === activeReviewProj.id)
                        .map((u) => (
                          <div key={u.id} className="rounded-xl border border-white/6 bg-white/2 p-2.5">
                            <p className="font-semibold text-white">{u.title}</p>
                            <p className="mt-0.5 text-slate-400">{u.body}</p>
                            <p className="mt-1 text-[10px] text-slate-600">{timeAgo(u.createdAt)}</p>
                          </div>
                        ))}
                      {updates.filter((u) => u.projectId === activeReviewProj.id).length === 0 && (
                        <p className="text-slate-500 text-[11px]">No updates logged yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 2. LIVE STUDIO CHAT TAB */}
      {      tab === "messages" && (
        <Card
          title="Direct Studio Chat"
          desc="Real-time communication for cuts, creative direction and file transfers"
        >
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live Â· auto-updating every 3s
          </div>
          <div className="flex h-[480px] flex-col justify-between rounded-2xl border border-white/8 bg-ink/50 p-4">
            <div ref={chatScrollRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto pr-2">
              {messages.map((msg) => {
                const isAdmin = msg.sender === "admin";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold">{isAdmin ? "VisionFold Studio" : client.name}</span>
                      <span>Â·</span>
                      <span>{timeAgo(msg.createdAt)}</span>
                    </div>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isAdmin
                          ? "rounded-tl-sm border border-white/10 bg-panel text-slate-200"
                          : "rounded-tr-sm bg-gradient-to-r from-brand-600 to-cy-500 text-white shadow-lg"
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="py-12 text-center text-xs text-slate-500">
                  No messages yet. Say hi or drop project notes below!
                </p>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="mt-3 flex gap-2 border-t border-white/8 pt-3">
              <Input
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Type your message or footage noteâ€¦"
                className="text-xs"
              />
              <Button type="submit" disabled={sendingMsg || !chatDraft.trim()}>
                <Send size={14} /> Send
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* 3. INVOICES & RECEIPTS TAB */}
      {tab === "invoices" && (
        <Card title="Invoices & Statements" desc="View payment records, balance due, and download receipts">
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-white">{inv.number}</span>
                    <Badge tone={inv.status}>{inv.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Due Date: {inv.dueDate || "Immediate"} {inv.notes ? `Â· ${inv.notes}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-bold text-white">{fmtMoney(inv.amount)}</span>
                  {inv.status !== "paid" ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => copyPayLink(inv.id)} title="Copy a shareable payment link">
                        <Link2 size={13} />
                      </Button>
                      <Button size="sm" onClick={() => setPayingInvoice(inv)}>
                        <CreditCard size={13} /> Pay Now
                      </Button>
                    </>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 size={14} /> Paid & Settled
                    </span>
                  )}
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-500">No invoices issued to date.</p>
            )}
          </div>
        </Card>
      )}

      {/* 4. ACTIVITY FEED TAB */}
      {tab === "activity" && (
        <Card title="Studio activity" desc="A chronological feed of every update, deliverable and invoice on your account">
          <div className="scrollbar-thin max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {[
              ...updates.map((u) => ({
                id: `u${u.id}`,
                ts: u.createdAt,
                tone: "amber" as const,
                title: u.title,
                detail: u.body,
                meta: projectTitle(u.projectId),
              })),
              ...deliverables.map((d) => ({
                id: `d${d.id}`,
                ts: d.createdAt,
                tone: "green" as const,
                title: "New deliverable ready",
                detail: d.name,
                meta: `${d.format} Â· ${d.resolution}`,
              })),
              ...invoices.map((inv) => ({
                id: `i${inv.id}`,
                ts: inv.createdAt,
                tone: (inv.status === "paid" ? "green" : "amber") as "green" | "amber",
                title: inv.status === "paid" ? "Invoice paid" : "Invoice issued",
                detail: `${inv.number} â€” ${fmtMoney(inv.amount)}`,
                meta: inv.status === "paid" ? "Settled" : `Due ${inv.dueDate || "immediately"}`,
              })),
            ]
              .sort((a, b) => String(b.ts).localeCompare(String(a.ts)))
              .map((item) => (
                <div key={item.id} className="glass flex items-start gap-3 rounded-2xl p-3.5">
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      item.tone === "green" ? "bg-emerald-400 ring-4 ring-emerald-400/15" : "bg-cyan-400 ring-4 ring-amber-400/15"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      {item.meta && <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{item.meta}</span>}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{item.detail}</p>
                    <p className="mt-1 text-[10px] text-slate-600">{timeAgo(item.ts)}</p>
                  </div>
                </div>
              ))}
            {updates.length === 0 && deliverables.length === 0 && invoices.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-500">No activity yet. Your timeline will fill up as the studio ships.</p>
            )}
          </div>
        </Card>
      )}

      {/* 5. PROFILE & SETTINGS TAB */}
      {tab === "profile" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Account profile" desc="Keep your studio contact information current">
            <form onSubmit={handleProfileSave} className="space-y-3">
              <Field label="Client name"><Input name="name" required defaultValue={client.name} maxLength={120} /></Field>
              <Field label="Email address" hint="Contact the studio to change your sign-in email."><Input value={client.email} disabled /></Field>
              <Field label="Company / brand"><Input name="company" defaultValue={client.company || ""} maxLength={160} placeholder="Independent creator" /></Field>
              <Field label="Phone"><Input name="phone" defaultValue={client.phone || ""} maxLength={40} placeholder="Add a contact number" /></Field>
              <div className="flex justify-end pt-2"><Button type="submit">Save profile</Button></div>
            </form>
          </Card>

          <Card title="Security & authentication" desc="Change your portal password securely">
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <Field label="Current password"><Input name="current" type="password" required autoComplete="current-password" /></Field>
              <Field label="New password" hint="Use at least 8 characters."><Input name="next" type="password" required minLength={8} autoComplete="new-password" /></Field>
              <Field label="Confirm new password"><Input name="confirm" type="password" required minLength={8} autoComplete="new-password" /></Field>
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-3 text-[11px] leading-relaxed text-slate-400">Your session is encrypted and the password is stored as a one-way hash. VisionFold staff cannot view it.</div>
              <div className="flex justify-end pt-2"><Button type="submit" variant="outline">Change password</Button></div>
            </form>
          </Card>

          <div className="md:col-span-2">
            <Card title="My public review" desc={existingRating?.visible === false ? "Submitted â€” waiting for studio approval before it goes live." : "This is what visitors see on the studio website."}>
              {existingRating ? (
                <div className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex gap-0.5 pt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={16} className={s <= (existingRating.stars || 5) ? "fill-amber-400 text-amber-400" : "text-slate-700"} />
                    ))}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-slate-200">â€œ{existingRating.comment}â€</p>
                    <button onClick={openRatingModal} className="mt-2 text-xs font-semibold text-brand-300 transition-colors hover:text-white">Edit review â†’</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-white/15 p-4">
                  <p className="text-sm text-slate-400">Haven&rsquo;t left a review yet. Your testimonial appears on the homepage and builds trust with future clients.</p>
                  <Button variant="outline" onClick={openRatingModal}><Star size={14} className="text-amber-300" /> Write a review</Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* New Project Intake Modal */}
      {approvingProj && (
        <Modal open={Boolean(approvingProj)} onClose={() => setApprovingProj(null)} title="Approve master cut">
          <form onSubmit={handleApprove} className="space-y-4">
            <div className="rounded-xl border border-brand-400/25 bg-brand-500/[0.06] p-4 text-xs leading-relaxed text-slate-300">
              <p>
                You&apos;re approving <span className="font-semibold text-white">â€œ{approvingProj.title}â€</span> as the
                final delivered cut. Your typed full name below acts as an electronic signature and is stored with a
                timestamp.
              </p>
            </div>
            <Field label={`Type your full name to sign: ${client?.name ?? ""}`}>
              <Input
                required
                value={signName}
                onChange={(e) => setSignName(e.target.value)}
                placeholder={client?.name ?? "Your full name"}
                autoComplete="off"
              />
            </Field>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
              <input
                type="checkbox"
                checked={withInvoice}
                onChange={(e) => setWithInvoice(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#7357FF]"
              />
              <span className="text-xs leading-relaxed text-slate-300">
                Also generate the final invoice from this project&apos;s budget ({fmtMoney(approvingProj.budget)})
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setApprovingProj(null)}>
                Not yet
              </Button>
              <Button type="submit" disabled={signing || signName.trim().toLowerCase() !== (client?.name ?? "").trim().toLowerCase()}>
                {signing ? "Signingâ€¦" : "âœ’ Sign & approve"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {showIntake && (
        <Modal open={showIntake} onClose={() => setShowIntake(false)} title="New project brief">
          <form onSubmit={handleIntakeSubmit} className="space-y-4">
            {(() => {
              const validation = validateBrief(intakeForm);
              return (
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <span>Brief completeness</span>
                    <span className={validation.complete ? "text-emerald-300" : "text-amber-300"}>
                      {validation.completeness}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full transition-all ${validation.complete ? "bg-emerald-400" : "bg-amber"}`}
                      style={{ width: `${validation.completeness}%` }}
                    />
                  </div>
                  {validation.warnings.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-slate-500">
                      {validation.warnings.slice(0, 3).map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}

            <div className="scrollbar-thin max-h-[52vh] space-y-4 overflow-y-auto pr-1">
              {BRIEF_FIELDS.map((field) => (
                <IntakeField
                  key={field.id}
                  field={field}
                  value={intakeForm[field.id]}
                  onChange={(next) => setIntakeForm((f) => ({ ...f, [field.id]: next }))}
                />
              ))}
              <Field label="Budget range (USD)">
                <Input
                  value={String(intakeForm.budget ?? "")}
                  onChange={(e) => setIntakeForm((f) => ({ ...f, budget: e.target.value }))}
                  placeholder="1500.00"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/8">
              <Button variant="ghost" onClick={() => setShowIntake(false)}>
                Cancel
              </Button>
              <Button type="submit">Send brief to the studio</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Pay Modal */}
      {payingInvoice && (
        <Modal open={Boolean(payingInvoice)} onClose={() => setPayingInvoice(null)} title={`Pay Invoice ${payingInvoice.number}`}>
          <div className="space-y-4">
            <div className="rounded-xl border border-brand-400/30 bg-brand-500/10 p-4 text-center">
              <p className="text-xs uppercase tracking-widest text-slate-400">Total Amount Due</p>
              <p className="font-display text-3xl font-bold text-white mt-1">{fmtMoney(payingInvoice.amount)}</p>
              <p className="text-xs text-slate-400 mt-1">Invoice #{payingInvoice.number}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-white">Payment Method</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="glass rounded-xl p-3 border-brand-500 text-white font-semibold">Credit / Debit</div>
                <div className="glass rounded-xl p-3 text-slate-400">Stripe Checkout</div>
                <div className="glass rounded-xl p-3 text-slate-400">UPI / Wire</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/8">
              <Button variant="ghost" onClick={() => setPayingInvoice(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => handlePayInvoice(payingInvoice.id)}
                disabled={processingPay}
                className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30"
              >
                <CreditCard size={14} /> {processingPay ? "Processingâ€¦" : `Confirm & Pay ${fmtMoney(payingInvoice.amount)}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Leave a Review Modal */}
      {showRatingModal && (
        <Modal open={showRatingModal} onClose={() => setShowRatingModal(false)} title={existingRating ? "Update Your Review" : "Rate Your Experience with VisionFold"}>
          <form onSubmit={handleRatingSubmit} className="space-y-4">
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRatingStars(star)}
                  className="p-1 text-2xl transition-transform duration-150 hover:scale-125"
                >
                  <Star
                    size={28}
                    className={star <= ratingStars ? "fill-amber-400 text-amber-400" : "text-slate-600"}
                  />
                </button>
              ))}
            </div>

            <Field label="Which project is this for? (optional)">
              <Select value={ratingProject} onChange={(e) => setRatingProject(e.target.value)}>
                <option value="">General studio experience</option>
                {projects.map((project: any) => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </Select>
            </Field>

            <Field label="Your Testimonial Review">
              <Textarea
                rows={4}
                required
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="How was the editing quality, turnaround time, sound design, and color grading?..."
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/8">
              <Button variant="ghost" onClick={() => setShowRatingModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit {ratingStars}â˜… Review</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
