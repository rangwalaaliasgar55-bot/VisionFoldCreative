"use client";

import { useMemo, useState } from "react";
import { Card, PageSkeleton, cx, useApi } from "@/components/AdminUI";
import { timeAgo } from "@/lib/utils";
import { History, Search } from "lucide-react";

type Entry = { id: number; actor: string; action: string; details: string; createdAt: string };

/** Colour by verb, so scanning a long list is possible at a glance. */
function tone(action: string) {
  const a = action.toLowerCase();
  if (/delete|remove|revoke/.test(a)) return "text-red-300 bg-red-500/10 border-red-400/20";
  if (/create|add|publish|new/.test(a)) return "text-emerald-300 bg-emerald-500/10 border-emerald-400/20";
  if (/update|edit|change|patch/.test(a)) return "text-amber-200 bg-amber-400/10 border-amber-400/20";
  if (/login|logout|auth/.test(a)) return "text-brand-200 bg-brand-500/10 border-brand-400/20";
  return "text-slate-300 bg-white/5 border-white/10";
}

export default function ActivityPage() {
  const { data, loading } = useApi<Entry[]>("/api/admin/activity");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) =>
      `${row.actor} ${row.action} ${row.details}`.toLowerCase().includes(q)
    );
  }, [data, query]);

  if (loading && !data) return <PageSkeleton cards={1} rows={8} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Activity</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Every action taken in the studio workspace — who did what, and when. The most recent
            fifty entries.
          </p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by person or action…"
            className="field w-full pl-8 sm:w-72"
          />
        </div>
      </header>

      {rows.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <History size={26} className="text-slate-500" />
            <p className="text-sm text-slate-400">
              {query ? `Nothing matches “${query}”.` : "No activity recorded yet."}
            </p>
          </div>
        </Card>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3"
            >
              <span
                className={cx(
                  "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  tone(row.action)
                )}
              >
                {row.action}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-slate-300">
                {row.details || "—"}
              </span>
              <span className="text-[11px] font-medium text-slate-400">{row.actor}</span>
              <span className="text-[11px] text-slate-600">{timeAgo(row.createdAt)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
