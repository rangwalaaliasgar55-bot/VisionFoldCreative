"use client";

import { useState } from "react";
import {
  api,
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  Spinner,
  toast,
} from "@/components/AdminUI";
import { MapPin, Phone, Globe, Plus, Search, Star } from "lucide-react";

interface Prospect {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  totalRatings: number | null;
  phone: string;
  website: string;
  types: string[];
}

export default function AdminProspectsPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Prospect[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const data = await api<{ results: Prospect[]; error?: string }>(
        `/api/admin/prospects?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`
      );
      if (data.error) setError(data.error);
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function addAsLead(p: Prospect) {
    setAdding(p.id);
    try {
      await api("/api/admin/leads", {
        json: {
          name: p.name,
          phone: p.phone,
          service: "Video Editing",
          message: p.website ? `Found via Google Maps. Website: ${p.website}` : "Found via Google Maps prospecting.",
          notes: `${p.address || ""}${p.rating ? ` · ★ ${p.rating}` : ""}`,
          source: "maps",
        },
      });
      toast(`Added "${p.name}" to leads`);
    } catch {
      toast("Failed to add lead", "err");
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Find Businesses</h1>
        <p className="text-sm text-slate-500">
          Search Google Maps for businesses that could use video editing — then add them straight to your leads pipeline.
        </p>
      </div>

      <Card title="Search businesses" desc="Uses Google Places (server-side key)">
        <form onSubmit={runSearch} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Field label="What kind of business?">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. gyms, restaurants, real estate agents, clinics…"
              />
            </Field>
          </div>
          <div className="min-w-[180px] flex-1">
            <Field label="Near (optional)">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Indore, Mumbai"
              />
            </Field>
          </div>
          <Button type="submit" disabled={searching || !query.trim()}>
            <Search size={14} /> {searching ? "Searching…" : "Search"}
          </Button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-slate-300">
            <p className="font-semibold text-amber-300">Google Places isn&rsquo;t connected yet</p>
            <p className="mt-1">{error}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-400">
              <li>Go to Google Cloud Console → enable the <strong>Places API (New)</strong>.</li>
              <li>Create an API key and restrict it to the Places API.</li>
              <li>Add it to Vercel as <code className="text-brand-300">GOOGLE_PLACES_API_KEY</code> and redeploy.</li>
            </ol>
          </div>
        )}
      </Card>

      {searching ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : results.length === 0 ? (
        <Empty title="No results yet" desc="Search for a business type above to find prospects near your target area." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {results.map((p) => (
            <div key={p.id} className="glass card-glow flex flex-col justify-between gap-3 rounded-2xl p-4">
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-white">{p.name}</h3>
                  {p.rating && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-300">
                      <Star size={12} className="fill-amber-300" /> {p.rating}
                      {p.totalRatings ? <span className="text-slate-500">({p.totalRatings})</span> : null}
                    </span>
                  )}
                </div>
                {p.address && (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-400">
                    <MapPin size={12} className="mt-0.5 shrink-0 text-brand-300" /> {p.address}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.types.slice(0, 3).map((t) => (
                    <Badge key={t} tone="new">{t.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-white/8 pt-3">
                {p.phone && (
                  <a href={`tel:${p.phone}`} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/10 px-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5">
                    <Phone size={13} className="text-cyan-300" /> Call
                  </a>
                )}
                {p.website && (
                  <a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/10 px-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5">
                    <Globe size={13} className="text-brand-300" /> Site
                  </a>
                )}
                <Button size="sm" onClick={() => addAsLead(p)} disabled={adding === p.id} className="ml-auto">
                  <Plus size={13} /> {adding === p.id ? "Adding…" : "Add as lead"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
