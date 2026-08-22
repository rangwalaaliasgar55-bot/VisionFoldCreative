"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, Button, Card, PageSkeleton, toast, useApi } from "@/components/AdminUI";
import { Bars, Funnel } from "@/components/Charts";
import { fmtDate, fmtMoney, timeAgo } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CreditCard,
  DollarSign,
  FolderKanban,
  MessageSquare,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

type Dashboard = {
  viewer: { name: string; role: "admin" | "editor" | "accountant" };
  stats: Record<string, number>;
  kpis?: {
    winRate: number;
    cycleTimeDays: number;
    avgDealInr: number;
    leadsThisWeek: number;
    workload: { open: number; review: number; dueSoon: number; overdue: number; avgProgress: number; capacityUsed: number };
    health: { clientId: number; name: string; score: number; label: string; reasons: string[] }[];
    liveNow: number;
    live: { path: string; lastSeen: string; pageViews: number; durationMs: number }[];
  };
  revenueByMonth: { label: string; value: number }[];
  expensesByCategory: { label: string; value: number }[];
  funnel: { label: string; value: number }[];
  projectsByStatus: { label: string; value: number }[];
  upcoming: any[];
  recentActivity: any[];
  recentMessages: any[];
  automations: any[];
};

export default function AdminDashboardPage() {
  const { data, loading, reload } = useApi<Dashboard>("/api/admin/dashboard");
  const { data: socialData } = useApi<{ posts: { metrics: { views: number } | null }[] }>(
    data?.viewer.role === "admin" ? "/api/admin/social" : null
  );
  const [insights, setInsights] = useState<{ source: string; items: string[] } | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!data || data.viewer.role === "accountant") return;
    api<{ source: string; items: string[] }>("/api/ai/insights", { json: {} })
      .then(setInsights)
      .catch(() => {});
  }, [data]);

  const runAutomations = useCallback(async () => {
    setRunning(true);
    try {
      const res = await api<{ ran: { name: string; effects: number }[] }>("/api/admin/automations/run", { json: {} });
      if (res.ran.length === 0) toast("Automations checked — nothing due right now");
      else toast(`Automations executed: ${res.ran.map((r) => r.name).join(", ")}`);
      reload();
    } catch {
      toast("Failed to run automations", "err");
    } finally {
      setRunning(false);
    }
  }, [reload]);

  if (loading || !data) return <PageSkeleton />;
  const s = data.stats;

  const kpis = [
    { label: "Total revenue", value: fmtMoney(s.revenue), Icon: DollarSign, accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-300", roles: ["admin", "accountant"] },
    { label: "Outstanding", value: fmtMoney(s.outstanding), Icon: CreditCard, accent: "from-amber-500/20 to-amber-500/5 text-amber-300", roles: ["admin", "accountant"] },
    { label: "Active projects", value: String(s.activeProjects), Icon: FolderKanban, accent: "from-brand-500/20 to-brand-500/5 text-brand-300", roles: ["admin", "editor", "accountant"] },
    { label: "New leads · 30d", value: String(s.newLeads30d), Icon: Target, accent: "from-cyan-500/20 to-cyan-500/5 text-cyan-300", roles: ["admin", "editor"] },
    { label: "Clients", value: String(s.clients), Icon: Users, accent: "from-pink-500/20 to-pink-500/5 text-pink-300", roles: ["admin", "editor", "accountant"] },
    { label: "Avg rating", value: `${s.avgRating}★`, Icon: Star, accent: "from-violet-500/20 to-violet-500/5 text-violet-300", roles: ["admin", "editor"] },
  ].filter((item) => item.roles.includes(data.viewer.role));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{data.viewer.role === "admin" ? "Owner dashboard" : data.viewer.role === "editor" ? "Editorial workspace" : "Finance dashboard"}</h1>
          <p className="text-sm text-slate-500">Welcome, {data.viewer.name} · {fmtDate(new Date())}</p>
        </div>
        <div className="flex gap-2">
          {data.viewer.role !== "accountant" && <Button variant="outline" onClick={runAutomations} disabled={running}>
            <Zap size={14} className="text-amber-300" /> {running ? "Running…" : "Run automations"}
          </Button>}
          {data.viewer.role !== "accountant" ? <Link href="/admin/leads"><Button><Target size={14} /> New lead</Button></Link> : <Link href="/admin/invoices"><Button><CreditCard size={14} /> New invoice</Button></Link>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ label, value, Icon, accent }) => (
          <div key={label} className="glass card-glow rounded-2xl p-4">
            <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${accent}`}>
              <Icon size={16} />
            </div>
            <p className="font-display truncate text-xl font-bold text-white">{value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {data.kpis && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Win rate</p>
            <p className="font-display mt-1 text-2xl font-bold text-white">{data.kpis.winRate}%</p>
            <p className="text-[11px] text-slate-600">{s.leadsThisWeek || data.kpis.leadsThisWeek} leads this week</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Avg deal</p>
            <p className="font-display mt-1 text-2xl font-bold text-emerald-300">{fmtMoney(data.kpis.avgDealInr)}</p>
            <p className="text-[11px] text-slate-600">INR · paid invoices</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Cycle time</p>
            <p className="font-display mt-1 text-2xl font-bold text-white">{data.kpis.cycleTimeDays}d</p>
            <p className="text-[11px] text-slate-600">create → completed</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Capacity</p>
            <p className="font-display mt-1 text-2xl font-bold text-amber-300">{data.kpis.workload.capacityUsed}%</p>
            <p className="text-[11px] text-slate-600">{data.kpis.workload.open} open · {data.kpis.workload.review} in review</p>
          </div>
        </div>
      )}

      {data.kpis?.health?.length ? (
        <Card title="Client health" desc="Scored from overdue invoices, stalled work, unread messages and reviews">
          <ul className="space-y-2">
            {data.kpis.health.map((h) => (
              <li key={h.clientId} className="flex items-center gap-3 rounded-xl border border-white/8 px-3 py-2 text-sm">
                <span className={`w-12 font-display text-lg font-bold ${h.score >= 75 ? "text-emerald-300" : h.score >= 50 ? "text-amber-300" : "text-red-300"}`}>{h.score}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-white">{h.name}</span>
                  <span className="block truncate text-[11px] text-slate-500">{h.reasons[0]}</span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500">{h.label.replace("_", " ")}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {data.kpis?.live?.length ? (
        <Card title="Live on the site" desc={`${data.kpis.liveNow} visitor${data.kpis.liveNow === 1 ? "" : "s"} in the last 2 minutes`}>
          <ul className="space-y-1.5 text-sm">
            {data.kpis.live.map((v, i) => (
              <li key={i} className="flex items-center justify-between gap-3 font-mono text-xs text-slate-300">
                <span className="truncate">{v.path}</span>
                <span className="text-slate-600">{v.pageViews} views</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card
        title="Action center"
        desc="The highest-priority studio work, collected in one place"
        actions={<span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-slate-500">Live queue</span>}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { label: "Client messages", value: s.unreadMessages || 0, detail: "waiting for a studio reply", href: "/admin/clients", Icon: MessageSquare, tone: "text-cyan-300 bg-cyan-500/10", roles: ["admin", "editor", "accountant"] },
            { label: "Cuts needing attention", value: s.reviewProjects || 0, detail: "in review or revision", href: "/admin/projects", Icon: FolderKanban, tone: "text-brand-300 bg-brand-500/10", roles: ["admin", "editor"] },
            { label: "Overdue invoices", value: s.overdueInvoices || 0, detail: "require payment follow-up", href: "/admin/invoices", Icon: AlertTriangle, tone: "text-amber-300 bg-amber-500/10", roles: ["admin", "accountant"] },
          ].filter((item) => item.roles.includes(data.viewer.role)).map(({ label, value, detail, href, Icon, tone }) => (
            <Link key={label} href={href} className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-3 transition hover:border-white/15 hover:bg-white/[0.025]">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={17} /></span>
              <span className="min-w-0 flex-1"><span className="flex items-baseline gap-2"><strong className="font-display text-xl text-white">{value}</strong><span className="text-xs font-semibold text-slate-300">{label}</span></span><span className="block truncate text-[10px] text-slate-600">{detail}</span></span>
              <ArrowUpRight size={14} className="text-slate-700 transition group-hover:text-slate-300" />
            </Link>
          ))}
        </div>
      </Card>

      {data.viewer.role === "admin" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {(() => {
            const published = (socialData?.posts ?? []).filter((p) => p.metrics);
            const totalViews = published.reduce((sum, p) => sum + (p.metrics?.views ?? 0), 0);
            return [
              {
                label: "Social reach",
                value: totalViews.toLocaleString(),
                detail: `${published.length} published post${published.length === 1 ? "" : "s"} across platforms`,
                href: "/admin/social",
                Icon: TrendingUp,
                tone: "text-emerald-300 bg-emerald-500/10",
              },
              {
                label: "Automations",
                value: "Live",
                detail: "Lead acks, reminders, digests run daily",
                href: "/admin/automations",
                Icon: Zap,
                tone: "text-amber-300 bg-amber-500/10",
              },
              {
                label: "Backup & export",
                value: "Ready",
                detail: "One-click JSON backup of all studio data",
                href: "/admin/site",
                Icon: Sparkles,
                tone: "text-brand-300 bg-brand-500/10",
              },
            ];
          })().map(({ label, value, detail, href, Icon, tone }) => (
            <Link key={label} href={href} className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-3 transition hover:border-white/15 hover:bg-white/[0.025]">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={17} /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2"><strong className="font-display text-lg text-white">{value}</strong><span className="text-xs font-semibold text-slate-300">{label}</span></span>
                <span className="block truncate text-[10px] text-slate-600">{detail}</span>
              </span>
              <ArrowUpRight size={14} className="text-slate-700 transition group-hover:text-slate-300" />
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {data.viewer.role !== "editor" && <Card title="Revenue — last 6 months" desc="Paid invoices" className="lg:col-span-2">
          <Bars data={data.revenueByMonth} money />
          <div className="mt-3 grid grid-cols-6 gap-2 text-center text-[10px] text-slate-500">
            {data.revenueByMonth.map((m) => (
              <span key={m.label}>{m.label}</span>
            ))}
          </div>
        </Card>}

        {data.viewer.role !== "accountant" && <Card title="AI Insights" desc="Operations brain" className="lg:row-span-2">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-brand-300" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {insights ? `${insights.source} engine` : "Loading…"}
            </span>
          </div>
          {insights ? (
            <ul className="mt-4 space-y-3">
              {insights.items.map((item, i) => (
                <li key={i} className="flex gap-2.5 rounded-xl border border-white/8 bg-white/2 p-3 text-sm leading-relaxed text-slate-300">
                  <Sparkles size={14} className="mt-0.5 shrink-0 text-cyan-300" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="shimmer h-12 rounded-xl bg-white/5" />
              ))}
            </div>
          )}
          <div className="mt-5 border-t border-white/8 pt-4">
            <p className="text-xs text-slate-500">
              Without a <code>GEMINI_API_KEY</code>, insights come from a rules engine — never fake AI text.
            </p>
          </div>
        </Card>}

        {data.viewer.role !== "accountant" && <Card title="Lead pipeline" desc="All time">
          <Funnel data={data.funnel} />
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/8 pt-4">
            <div>
              <p className="text-[11px] text-slate-500">Conversion (won / total)</p>
              <p className="mt-1 font-display text-lg font-bold text-white">
                {s.leadsTotal ? Math.round((s.leadsWon / s.leadsTotal) * 100) : 0}%
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Won this month</p>
              <p className="mt-1 font-display text-lg font-bold text-white">{s.leadsWon ?? 0}</p>
            </div>
          </div>
        </Card>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent activity" desc="System + team events">
          <ul className="space-y-3">
            {(data.recentActivity || []).slice(0, 8).map((a: any) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <div className="min-w-0">
                  <p className="text-slate-300">{a.action}</p>
                  <p className="text-xs text-slate-600">{timeAgo(a.createdAt)} · {a.actor}</p>
                </div>
              </li>
            ))}
            {!data.recentActivity?.length && <p className="text-sm text-slate-500">No activity yet</p>}
          </ul>
        </Card>

        <Card title="Upcoming deadlines" desc="Projects due soon">
          <ul className="space-y-3">
            {(data.upcoming || []).slice(0, 6).map((p: any) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.status?.replace(/_/g, " ")}</p>
                </div>
                <span className="shrink-0 text-xs text-amber-300">{p.dueDate || "—"}</span>
              </li>
            ))}
            {!data.upcoming?.length && <p className="text-sm text-slate-500">No upcoming deadlines</p>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
