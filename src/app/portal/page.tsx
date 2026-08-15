"use client";

import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  ProgressBar,
  Select,
  Spinner,
  StatusBadge,
  Textarea,
  toast,
} from "@/components/AdminUI";
import { fmtDate, fmtMoney, timeAgo } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Film,
  FolderKanban,
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
  messages: any[];
  invoices: any[];
  ratings: any[];
  unread: number;
};

export default function ClientPortalPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"projects" | "messages" | "invoices" | "profile">("projects");

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

  // New Project Intake Modal
  const [showIntake, setShowIntake] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    title: "",
    service: "Brand Films",
    description: "",
    budget: "$2,500",
    footageUrl: "",
  });

  // Rating Modal
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Pay Modal
  const [payingInvoice, setPayingInvoice] = useState<any | null>(null);
  const [processingPay, setProcessingPay] = useState(false);

  async function loadData() {
    try {
      const res = await fetch("/api/portal/overview");
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (d.projects?.length && !activeReviewProj) {
          setActiveReviewProj(d.projects[0]);
        }
      }
    } catch {
      toast("Failed to load portal data", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [data?.messages, tab]);

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
          title: intakeForm.title,
          service: intakeForm.service,
          description: `${intakeForm.description}\n\nFootage Link: ${intakeForm.footageUrl}`,
          budget: intakeForm.budget,
        }),
      });
      if (res.ok) {
        toast("Project request submitted to the studio!");
        setShowIntake(false);
        setIntakeForm({
          title: "",
          service: "Brand Films",
          description: "",
          budget: "$2,500",
          footageUrl: "",
        });
        await loadData();
      } else {
        toast("Submission failed", "err");
      }
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
      if (res.ok) {
        toast("Payment processed successfully! Receipt generated.");
        setPayingInvoice(null);
        await loadData();
      } else {
        toast("Payment failed", "err");
      }
    } catch {
      toast("Payment network error", "err");
    } finally {
      setProcessingPay(false);
    }
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
        }),
      });
      if (res.ok) {
        toast("Thank you for your rating!");
        setShowRatingModal(false);
        await loadData();
      }
    } catch {
      toast("Error submitting review", "err");
    }
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const client = data.client;
  const projects = data.projects || [];
  const updates = data.updates || [];
  const messages = data.messages || [];
  const invoices = data.invoices || [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 space-y-6">
      {/* Welcome Banner */}
      <div className="glass card-glow flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-cy-500 font-display text-xl font-bold text-white shadow-lg shadow-brand-500/30">
            {client.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-white">Welcome back, {client.name}</h1>
              <Badge tone="active">{client.status}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {client.company ? `${client.company} · ` : ""}Client ID #{client.id} · Connected to VisionFold Studio Suite
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowRatingModal(true)}>
            <Star size={14} className="text-amber-300" /> Leave a Review
          </Button>
          <Button onClick={() => setShowIntake(true)}>
            <Plus size={15} /> Request New Cut
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/8 pb-3">
        {[
          { id: "projects", label: "Projects & Review Player", Icon: Film, count: projects.length },
          { id: "messages", label: "Studio Chat", Icon: MessageSquare, count: data.unread > 0 ? data.unread : undefined },
          { id: "invoices", label: "Invoices & Receipts", Icon: CreditCard, count: invoices.length },
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
                </div>
              );
            })}
          </div>

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
                      className="absolute inset-y-0 right-0 overflow-hidden border-l-2 border-cyan-400"
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
                        ↔
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
                          showColorSplit ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "bg-white/10 text-slate-400"
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
                          className="h-1 w-36 cursor-pointer rounded-full bg-white/20 accent-cyan-400"
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

                      <a
                        href="https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-city-at-night-with-neon-lights-42541-large.mp4"
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:underline"
                      >
                        <Download size={13} /> Download Master ProRes 422 ↗
                      </a>
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
      {tab === "messages" && (
        <Card
          title="Direct Studio Chat with Aliasgar"
          desc="Real-time communication for cuts, creative direction and file transfers"
        >
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
                      <span className="font-semibold">{isAdmin ? "Aliasgar (VisionFold)" : client.name}</span>
                      <span>·</span>
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
                placeholder="Type your message or footage note…"
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
                    Due Date: {inv.dueDate || "Immediate"} {inv.notes ? `· ${inv.notes}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-bold text-white">{fmtMoney(inv.amount)}</span>
                  {inv.status !== "paid" ? (
                    <Button size="sm" onClick={() => setPayingInvoice(inv)}>
                      <CreditCard size={13} /> Pay Now
                    </Button>
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

      {/* 4. PROFILE & SETTINGS TAB */}
      {tab === "profile" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Account Profile" desc="Your studio contact information">
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-white/8 p-3">
                <p className="text-slate-500 uppercase tracking-widest text-[10px]">Client Name</p>
                <p className="mt-1 font-semibold text-white">{client.name}</p>
              </div>
              <div className="rounded-xl border border-white/8 p-3">
                <p className="text-slate-500 uppercase tracking-widest text-[10px]">Email Address</p>
                <p className="mt-1 font-semibold text-white">{client.email}</p>
              </div>
              <div className="rounded-xl border border-white/8 p-3">
                <p className="text-slate-500 uppercase tracking-widest text-[10px]">Company / Brand</p>
                <p className="mt-1 font-semibold text-white">{client.company || "Independent Creator"}</p>
              </div>
              <div className="rounded-xl border border-white/8 p-3">
                <p className="text-slate-500 uppercase tracking-widest text-[10px]">Phone</p>
                <p className="mt-1 font-semibold text-white">{client.phone || "Not set"}</p>
              </div>
            </div>
          </Card>

          <Card title="Security & Authentication" desc="Studio portal access">
            <p className="text-xs text-slate-400 mb-4">
              Your account is authenticated via encrypted session tokens. If you need to update your password or invite team members, contact Aliasgar.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                toast("Password reset instructions sent to your email");
              }}
            >
              Request Password Reset Email
            </Button>
          </Card>
        </div>
      )}

      {/* New Project Intake Modal */}
      {showIntake && (
        <Modal open={showIntake} onClose={() => setShowIntake(false)} title="Submit New Project Brief">
          <form onSubmit={handleIntakeSubmit} className="space-y-4">
            <Field label="Project Title">
              <Input
                required
                value={intakeForm.title}
                onChange={(e) => setIntakeForm({ ...intakeForm, title: e.target.value })}
                placeholder="e.g. Autumn Brand Launch Film 4K"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Service">
                <Select
                  value={intakeForm.service}
                  onChange={(e) => setIntakeForm({ ...intakeForm, service: e.target.value })}
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
                  value={intakeForm.budget}
                  onChange={(e) => setIntakeForm({ ...intakeForm, budget: e.target.value })}
                  placeholder="e.g. $2,500"
                />
              </Field>
            </div>

            <Field label="Raw Footage Link (Google Drive / Dropbox / Frame.io)">
              <Input
                required
                type="url"
                value={intakeForm.footageUrl}
                onChange={(e) => setIntakeForm({ ...intakeForm, footageUrl: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </Field>

            <Field label="Creative Brief & References">
              <Textarea
                rows={4}
                required
                value={intakeForm.description}
                onChange={(e) => setIntakeForm({ ...intakeForm, description: e.target.value })}
                placeholder="Pacing requirements, target video duration, music preferences, mood references…"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/8">
              <Button variant="ghost" onClick={() => setShowIntake(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Brief to Suite</Button>
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
                <CreditCard size={14} /> {processingPay ? "Processing…" : `Confirm & Pay ${fmtMoney(payingInvoice.amount)}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Leave a Review Modal */}
      {showRatingModal && (
        <Modal open={showRatingModal} onClose={() => setShowRatingModal(false)} title="Rate Your Experience with VisionFold">
          <form onSubmit={handleRatingSubmit} className="space-y-4">
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRatingStars(star)}
                  className="p-1 text-2xl transition-transform hover:scale-125"
                >
                  <Star
                    size={28}
                    className={star <= ratingStars ? "fill-amber-400 text-amber-400" : "text-slate-600"}
                  />
                </button>
              ))}
            </div>

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
              <Button type="submit">Submit 5★ Review</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
