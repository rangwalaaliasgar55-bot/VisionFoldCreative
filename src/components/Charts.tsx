"use client";

import { fmtMoney } from "@/lib/utils";

const PALETTE = ["#7357FF", "#F4A62A", "#A78BFA", "#34d399", "#F5D78A", "#5B3FD4"];

export function Bars({
  data,
  height = 170,
  money = false,
}: {
  data: { label: string; value: number }[];
  height?: number;
  money?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group flex h-full flex-1 flex-col justify-end">
          <div
            title={money ? `${d.label}: ${fmtMoney(d.value)}` : `${d.label}: ${d.value}`}
            className="relative w-full rounded-t-lg bg-gradient-to-t from-brand-700 to-cy-400/80 transition-all duration-500 group-hover:from-brand-600 group-hover:to-cy-300"
            style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function Donut({
  data,
  size = 150,
}: {
  data: { label: string; value: number }[];
  size?: number;
}) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const r = 42;
  const c = 2 * Math.PI * r;
  // Precompute segment offsets without mutating anything during render.
  const segments = data.reduce<Array<{ d: (typeof data)[number]; i: number; len: number; offset: number }>>(
    (acc, d, i) => {
      const len = (d.value / total) * c;
      const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].len : 0;
      acc.push({ d, i, len, offset });
      return acc;
    },
    []
  );
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="11" />
        {segments.map(({ i, len, offset }) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth="11"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
        ))}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90"
          fill="#fff"
          style={{ transform: "rotate(90deg)", transformOrigin: "50% 50%", fontSize: 13, fontWeight: 700 }}
        >
          {fmtMoney(total)}
        </text>
      </svg>
      <ul className="space-y-1.5 text-xs">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            {d.label}
            <span className="ml-auto pl-3 font-medium text-slate-200">{fmtMoney(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sparkline({ data, width = 120, height = 40 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - 4 - ((v - min) / range) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke="#7357FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill="url(#sparkfill)" opacity="0.25" />
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7357FF" />
          <stop offset="1" stopColor="#7357FF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Funnel({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-slate-400">{d.label}</span>
          <div className="h-6 flex-1 rounded-md bg-white/5">
            <div
              className="flex h-full items-center rounded-md bg-gradient-to-r from-brand-600 to-cy-500 px-2 text-[11px] font-semibold text-white"
              style={{ width: `${Math.max(6, (d.value / max) * 100)}%` }}
            >
              {d.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
