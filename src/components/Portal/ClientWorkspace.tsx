import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FolderKanban, MessageSquare, Settings, LogOut,
  Clock, CheckCircle2, Loader2, Send, Star, X, Sparkles, Eye, EyeOff,
  AlertCircle, CalendarDays,
} from 'lucide-react';
import { SkeletonGrid, SkeletonCard } from '../ui/Skeleton';

const C = 'rounded-2xl border border-white/10 bg-[#0C0C10] p-5';
const I = 'w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-[#666] outline-none focus:border-[#D4AF37]/50';

type Project = {
  id: string;
  title: string;
  status: string;
  category: string;
  description?: string;
  deliveryDate?: string;
  amountINR?: number;
  amountInr?: number;
};
type Invoice = {
  id: string;
  invoiceNumber: string;
  amountINR?: number;
  amountInr?: number;
  dueDate: string;
  status: string;
  description: string;
};
type Revision = {
  id: string;
  projectId: string;
  comment: string;
  status: string;
  createdAt: string;
};
type Tab = 'dashboard' | 'projects' | 'messages' | 'settings';

const progressFor = (s: string) =>
  s === 'delivered' ? 100 : s === 'in_review' ? 75 : s === 'in_progress' ? 45 : 15;

const statusLabel = (s: string) =>
  s === 'delivered' ? 'Shipped' : s === 'in_review' ? 'In review' : s === 'in_progress' ? 'Editors working' : s;

const daysLeft = (d?: string) =>
  d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;

export function ClientWorkspace(_props: { onNavigate: (page: string) => void }) {
  const { user, token, isLoading, logout, login } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [msgProjectId, setMsgProjectId] = useState('');
  const [msgText, setMsgText] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [ratingProjectId, setRatingProjectId] = useState('');
  const [rating, setRating] = useState(5);
  const [ratingNote, setRatingNote] = useState('');
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [toast, setToast] = useState('');

  const fetchData = async () => {
    if (!token) return;
    setDataLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [pr, ir, rr] = await Promise.all([
        fetch('/api/projects', { headers, credentials: 'include' }),
        fetch('/api/invoices', { headers, credentials: 'include' }),
        fetch('/api/revisions', { headers, credentials: 'include' }),
      ]);
      if (pr.ok) {
        const d = await pr.json();
        setProjects(Array.isArray(d) ? d : d.projects || []);
      }
      if (ir.ok) {
        const d = await ir.json();
        setInvoices(Array.isArray(d) ? d : d.invoices || []);
      }
      if (rr.ok) {
        const d = await rr.json();
        setRevisions(Array.isArray(d) ? d : d.revisions || []);
      }
    } catch (err) {
      console.error('Portal fetch failed', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'client') {
      void fetchData();
      const key = `vf_welcome_${user.id}`;
      if (!sessionStorage.getItem(key)) {
        setWelcomeOpen(true);
        sessionStorage.setItem(key, '1');
      }
    }
  }, [user?.id, user?.role, token]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== 'delivered'),
    [projects],
  );

  const nextDeadline = useMemo(() => {
    const withDates = activeProjects
      .filter((p) => p.deliveryDate)
      .map((p) => ({ ...p, left: daysLeft(p.deliveryDate) }))
      .sort((a, b) => (a.left ?? 999) - (b.left ?? 999));
    return withDates[0] || null;
  }, [activeProjects]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginBusy(true);
    try {
      const r = await login(loginEmail.trim().toLowerCase(), loginPassword);
      if (!r.success) setLoginError(r.error || 'Login failed');
      else if (r.user && r.user.role !== 'client') {
        setLoginError('This account is not a client portal login. Use /admin for studio staff.');
        await logout();
      }
    } finally {
      setLoginBusy(false);
    }
  };

  const postRevision = async (projectId: string, comment: string) => {
    if (!token || !projectId || !comment.trim()) return false;
    const res = await fetch('/api/revisions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ projectId, comment: comment.trim() }),
    });
    return res.ok;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050507] px-4 py-16">
        <div className="mx-auto max-w-6xl space-y-6">
          <SkeletonCard />
          <SkeletonGrid count={3} />
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'client') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#050507] px-6 py-16 text-[#EDEDED]">
        <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-[#D4AF37]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="relative mx-auto max-w-md">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Client portal</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Your private studio workspace</h1>
          <p className="mt-2 text-sm text-[#8A857C]">
            Track projects, deadlines, invoices, message the studio, and rate deliveries.
          </p>
          <form
            onSubmit={handleLogin}
            className="relative mt-8 space-y-3 rounded-2xl border border-white/10 bg-[#0C0C10]/95 p-6 shadow-2xl backdrop-blur-xl"
            style={{ transform: 'perspective(900px) rotateX(1.2deg)' }}
          >
            {loginError ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            ) : null}
            <input
              type="email"
              required
              autoComplete="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Email"
              className={I}
            />
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className={I + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white"
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loginBusy}
              className="w-full rounded-full bg-[#D4AF37] py-3 text-xs font-black uppercase tracking-wider text-black disabled:opacity-60"
            >
              {loginBusy ? 'Signing in…' : 'Enter portal'}
            </button>
          </form>
          <a href="/" className="mt-4 block text-center text-sm text-[#D4AF37] hover:underline">
            ← Studio home
          </a>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'projects', label: 'My work', icon: <FolderKanban className="h-4 w-4" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-[#EDEDED]">
      {welcomeOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-[#0C0C10] p-6 shadow-2xl">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#D4AF37]/20 blur-2xl" />
            <button type="button" onClick={() => setWelcomeOpen(false)} className="absolute right-4 top-4 text-[#888] hover:text-white" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Sparkles className="h-5 w-5" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Welcome back</p>
            </div>
            <h2 className="mt-3 text-2xl font-black">Hello, {user.name.split(' ')[0]}</h2>
            <p className="mt-2 text-sm text-[#B8B3AA]">
              {activeProjects.length
                ? `You have ${activeProjects.length} active project${activeProjects.length > 1 ? 's' : ''} with VisionFold.`
                : 'No active edits right now — message us anytime or explore services on the studio site.'}
            </p>
            {nextDeadline ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-2 text-sm">
                <CalendarDays className="h-4 w-4 text-[#D4AF37]" />
                <span>
                  Next deadline: <strong className="text-white">{nextDeadline.title}</strong>
                  {nextDeadline.left != null ? (
                    <span className="text-[#D4AF37]"> · {nextDeadline.left < 0 ? 'past due' : `${nextDeadline.left}d left`}</span>
                  ) : null}
                </span>
              </div>
            ) : null}
            <ul className="mt-4 space-y-2">
              {activeProjects.slice(0, 3).map((p) => (
                <li key={p.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <span className="font-semibold text-white">{p.title}</span>
                  <span className="ml-2 text-[#D4AF37]">{statusLabel(p.status)}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setWelcomeOpen(false);
                setActiveTab('projects');
              }}
              className="mt-5 w-full rounded-full bg-[#D4AF37] py-3 text-xs font-black uppercase tracking-wider text-black"
            >
              Continue to workspace
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-[110] -translate-x-1/2 rounded-full border border-[#D4AF37]/40 bg-[#0C0C10] px-4 py-2 text-xs text-[#D4AF37] shadow-lg">
          {toast}
        </div>
      ) : null}

      <header className="border-b border-white/10 bg-[#0A0A0B]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37]">Client workspace</p>
            <h1 className="text-lg font-bold text-white">{user.name}</h1>
            <p className="text-xs text-[#8A857C]">{user.company || user.email}</p>
          </div>
          <a href="/" className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B8B3AA] hover:border-[#D4AF37]/40 hover:text-[#D4AF37]">
            Studio site
          </a>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                activeTab === t.id ? 'bg-[#D4AF37] text-black' : 'text-[#8A857C] hover:text-white'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {dataLoading && activeTab === 'dashboard' ? (
          <div className="space-y-4">
            <SkeletonGrid count={3} />
            <SkeletonCard />
          </div>
        ) : null}

        {activeTab === 'dashboard' && !dataLoading && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className={C}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#888]">Active work</p>
                <p className="mt-2 text-3xl font-black text-white">{activeProjects.length}</p>
              </div>
              <div className={C}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#888]">Delivered</p>
                <p className="mt-2 text-3xl font-black text-white">{projects.filter((p) => p.status === 'delivered').length}</p>
              </div>
              <div className={C}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#888]">Open invoices</p>
                <p className="mt-2 text-3xl font-black text-white">{invoices.filter((i) => i.status !== 'paid').length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 to-transparent p-6">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Clock className="h-4 w-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">Editors at work</p>
              </div>
              <p className="mt-2 text-sm text-[#B8B3AA]">
                Our team is crafting your cuts with retention-first pacing. Deadlines update as status changes.
              </p>
              {nextDeadline ? (
                <p className="mt-3 text-sm font-semibold text-white">
                  Next up: {nextDeadline.title}
                  {nextDeadline.left != null ? (
                    <span className="ml-2 text-[#D4AF37]">{nextDeadline.left < 0 ? 'Past deadline' : `${nextDeadline.left} days left`}</span>
                  ) : null}
                </p>
              ) : null}
            </div>

            {projects.length === 0 ? (
              <p className="text-sm text-[#8A857C]">No projects assigned yet. Once admin creates work for you, it appears here.</p>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 6).map((p) => {
                  const pct = progressFor(p.status);
                  const left = daysLeft(p.deliveryDate);
                  return (
                    <div key={p.id} className={C}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-white">{p.title}</h3>
                          <p className="text-xs text-[#8A857C]">{p.category} · {statusLabel(p.status)}</p>
                        </div>
                        {p.deliveryDate ? (
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              left !== null && left < 0 ? 'bg-red-500/20 text-red-300' : 'bg-[#D4AF37]/15 text-[#D4AF37]'
                            }`}
                          >
                            {left !== null && left < 0 ? 'Past deadline' : left !== null ? `${left}d to deadline` : 'Deadline set'}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#f0d78c] transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-[#8A857C]">{pct}% complete · {statusLabel(p.status)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black">Work you gave us</h2>
            {projects.length === 0 ? (
              <p className="text-sm text-[#8A857C]">Nothing assigned yet.</p>
            ) : (
              projects.map((p) => {
                const amount = p.amountINR ?? p.amountInr ?? 0;
                const pct = progressFor(p.status);
                return (
                  <div key={p.id} className={C}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-white">{p.title}</h3>
                      <span className="text-sm font-semibold text-[#D4AF37]">₹{amount.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="mt-1 text-sm text-[#B8B3AA]">{p.description?.replace(/\[studio_cost_inr=[^\]]+\]/g, '').replace(/\[profit_inr=[^\]]+\]/g, '').trim() || p.category}</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[#D4AF37] transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#8A857C]">
                      <span className="flex items-center gap-1">
                        {p.status === 'delivered' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Loader2 className="h-3.5 w-3.5 text-[#D4AF37]" />}
                        {statusLabel(p.status)}
                      </span>
                      {p.deliveryDate ? <span>Deadline {new Date(p.deliveryDate).toLocaleDateString()}</span> : null}
                    </div>
                    {p.status === 'delivered' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRatingProjectId(p.id);
                          setActiveTab('messages');
                        }}
                        className="mt-4 inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]"
                      >
                        <Star className="h-3.5 w-3.5" /> Rate this delivery
                      </button>
                    ) : null}
                  </div>
                );
              })
            )}
            <div className={C}>
              <h3 className="font-bold text-white">Invoices</h3>
              {invoices.length === 0 ? (
                <p className="mt-2 text-sm text-[#8A857C]">No invoices yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-white/5">
                  {invoices.map((inv) => (
                    <li key={inv.id} className="flex justify-between py-3 text-sm">
                      <span>{inv.invoiceNumber} · {inv.description}</span>
                      <span className="text-[#D4AF37]">
                        ₹{(inv.amountINR ?? inv.amountInr ?? 0).toLocaleString('en-IN')} · {inv.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className={C}>
              <h2 className="text-lg font-bold text-white">Message the studio</h2>
              <p className="mt-1 text-sm text-[#8A857C]">Ask for improvements, share feedback, or check status. Admin sees this under revisions.</p>
              <select value={msgProjectId} onChange={(e) => setMsgProjectId(e.target.value)} className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm">
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <textarea
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                rows={4}
                placeholder="What should we improve or clarify?"
                className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={msgSending}
                onClick={async () => {
                  setMsgSending(true);
                  const pid = msgProjectId || projects[0]?.id;
                  const ok = pid ? await postRevision(pid, msgText) : false;
                  setToast(ok ? 'Message sent to the studio.' : 'Could not send — pick a project and write a message.');
                  if (ok) {
                    setMsgText('');
                    await fetchData();
                  }
                  setMsgSending(false);
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50"
              >
                {msgSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send to studio
              </button>
            </div>

            <div className={C}>
              <h3 className="font-bold text-white">Rate a delivery</h3>
              <p className="mt-1 text-xs text-[#8A857C]">Ratings go to the studio and can appear as social proof on the public site.</p>
              <select value={ratingProjectId} onChange={(e) => setRatingProjectId(e.target.value)} className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm">
                <option value="">Choose delivered project…</option>
                {projects.filter((p) => p.status === 'delivered').map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} className={`rounded-lg p-2 ${rating >= n ? 'text-[#D4AF37]' : 'text-[#444]'}`}>
                    <Star className="h-5 w-5 fill-current" />
                  </button>
                ))}
              </div>
              <input value={ratingNote} onChange={(e) => setRatingNote(e.target.value)} placeholder="Short review (optional)" className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm" />
              <button
                type="button"
                disabled={!ratingProjectId || msgSending}
                onClick={async () => {
                  setMsgSending(true);
                  const ok = await postRevision(ratingProjectId, `Client rating: ${rating}/5 — ${ratingNote.trim() || 'Great work'}`);
                  setToast(ok ? 'Thanks! Rating shared with the studio.' : 'Could not submit rating.');
                  if (ok) {
                    setRatingNote('');
                    await fetchData();
                  }
                  setMsgSending(false);
                }}
                className="mt-3 rounded-full border border-[#D4AF37]/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37] disabled:opacity-40"
              >
                Submit rating
              </button>
            </div>

            <div className={C}>
              <h3 className="font-bold text-white">Thread history</h3>
              {revisions.length === 0 ? (
                <p className="mt-2 text-sm text-[#8A857C]">No messages yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {revisions.map((r) => (
                    <li key={r.id} className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm">
                      <p className="text-[#EDEDED]">{r.comment}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-[#8A857C]">
                        {r.status} · {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="mx-auto max-w-lg space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0C0C10] p-6">
              <h2 className="text-lg font-bold text-white">Profile</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-[#8A857C]">Name</dt><dd className="font-medium">{user.name}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[#8A857C]">Email</dt><dd className="font-medium">{user.email}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[#8A857C]">Company</dt><dd className="font-medium">{user.company || '—'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-[#8A857C]">Phone</dt><dd className="font-medium">{user.phone || '—'}</dd></div>
              </dl>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0C0C10] p-6">
              <h3 className="font-bold text-white">Session</h3>
              <p className="mt-1 text-sm text-[#8A857C]">You stay signed in until you sign out here.</p>
              <button
                type="button"
                onClick={() => void logout()}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-500/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-300"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
            <a href="/" className="block text-center text-sm text-[#D4AF37] hover:underline">← Back to public site</a>
          </div>
        )}
      </main>
    </div>
  );
}

export default ClientWorkspace;
