import React, { useState } from 'react';
import { Globe2, MapPin } from 'lucide-react';

const HUBS = [
  { id: 1, city: 'Mumbai', country: 'India', x: 72.5, y: 52, projects: 28 },
  { id: 2, city: 'Delhi', country: 'India', x: 74.2, y: 46, projects: 16 },
  { id: 3, city: 'Dubai', country: 'UAE', x: 62.5, y: 48, projects: 12 },
  { id: 4, city: 'London', country: 'UK', x: 48.5, y: 32, projects: 9 },
  { id: 5, city: 'New York', country: 'USA', x: 26, y: 40, projects: 11 },
  { id: 6, city: 'Los Angeles', country: 'USA', x: 18, y: 44, projects: 7 },
  { id: 7, city: 'Toronto', country: 'Canada', x: 24, y: 34, projects: 6 },
  { id: 8, city: 'Singapore', country: 'Singapore', x: 80, y: 62, projects: 8 },
  { id: 9, city: 'Sydney', country: 'Australia', x: 88, y: 78, projects: 5 },
  { id: 10, city: 'Berlin', country: 'Germany', x: 51, y: 30, projects: 4 },
  { id: 11, city: 'Tokyo', country: 'Japan', x: 86, y: 42, projects: 6 },
  { id: 12, city: 'Riyadh', country: 'Saudi Arabia', x: 60, y: 50, projects: 5 },
  { id: 13, city: 'Cape Town', country: 'South Africa', x: 54, y: 78, projects: 3 },
  { id: 14, city: 'São Paulo', country: 'Brazil', x: 32, y: 72, projects: 4 },
  { id: 15, city: 'Seoul', country: 'South Korea', x: 84, y: 40, projects: 5 },
] as const;

export const ClientsGlobeSection: React.FC = () => {
  const [active, setActive] = useState(1);
  const hub = HUBS.find((h) => h.id === active) ?? HUBS[0];

  return (
    <section className="relative z-10 border-t border-white/10 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-black/40 px-4 py-2">
            <Globe2 className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Global reach</span>
          </div>
          <h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl">
            Clients from <span className="gold-gradient-text">15 cities</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-[#B8B3AA]">
            Brands and founders across continents ship with VisionFold.
          </p>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.35fr_1fr]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
              <ellipse cx="22" cy="42" rx="14" ry="18" fill="rgba(255,255,255,0.04)" />
              <ellipse cx="52" cy="38" rx="12" ry="16" fill="rgba(255,255,255,0.045)" />
              <ellipse cx="78" cy="48" rx="14" ry="16" fill="rgba(255,255,255,0.04)" />
              <ellipse cx="50" cy="50" rx="42" ry="32" fill="none" stroke="rgba(212,175,55,0.18)" strokeWidth="0.3" />
            </svg>
            {HUBS.map((h) => (
              <button
                key={h.id}
                type="button"
                onMouseEnter={() => setActive(h.id)}
                onClick={() => setActive(h.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
                aria-label={`${h.city}`}
              >
                <span
                  className={`block rounded-full transition-all ${
                    active === h.id
                      ? 'h-3.5 w-3.5 bg-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.9)]'
                      : 'h-2 w-2 bg-white/50 hover:bg-[#D4AF37]'
                  }`}
                />
              </button>
            ))}
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur-xl sm:left-auto sm:right-4 sm:w-56">
              <div className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
                <div>
                  <p className="font-bold text-white">{hub.city}</p>
                  <p className="text-xs text-[#B8B3AA]">{hub.country}</p>
                  <p className="mt-1 text-xs text-[#D4AF37]">{hub.projects}+ projects</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {HUBS.map((h) => (
              <button
                key={h.id}
                type="button"
                onMouseEnter={() => setActive(h.id)}
                onClick={() => setActive(h.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                  active === h.id
                    ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${active === h.id ? 'bg-[#D4AF37]' : 'bg-white/30'}`} />
                  <span>
                    <span className="block text-sm font-semibold text-white">{h.city}</span>
                    <span className="text-xs text-white/40">{h.country}</span>
                  </span>
                </span>
                <span className="text-xs tabular-nums text-white/40">{h.projects}+</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
