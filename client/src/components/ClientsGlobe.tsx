import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Globe2 } from "lucide-react";

/** Showcase reach — sample client origins (marketing display). */
const CLIENT_HUBS = [
  { id: 1, city: "Mumbai", country: "India", x: 72.5, y: 52, projects: 28 },
  { id: 2, city: "Delhi", country: "India", x: 74.2, y: 46, projects: 16 },
  { id: 3, city: "Dubai", country: "UAE", x: 62.5, y: 48, projects: 12 },
  { id: 4, city: "London", country: "UK", x: 48.5, y: 32, projects: 9 },
  { id: 5, city: "New York", country: "USA", x: 26, y: 40, projects: 11 },
  { id: 6, city: "Los Angeles", country: "USA", x: 18, y: 44, projects: 7 },
  { id: 7, city: "Toronto", country: "Canada", x: 24, y: 34, projects: 6 },
  { id: 8, city: "Singapore", country: "Singapore", x: 80, y: 62, projects: 8 },
  { id: 9, city: "Sydney", country: "Australia", x: 88, y: 78, projects: 5 },
  { id: 10, city: "Berlin", country: "Germany", x: 51, y: 30, projects: 4 },
  { id: 11, city: "Tokyo", country: "Japan", x: 86, y: 42, projects: 6 },
  { id: 12, city: "Riyadh", country: "Saudi Arabia", x: 60, y: 50, projects: 5 },
  { id: 13, city: "Cape Town", country: "South Africa", x: 54, y: 78, projects: 3 },
  { id: 14, city: "São Paulo", country: "Brazil", x: 32, y: 72, projects: 4 },
  { id: 15, city: "Seoul", country: "South Korea", x: 84, y: 40, projects: 5 },
] as const;

export default function ClientsGlobe() {
  const [active, setActive] = useState<number | null>(1);
  const activeHub = useMemo(
    () => CLIENT_HUBS.find((h) => h.id === active) ?? null,
    [active]
  );

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-void via-midnight to-void pointer-events-none" />
      <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12),transparent_60%)]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <Globe2 className="w-4 h-4 text-amber" />
            <span className="text-sm text-white/70">Global creative reach</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Clients from{" "}
            <span className="text-gradient">15 cities</span>
          </motion.h2>
          <p className="text-white/50 max-w-xl mx-auto text-base md:text-lg">
            Brands and founders across continents trust VisionFold to edit, craft,
            and ship stories that land.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div className="relative aspect-[16/10] rounded-3xl glass overflow-hidden border border-white/10">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
            >
              <ellipse cx="22" cy="42" rx="14" ry="18" fill="rgba(255,255,255,0.04)" />
              <ellipse cx="32" cy="68" rx="10" ry="14" fill="rgba(255,255,255,0.035)" />
              <ellipse cx="52" cy="38" rx="12" ry="16" fill="rgba(255,255,255,0.045)" />
              <ellipse cx="58" cy="62" rx="9" ry="14" fill="rgba(255,255,255,0.03)" />
              <ellipse cx="78" cy="48" rx="14" ry="16" fill="rgba(255,255,255,0.04)" />
              <ellipse cx="86" cy="74" rx="8" ry="10" fill="rgba(255,255,255,0.03)" />
              <ellipse
                cx="50"
                cy="50"
                rx="42"
                ry="32"
                fill="none"
                stroke="rgba(212,175,55,0.15)"
                strokeWidth="0.3"
              />
              <ellipse
                cx="50"
                cy="50"
                rx="30"
                ry="22"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.25"
              />
            </svg>

            {CLIENT_HUBS.map((hub, i) => {
              const isActive = active === hub.id;
              return (
                <button
                  key={hub.id}
                  type="button"
                  onMouseEnter={() => setActive(hub.id)}
                  onFocus={() => setActive(hub.id)}
                  onClick={() => setActive(hub.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
                  aria-label={`${hub.city}, ${hub.country}`}
                >
                  <span
                    className={`block rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-3.5 h-3.5 bg-amber shadow-[0_0_20px_rgba(245,158,11,0.8)]"
                        : "w-2 h-2 bg-white/50 group-hover:bg-amber group-hover:w-3 group-hover:h-3"
                    }`}
                  />
                </button>
              );
            })}

            <AnimatePresence mode="wait">
              {activeHub && (
                <motion.div
                  key={activeHub.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-56 glass-strong rounded-2xl p-4"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-white">{activeHub.city}</p>
                      <p className="text-xs text-white/50">{activeHub.country}</p>
                      <p className="text-xs text-amber/90 mt-1">
                        {activeHub.projects}+ projects shipped
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {CLIENT_HUBS.map((hub) => (
              <button
                key={hub.id}
                type="button"
                onMouseEnter={() => setActive(hub.id)}
                onClick={() => setActive(hub.id)}
                className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all ${
                  active === hub.id
                    ? "border-amber/40 bg-amber/10"
                    : "border-white/5 bg-white/[0.02] hover:border-white/15"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      active === hub.id ? "bg-amber" : "bg-white/30"
                    }`}
                  />
                  <span>
                    <span className="block text-sm font-medium text-white">
                      {hub.city}
                    </span>
                    <span className="text-xs text-white/40">{hub.country}</span>
                  </span>
                </span>
                <span className="text-xs text-white/40 tabular-nums">
                  {hub.projects}+
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
