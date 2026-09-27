import Link from "next/link";
import {
  AI_SUBSCRIPTIONS,
  ACTIVE_CLIENTS,
  AI_MONTHLY,
  BURN_BREAKDOWN,
  DELIVERY_LEDGER,
  DEMAND,
  EDITORS,
  HEADS,
  LONGFORM_DELIVERED,
  MONTHLY_BURN,
  PAYROLL_MONTHLY,
  SHORTS_DELIVERED,
  TEAM,
  TOOL_COSTS,
  TOOLS_MONTHLY,
  TOTAL_REVENUE,
  VIDEOS_DELIVERED,
  inr,
} from "@/lib/studioOps";
import { Crown, Bot, Film, TrendingUp, Users, Wallet, Flame, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const monthLabels = (() => {
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  return DELIVERY_LEDGER.map((m) => names[new Date(now.getFullYear(), now.getMonth() - m.monthsAgo, 1).getMonth()]);
})();

function Panel({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold text-white">{title}</h2>
        {desc ? <p className="mt-0.5 text-[12px] text-slate-500">{desc}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Meter({ value, tone = "brand" }: { value: number; tone?: "brand" | "amber" | "emerald" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const bar =
    tone === "amber"
      ? "from-amber-400 to-orange-500"
      : tone === "emerald"
        ? "from-emerald-400 to-teal-500"
        : "from-brand-500 to-cyan-400";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
      <div className={`h-full rounded-full bg-gradient-to-r ${bar}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function SubscriptionsPage() {
  const maxDelivery = Math.max(...DELIVERY_LEDGER.map((m) => m.shorts + m.longForm));
  const runwayNote = TOTAL_REVENUE / 6 - MONTHLY_BURN;

  const kpis = [
    { label: "Collected revenue · 6 mo", value: inr(TOTAL_REVENUE), sub: `${ACTIVE_CLIENTS} paying clients`, Icon: TrendingUp, accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-300" },
    { label: "Videos delivered", value: String(VIDEOS_DELIVERED), sub: `${SHORTS_DELIVERED} shorts · ${LONGFORM_DELIVERED} long-form`, Icon: Film, accent: "from-brand-500/20 to-brand-500/5 text-brand-300" },
    { label: "Monthly run cost", value: inr(MONTHLY_BURN), sub: "payroll + AI + tools + studio", Icon: Flame, accent: "from-amber-500/20 to-amber-500/5 text-amber-300" },
    { label: "Avg monthly margin", value: inr(runwayNote), sub: `${inr(TOTAL_REVENUE / 6)} avg in · ${inr(MONTHLY_BURN)} out`, Icon: Wallet, accent: "from-cyan-500/20 to-cyan-500/5 text-cyan-300" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-brand-300">
            <Wallet size={13} /> Studio economics
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Costs, crew & AI usage</h1>
          <p className="mt-1 text-sm text-slate-500">
            Everything the studio pays for every month, who uses it, and what it produced.
          </p>
        </div>
        <Link
          href="/admin/invoices"
          className="glass rounded-full px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white"
        >
          Open finance →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map(({ label, value, sub, Icon, accent }) => (
          <div key={label} className="glass card-glow rounded-2xl p-4">
            <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${accent}`}>
              <Icon size={16} />
            </div>
            <p className="font-display truncate text-xl font-bold text-white">{value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
            <p className="mt-1 text-[10px] text-slate-600">{sub}</p>
          </div>
        ))}
      </div>

      {/* Demand */}
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
              <Clock size={15} /> Demand is running past capacity
            </p>
            <p className="mt-1 text-[12px] text-slate-400">
              {DEMAND.inbound30d} enquiries in the last 30 days against {DEMAND.capacitySlots} realistic slots —{" "}
              {DEMAND.waitlisted} businesses are on the waitlist. Next free production slot:{" "}
              <span className="text-white">{DEMAND.nextFreeSlot}</span>.
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold text-amber-300">{DEMAND.bookedPercent}%</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">editor hours booked</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* AI subscriptions */}
        <Panel
          title="AI subscriptions & usage"
          desc={`${AI_SUBSCRIPTIONS.length} active plans · ${inr(AI_MONTHLY)} per month`}
        >
          <ul className="space-y-4">
            {AI_SUBSCRIPTIONS.map((sub) => {
              const pct = Math.round((sub.usage.used / sub.usage.limit) * 100);
              const fmt = (n: number) =>
                sub.usage.unit === "tokens" ? `${(n / 1_000_000).toFixed(2)}M` : n.toLocaleString("en-IN");
              return (
                <li key={sub.id} className="rounded-xl border border-white/8 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-brand-300">
                        <Bot size={15} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{sub.name}</p>
                        <p className="text-[11px] text-slate-500">{sub.plan}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-base font-bold text-white">{inr(sub.monthlyCost)}</p>
                      <p className="text-[10px] text-slate-500">renews {sub.renewsOn}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>
                        {fmt(sub.usage.used)} / {fmt(sub.usage.limit)} {sub.usage.unit}
                      </span>
                      <span className={pct >= 80 ? "text-amber-300" : "text-slate-400"}>{pct}% used</span>
                    </div>
                    <Meter value={pct} tone={pct >= 80 ? "amber" : "brand"} />
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{sub.runs.used.toLocaleString("en-IN")} {sub.runs.label}</span>
                      <span>
                        {sub.seatsUsed}/{sub.seats} seats
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{sub.purpose}</p>
                  <p className="mt-1 text-[10px] text-slate-600">Used by: {sub.usedBy.join(", ")}</p>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Team + payroll */}
        <Panel title="Crew & payroll" desc={`${TEAM.length} on the roster · ${inr(PAYROLL_MONTHLY)} per month`}>
          <ul className="space-y-3">
            {TEAM.map((m) => (
              <li key={m.email} className="rounded-xl border border-white/8 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500/25 to-amber/10 font-display font-bold text-white ring-1 ring-white/8">
                    {m.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-white">
                      {m.name}
                      {m.head ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                          <Crown size={9} /> Head
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">{m.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-base font-bold text-white">{inr(m.monthlyPay)}</p>
                    <p className="text-[10px] text-slate-500">per month</p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{m.focus}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{m.cutsDelivered} cuts delivered · 6 mo</span>
                    <span className={m.capacityPercent >= 90 ? "text-amber-300" : ""}>{m.capacityPercent}% booked</span>
                  </div>
                  <Meter value={m.capacityPercent} tone={m.capacityPercent >= 90 ? "amber" : "emerald"} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-[11px] text-slate-400">
            <span className="text-white">{HEADS.map((h) => h.name.split(" ")[0]).join(" & ")}</span> run the studio
            (creative direction, clients and P&L). <span className="text-white">{EDITORS.map((e) => e.name.split(" ")[0]).join(" & ")}</span>{" "}
            are on the timeline at {inr(EDITORS[0]?.monthlyPay || 0)} per month each.
          </p>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Burn breakdown */}
        <Panel title="Monthly run cost" desc={`${inr(MONTHLY_BURN)} total every month`}>
          <ul className="space-y-3">
            {BURN_BREAKDOWN.map((row) => {
              const pct = Math.round((row.value / MONTHLY_BURN) * 100);
              return (
                <li key={row.label}>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-slate-300">{row.label}</span>
                    <span className="text-white">
                      {inr(row.value)} <span className="text-slate-600">· {pct}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Meter value={pct} />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 space-y-2 border-t border-white/8 pt-4 text-[12px]">
            {TOOL_COSTS.map((t) => (
              <div key={t.name} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-slate-300">{t.name}</span>
                  <span className="block truncate text-[10px] text-slate-600">{t.note}</span>
                </span>
                <span className="shrink-0 text-white">{inr(t.monthlyCost)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-white/8 pt-2 text-slate-400">
              <span>Tools & studio subtotal</span>
              <span className="text-white">{inr(TOOLS_MONTHLY)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>AI subscriptions subtotal</span>
              <span className="text-white">{inr(AI_MONTHLY)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Payroll subtotal</span>
              <span className="text-white">{inr(PAYROLL_MONTHLY)}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-white/[0.04] px-3 py-2 font-semibold text-white">
              <span>Total monthly</span>
              <span>{inr(MONTHLY_BURN)}</span>
            </div>
          </div>
        </Panel>

        {/* Delivery ledger */}
        <Panel
          title="Delivery ledger"
          desc={`${VIDEOS_DELIVERED} videos in 6 months — ${SHORTS_DELIVERED} shorts and ${LONGFORM_DELIVERED} long-form`}
        >
          <div className="flex h-44 items-end gap-3">
            {DELIVERY_LEDGER.map((m, i) => {
              const total = m.shorts + m.longForm;
              const h = Math.round((total / maxDelivery) * 100);
              return (
                <div key={m.monthsAgo} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] text-slate-400">{total}</span>
                  <div className="flex h-full w-full items-end">
                    <div
                      className="w-full overflow-hidden rounded-t-lg bg-gradient-to-t from-brand-600/70 to-cyan-400/80"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-600">{monthLabels[i]}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              { v: SHORTS_DELIVERED, l: "Shorts / Reels" },
              { v: LONGFORM_DELIVERED, l: "Long-form" },
              { v: VIDEOS_DELIVERED, l: "Total delivered" },
            ].map((x) => (
              <div key={x.l} className="rounded-xl border border-white/8 py-3">
                <p className="font-display text-2xl font-bold text-white">{x.v}</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">{x.l}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
            <Users size={13} className="text-brand-300" />
            Delivered for {ACTIVE_CLIENTS} clients · {inr(TOTAL_REVENUE)} collected ·{" "}
            {inr(Math.round(TOTAL_REVENUE / VIDEOS_DELIVERED))} average per video.
          </p>
        </Panel>
      </div>
    </div>
  );
}
