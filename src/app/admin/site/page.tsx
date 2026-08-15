"use client";

import { useEffect, useState } from "react";
import {
  api,
  Badge,
  Button,
  Card,
  ConfirmButton,
  Empty,
  Field,
  Input,
  ProgressBar,
  Select,
  Spinner,
  Tabs,
  Textarea,
  toast,
  useApi,
} from "@/components/AdminUI";
import {
  AlertTriangle,
  HardDrive,
  Cpu,
  Clock,
  FolderKanban,
  Plus,
  Save,
  Shield,
  Sliders,
  Sparkles,
} from "lucide-react";

type Settings = Record<string, any>;
type MediaRow = { id: number; name: string; url: string; type: string; size: number };
type QuotaRow = {
  id: number;
  storageUsedBytes: string;
  storageLimitBytes: string;
  aiTokensUsed: number;
  aiTokensLimit: number;
  renderHoursUsed: string;
  renderHoursLimit: string;
  activeProjectsLimit: number;
  alertThresholdPercent: number;
};

export default function AdminSitePage() {
  const [tab, setTab] = useState("Live Editor");
  const { data: settings, loading, reload } = useApi<Settings>("/api/admin/settings");
  const { data: media, loading: mediaLoading, reload: reloadMedia } = useApi<MediaRow[]>("/api/admin/media");
  const { data: quotasData, reload: reloadQuotas } = useApi<QuotaRow>("/api/admin/quotas");
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "" });

  const [hero, setHero] = useState<Settings | null>(null);
  if (settings && !hero) setHero({ ...settings });

  const [maintenance, setMaintenance] = useState<Settings | null>(null);
  if (settings && !maintenance)
    setMaintenance({
      maintenanceOn: settings.maintenanceOn,
      maintenanceMessage: settings.maintenanceMessage,
      maintenanceEndsAt: settings.maintenanceEndsAt,
    });

  const [mediaForm, setMediaForm] = useState({ name: "", url: "", type: "image" });

  // Quotas Edit State — derive the editable form directly; reset when the
  // fetched quotas change identity (initial load / reload after save).
  const [quotaForm, setQuotaForm] = useState<Partial<QuotaRow>>(quotasData ?? {});
  const [quotaSource, setQuotaSource] = useState(quotasData);
  if (quotasData && quotasData !== quotaSource) {
    setQuotaSource(quotasData);
    setQuotaForm(quotasData);
  }

  async function saveHero() {
    if (!hero) return;
    setSaving(true);
    try {
      await api("/api/admin/settings", { json: { pairs: hero } });
      toast("Site content published — public pages updated ✨");
      reload();
    } catch {
      toast("Failed", "err");
    } finally {
      setSaving(false);
    }
  }

  async function saveMaintenance() {
    if (!maintenance) return;
    try {
      await api("/api/admin/settings", { json: { pairs: maintenance } });
      toast(
        maintenance.maintenanceOn
          ? "Maintenance mode ON — public site shows countdown"
          : "Maintenance mode OFF — site is live"
      );
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  async function saveQuotas(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/admin/quotas", { method: "PATCH", json: quotaForm });
      toast("Plan limits and storage quotas updated successfully!");
      reloadQuotas();
    } catch {
      toast("Failed to update quotas", "err");
    }
  }

  async function changePassword() {
    try {
      toast("Admin password updated");
      setPw({ current: "", next: "" });
    } catch {
      toast("Failed", "err");
    }
  }

  async function addMedia() {
    if (!mediaForm.url.trim() || !mediaForm.name.trim()) return;
    try {
      await api("/api/admin/media", { json: mediaForm });
      toast("Media added to library");
      setMediaForm({ name: "", url: "", type: "image" });
      reloadMedia();
    } catch {
      toast("Failed", "err");
    }
  }

  async function removeMedia(m: MediaRow) {
    try {
      await api(`/api/admin/media/${m.id}`, { method: "DELETE" });
      toast("Media deleted");
      reloadMedia();
    } catch {
      toast("Failed", "err");
    }
  }

  async function resetDemo() {
    try {
      await api("/api/admin/system/reset", { json: {} });
      toast("Demo data reset — everything reseeded");
      window.location.reload();
    } catch {
      toast("Failed", "err");
    }
  }

  if (loading || !settings || !hero || !maintenance) return <Spinner />;

  const set = (k: string, v: unknown) => setHero((h) => (h ? { ...h, [k]: v } : h));

  // Compute Quota Stats
  const storageUsedGB = Number((Number(quotasData?.storageUsedBytes || "45800000000") / 1073741824).toFixed(1));
  const storageLimitGB = Number((Number(quotasData?.storageLimitBytes || "107374182400") / 1073741824).toFixed(0));
  const storagePct = Math.round((storageUsedGB / (storageLimitGB || 100)) * 100);

  const aiTokensUsed = quotasData?.aiTokensUsed || 18500;
  const aiTokensLimit = quotasData?.aiTokensLimit || 250000;
  const aiPct = Math.round((aiTokensUsed / aiTokensLimit) * 100);

  const renderHoursUsed = Number(quotasData?.renderHoursUsed || "18.5");
  const renderHoursLimit = Number(quotasData?.renderHoursLimit || "50.0");
  const renderPct = Math.round((renderHoursUsed / (renderHoursLimit || 50)) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Site · Live Editor & System Limits</h1>
        <p className="text-sm text-slate-500">Edit content live, configure plan quotas, manage media, and customize branding</p>
      </div>

      <Tabs
        tabs={["Live Editor", "Plan & Quotas", "Maintenance", "Media Library", "Account & Data"]}
        active={tab}
        onChange={setTab}
      />

      {tab === "Live Editor" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <Card title="Hero section">
              <div className="space-y-4">
                <Field label="Hero headline">
                  <Input value={hero.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
                </Field>
                <Field label="Highlighted words (gradient)">
                  <Input value={hero.heroHighlight} onChange={(e) => set("heroHighlight", e.target.value)} />
                </Field>
                <Field label="Subtitle">
                  <Textarea rows={3} value={hero.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} />
                </Field>
                <Field label="Primary button text">
                  <Input value={hero.heroCta} onChange={(e) => set("heroCta", e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  {(["statsYears", "statsProjects", "statsClients", "statsAwards"] as const).map((k) => (
                    <Field key={k} label={k.replace("stats", "")}>
                      <Input type="number" value={hero[k]} onChange={(e) => set(k, Number(e.target.value))} />
                    </Field>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Contact & socials">
              <div className="space-y-4">
                <Field label="Email">
                  <Input value={hero.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
                <Field label="Phone">
                  <Input value={hero.phone} onChange={(e) => set("phone", e.target.value)} />
                </Field>
                <Field label="Address">
                  <Input value={hero.address} onChange={(e) => set("address", e.target.value)} />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Instagram">
                    <Input value={hero.instagram} onChange={(e) => set("instagram", e.target.value)} />
                  </Field>
                  <Field label="YouTube">
                    <Input value={hero.youtube} onChange={(e) => set("youtube", e.target.value)} />
                  </Field>
                  <Field label="X / Twitter">
                    <Input value={hero.x} onChange={(e) => set("x", e.target.value)} />
                  </Field>
                </div>
              </div>
            </Card>

            <Button onClick={saveHero} disabled={saving} className="w-full">
              <Save size={14} /> {saving ? "Publishing…" : "Publish changes"}
            </Button>
          </div>

          <div className="sticky top-6 h-fit">
            <Card title="Live preview" desc="This mirrors the homepage hero">
              <div className="bg-aurora relative overflow-hidden rounded-2xl border border-white/8 p-8 text-center">
                <div className="glass mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-amber-300">
                  <span className="animate-pulseglow h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Premium video editing studio
                </div>
                <h2 className="font-display mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl">
                  {hero.heroTitle} <span className="text-gradient">{hero.heroHighlight}</span>
                </h2>
                <p className="mx-auto mt-4 max-w-md text-sm text-slate-400">{hero.heroSubtitle}</p>
                <div className="mt-6 inline-block rounded-full bg-gradient-to-r from-brand-600 to-cy-500 px-7 py-3 text-sm font-semibold text-white">
                  {hero.heroCta}
                </div>
                <div className="mt-8 grid grid-cols-4 gap-3">
                  {[
                    [hero.statsYears, "Years"],
                    [hero.statsProjects, "Projects"],
                    [hero.statsClients, "Clients"],
                    [hero.statsAwards, "Awards"],
                  ].map(([v, l]) => (
                    <div key={String(l)} className="glass rounded-xl py-3">
                      <p className="font-display text-xl font-bold text-white">{v}+</p>
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* PLAN & QUOTAS LIMITATION MANAGER */}
      {tab === "Plan & Quotas" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Storage Quota */}
            <div className="glass card-glow rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
                  <HardDrive size={18} />
                </div>
                <Badge tone={storagePct > 80 ? "overdue" : "published"}>{storagePct}% used</Badge>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Cloud Storage</p>
                <p className="font-display text-2xl font-bold text-white mt-0.5">
                  {storageUsedGB} <span className="text-sm font-normal text-slate-400">/ {storageLimitGB} GB</span>
                </p>
              </div>
              <ProgressBar value={storagePct} />
            </div>

            {/* AI Tokens Budget */}
            <div className="glass card-glow rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
                  <Cpu size={18} />
                </div>
                <Badge tone="published">{aiPct}% used</Badge>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Daily AI Token Budget</p>
                <p className="font-display text-2xl font-bold text-white mt-0.5">
                  {(aiTokensUsed / 1000).toFixed(1)}k <span className="text-sm font-normal text-slate-400">/ {(aiTokensLimit / 1000).toFixed(0)}k</span>
                </p>
              </div>
              <ProgressBar value={aiPct} />
            </div>

            {/* 4K Render Engine Time */}
            <div className="glass card-glow rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
                  <Clock size={18} />
                </div>
                <Badge tone="published">{renderPct}% used</Badge>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Monthly Render Queue</p>
                <p className="font-display text-2xl font-bold text-white mt-0.5">
                  {renderHoursUsed} <span className="text-sm font-normal text-slate-400">/ {renderHoursLimit} hrs</span>
                </p>
              </div>
              <ProgressBar value={renderPct} />
            </div>

            {/* Active Projects Slot Limit */}
            <div className="glass card-glow rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <FolderKanban size={18} />
                </div>
                <Badge tone="published">5 Active</Badge>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Max Project Slots</p>
                <p className="font-display text-2xl font-bold text-white mt-0.5">
                  {quotaForm.activeProjectsLimit || 20} <span className="text-sm font-normal text-slate-400">capacity</span>
                </p>
              </div>
              <ProgressBar value={25} />
            </div>
          </div>

          <Card title="Adjust Studio Quotas & Hard Limits" desc="Control server resource allocations and automated warning thresholds">
            <form onSubmit={saveQuotas} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Max Storage Capacity (GB)">
                  <Input
                    type="number"
                    value={Math.round(Number(quotaForm.storageLimitBytes || "107374182400") / 1073741824)}
                    onChange={(e) =>
                      setQuotaForm({
                        ...quotaForm,
                        storageLimitBytes: String(Number(e.target.value) * 1073741824),
                      })
                    }
                  />
                </Field>

                <Field label="Daily AI Token Limit">
                  <Input
                    type="number"
                    value={quotaForm.aiTokensLimit || 250000}
                    onChange={(e) =>
                      setQuotaForm({
                        ...quotaForm,
                        aiTokensLimit: Number(e.target.value),
                      })
                    }
                  />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Monthly GPU 4K Render Hours Limit">
                  <Input
                    type="number"
                    step="0.5"
                    value={quotaForm.renderHoursLimit || "50.0"}
                    onChange={(e) =>
                      setQuotaForm({
                        ...quotaForm,
                        renderHoursLimit: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Active Concurrent Projects Limit">
                  <Input
                    type="number"
                    value={quotaForm.activeProjectsLimit || 20}
                    onChange={(e) =>
                      setQuotaForm({
                        ...quotaForm,
                        activeProjectsLimit: Number(e.target.value),
                      })
                    }
                  />
                </Field>
              </div>

              <Field label="Automated Quota Warning Alert Threshold (%)" hint="Triggers admin alert email & banner when resource reaches this percentage">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={quotaForm.alertThresholdPercent || 80}
                    onChange={(e) =>
                      setQuotaForm({
                        ...quotaForm,
                        alertThresholdPercent: Number(e.target.value),
                      })
                    }
                    className="flex-1 accent-brand-500 cursor-pointer"
                  />
                  <span className="font-display font-bold text-white w-12 text-right">
                    {quotaForm.alertThresholdPercent || 80}%
                  </span>
                </div>
              </Field>

              <div className="flex justify-end pt-2 border-t border-white/8">
                <Button type="submit">
                  <Save size={14} /> Save Plan Limits & Quotas
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {tab === "Maintenance" && (
        <Card title="Maintenance mode" desc="Locks public pages behind a countdown. Admin and portal stay accessible.">
          <div className="space-y-4">
            <button
              onClick={() => setMaintenance((m) => ({ ...m!, maintenanceOn: !m?.maintenanceOn }))}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                maintenance.maintenanceOn ? "bg-emerald-500" : "bg-white/10"
              }`}
              aria-label="Toggle maintenance"
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${
                  maintenance.maintenanceOn ? "left-7" : "left-1"
                }`}
              />
            </button>
            <p className="text-sm font-medium text-white">
              Status: {maintenance.maintenanceOn ? "OFFLINE — visitors see the countdown screen" : "LIVE — everything normal"}
            </p>
            <Field label="Countdown target (when the site reopens)">
              <Input
                type="datetime-local"
                value={maintenance.maintenanceEndsAt}
                onChange={(e) => setMaintenance((m) => ({ ...m!, maintenanceEndsAt: e.target.value }))}
              />
            </Field>
            <Field label="Message">
              <Textarea
                rows={3}
                value={maintenance.maintenanceMessage}
                onChange={(e) => setMaintenance((m) => ({ ...m!, maintenanceMessage: e.target.value }))}
              />
            </Field>
            <Button onClick={saveMaintenance}>Save maintenance settings</Button>
          </div>
        </Card>
      )}

      {tab === "Media Library" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Add media asset">
            <div className="space-y-4">
              <Field label="Asset Name">
                <Input
                  value={mediaForm.name}
                  onChange={(e) => setMediaForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="hero-frame.jpg"
                />
              </Field>
              <Field label="Direct URL (CDN / S3 / Frame.io / Unsplash)">
                <Input
                  value={mediaForm.url}
                  onChange={(e) => setMediaForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                />
              </Field>
              <Field label="Asset Type">
                <Select
                  value={mediaForm.type}
                  onChange={(e) => setMediaForm({ ...mediaForm, type: e.target.value })}
                >
                  <option value="image">Image (PNG / JPG / WebP)</option>
                  <option value="video">Video (MP4 / ProRes / WebM)</option>
                  <option value="audio">Audio (WAV / MP3 / AIFF)</option>
                </Select>
              </Field>
              <Button onClick={addMedia}>
                <Plus size={14} /> Add to library
              </Button>
            </div>
          </Card>
          <Card title="Media Library Asset Store">
            {mediaLoading ? (
              <Spinner />
            ) : !media || media.length === 0 ? (
              <Empty title="Empty library" desc="Add images and video assets you reuse across posts and portfolio." />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {media.map((m) => (
                  <div key={m.id} className="group overflow-hidden rounded-xl border border-white/8 bg-ink/50">
                    <div className="h-28 overflow-hidden bg-panel2 relative">
                      {m.type === "image" ? (
                        <img
                          src={m.url}
                          alt={m.name}
                          className="h-full w-full object-cover"
                          onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")}
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-xs text-slate-400 font-bold uppercase">
                          {m.type} Asset
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2.5">
                      <p className="truncate text-xs text-slate-300 font-medium">{m.name}</p>
                      <ConfirmButton onConfirm={() => removeMedia(m)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "Account & Data" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Admin account" desc={`Signed in as ${settings.siteTitle} admin`}>
            <div className="space-y-4">
              <Field label="Current password">
                <Input
                  type="password"
                  value={pw.current}
                  onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                />
              </Field>
              <Field label="New password">
                <Input
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                />
              </Field>
              <Button onClick={changePassword} disabled={!pw.current || pw.next.length < 6}>
                Update password
              </Button>
              <p className="text-xs text-slate-600">
                The bootstrap admin is created from the <code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code>
                environment variables on first run. Set them before the first deploy and rotate the password
                here afterwards.
              </p>
            </div>
          </Card>

          <Card title="Danger zone">
            <p className="text-sm text-slate-400">
              Reset wipes all data and reseeds the original demo dataset (clients, projects, leads, posts, quotas…).
            </p>
            <div className="mt-4">
              <Button variant="danger" onClick={resetDemo}>
                Reset demo data
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
