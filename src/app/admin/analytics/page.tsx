"use client";

import { Card, PageSkeleton, useApi } from "@/components/AdminUI";
import { Bars } from "@/components/Charts";
import { Eye, Users, MousePointerClick } from "lucide-react";

type Analytics = {
  daily: { day: string; views: number; visitors: number }[];
  topPages: { path: string; views: number }[];
  uniques30d: number;
  liveNow: number;
};

export default function AdminAnalyticsPage() {
  const { data, loading } = useApi<Analytics>("/api/admin/analytics");

  if (loading) return <PageSkeleton />;

  const chartData = (data?.daily ?? []).map((d) => ({
    label: d.day.slice(5),
    value: d.views,
  }));
  const totalViews = (data?.daily ?? []).reduce((s, d) => s + d.views, 0);
  const maxPage = Math.max(1, ...(data?.topPages ?? []).map((p) => p.views));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Traffic analytics</h1>
        <p className="text-sm text-slate-500">Who&apos;s visiting the site, from where, and what they look at</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Live now</p>
          <p className="font-display mt-1 flex items-center gap-2 text-2xl font-bold text-emerald-300">
            {data?.liveNow ?? 0} <Eye size={18} />
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-slate-500">Unique visitors · 30d</p>
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
      </div>

      <Card title="Views — last 30 days" desc="Daily page views across the whole site">
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

      <Card title="Top pages" desc="Most-viewed paths of all time">
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
    </div>
  );
}
