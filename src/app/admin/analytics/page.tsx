"use client";

import { Card, PageSkeleton, useApi } from "@/components/AdminUI";
import { Bars } from "@/components/Charts";
import { Eye, Users, MousePointerClick, Timer, Percent } from "lucide-react";

type Analytics = {
  daily: { day: string; views: number; visitors: number }[];
  topPages: { path: string; views: number }[];
  referrers: { source: string; visitors: number }[];
  campaigns: { campaign: string; visitors: number }[];
  history: { path: string; title: string; createdAt: string | null; visitor: string }[];
  live: { path: string; lastSeen: string | null; pageViews: number; durationMs: number }[];
  uniques30d: number;
  views30d: number;
  liveNow: number;
  todayVisitors: number;
  todayViews: number;
  bounceRate: number;
  avgDurationMs: number;
};

function fmtDuration(ms: number) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function AdminAnalyticsPage() {
  const { data, loading } = useApi<Analytics>("/api/admin/analytics");

  if (loading) return <PageSkeleton />;

  const chartData = (data?.daily ?? []).map((d) => ({
    label: d.day.slice(5),
    value: d.views,
  }));
  const totalViews = data?.views30d ?? (data?.daily ?? []).reduce((s, d) => s + d.views, 0);
  const maxPage = Math.max(1, ...(data?.topPages ?? []).map((p) => p.views));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Traffic analytics</h1>
        <p className="text-sm text-slate-500">Real page views and sessions — bots, admin and portal traffic are excluded.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Live now</p>
          <p className="font-display mt-1 flex items-center gap-2 text-2xl font-bold text-emerald-300">
            {data?.liveNow ?? 0} <Eye size={18} />
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Unique · 30d</p>
          <p className="font-display mt-1 flex items-center gap-2 text-2xl font-bold text-white">
            {(data?.uniques30d ?? 0).toLocaleString()} <Users size={18} className="text-slate-600" />
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Page views · 30d</p>
          <p className="font-display mt-1 flex items-center gap-2 text-2xl font-bold text-brand-300">
            {totalViews.toLocaleString()} <MousePointerClick size={18} className="text-slate-600" />
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Bounce rate</p>
          <p className="font-display mt-1 flex items-center gap-2 text-2xl font-bold text-amber-300">
            {data?.bounceRate ?? 0}% <Percent size={18} />
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Avg session</p>
          <p className="font-display mt-1 flex items-center gap-2 text-2xl font-bold text-white">
            {fmtDuration(data?.avgDurationMs ?? 0)} <Timer size={18} className="text-slate-600" />
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Today" desc="Since midnight, studio timezone of the server">
          <p className="font-display text-3xl font-bold text-white">{data?.todayVisitors ?? 0} <span className="text-base font-medium text-slate-500">people</span></p>
          <p className="mt-1 text-sm text-slate-400">{data?.todayViews ?? 0} page views</p>
        </Card>
        <Card title="Live paths" desc="Who is on the site right now">
          {!data?.live?.length ? (
            <p className="text-sm text-slate-500">Nobody live in the last 2 minutes.</p>
          ) : (
            <ul className="space-y-1.5 font-mono text-xs text-slate-300">
              {data.live.map((v, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate">{v.path}</span>
                  <span className="text-slate-600">{v.pageViews}p</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Views — last 30 days" desc="Counted from page_events, not heartbeats">
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No traffic recorded yet — it starts flowing as soon as people visit.
          </p>
        ) : (
          <>
            <Bars data={chartData} />
            <div className="mt-3 grid grid-cols-6 gap-2 text-center text-[10px] text-slate-500 sm:grid-cols-10">
              {chartData.map((d) => (
                <span key={d.label}>{d.label}</span>
              ))}
            </div>
          </>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Top pages" desc="Most-viewed paths">
          {!data?.topPages?.length ? (
            <p className="py-6 text-center text-sm text-slate-500">No page data yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.topPages.map((page) => (
                <li key={page.path} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate font-mono text-xs text-slate-300">{page.path}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400"
                      style={{ width: `${Math.max(4, Math.round((page.views / maxPage) * 100))}%` }}
                    />
                  </span>
                  <span className="w-14 text-right font-semibold text-white">{page.views.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Referrers" desc="Where people arrived from">
          {!data?.referrers?.length ? (
            <p className="py-6 text-center text-sm text-slate-500">No referrers yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.referrers.map((r) => (
                <li key={r.source} className="flex justify-between gap-3">
                  <span className="truncate text-slate-300">{r.source}</span>
                  <span className="font-semibold text-white">{r.visitors}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Visit history" desc="Latest real page views">
        {!data?.history?.length ? (
          <p className="text-sm text-slate-500">History appears as people move through the site.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {data.history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-white/6 px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-mono text-slate-200">{h.path}</span>
                  <span className="block truncate text-slate-600">{h.title || h.visitor}</span>
                </span>
                <span className="shrink-0 text-slate-500">{h.createdAt ? new Date(h.createdAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }) : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
