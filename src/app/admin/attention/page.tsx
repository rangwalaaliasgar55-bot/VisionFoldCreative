"use client";

import { useState } from "react";
import Link from "next/link";
import { api, Button, Card, PageSkeleton, cx, toast, useApi } from "@/components/AdminUI";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock, PlayCircle } from "lucide-react";

type Item = {
  key: string;
  kind: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  href: string;
  ageDays: number;
};

const TONE: Record<Item["severity"], string> = {
  high: "border-red-400/25 bg-red-500/[0.07]",
  medium: "border-amber-400/25 bg-amber-400/[0.06]",
  low: "border-white/8 bg-white/[0.02]",
};

const DOT: Record<Item["severity"], string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-slate-500",
};

const LABEL: Record<string, string> = {
  lead_sla: "Lead waiting",
  invoice_overdue: "Money",
  invoice_due_soon: "Money",
  approval_stale: "Client silent",
  project_stale: "Stalled",
  project_due: "Deadline",
};

export default function AttentionPage() {
  const { data, loading, reload } = useApi<{ items: Item[]; counts: Record<string, number> }>(
    "/api/admin/attention"
  );
  const [running, setRunning] = useState(false);

  const items = data?.items ?? [];
  const counts = data?.counts ?? { high: 0, medium: 0, low: 0 };

  const runNow = async () => {
    setRunning(true);
    try {
      const res = await api<{ applied: Record<string, number>; flagged: number }>(
        "/api/admin/attention/run",
        { method: "POST" }
      );
      const total = Object.values(res.applied || {}).reduce((a, b) => a + b, 0);
      toast(
        total ? `Automations ran ΓÇö ${total} action${total === 1 ? "" : "s"} applied` : "Nothing needed chasing"
      );
      reload();
    } catch (error) {
      toast((error as Error).message || "Could not run automations", "err");
    } finally {
      setRunning(false);
    }
  };

  if (loading && !data) return <PageSkeleton cards={3} rows={4} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Needs you</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Everything across leads, projects and invoices that has gone quiet, run late or is
            waiting on someone. Refreshed hourly by the scheduler ΓÇö clients are nudged
            automatically, at most once every seventy two hours.
          </p>
        </div>
        <Button onClick={runNow} disabled={running}>
          <PlayCircle size={14} />
          {running ? "RunningΓÇª" : "Run now"}
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Urgent", value: counts.high, tone: "text-red-400", Icon: AlertTriangle },
          { label: "Worth a look", value: counts.medium, tone: "text-amber-300", Icon: Clock },
          { label: "Background", value: counts.low, tone: "text-slate-400", Icon: CheckCircle2 },
        ].map(({ label, value, tone, Icon }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {label}
                </p>
                <p className={cx("font-display mt-1 text-3xl font-bold", tone)}>{value ?? 0}</p>
              </div>
              <Icon size={20} className={tone} />
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <CheckCircle2 size={28} className="text-emerald-400" />
            <p className="font-display text-lg font-semibold text-white">
              Nothing is waiting on you
            </p>
            <p className="max-w-sm text-xs text-slate-500">
              No unanswered leads, no overdue invoices, no cuts sitting unapproved. This page fills
              itself in when something slips.
            </p>
          </div>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cx(
                  "group flex items-start gap-3 rounded-2xl border p-4 transition-colors hover:border-brand-400/40",
                  TONE[item.severity]
                )}
              >
                <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT[item.severity])} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{item.title}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {LABEL[item.kind] || item.kind}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">{item.detail}</span>
                </span>
                <ArrowUpRight
                  size={15}
                  className="mt-1 shrink-0 text-slate-600 transition-colors group-hover:text-brand-300"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
