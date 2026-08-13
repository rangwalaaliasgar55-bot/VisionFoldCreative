"use client";

import { useState } from "react";
import {
  api,
  Button,
  Card,
  ConfirmButton,
  Empty,
  Field,
  Input,
  Spinner,
  Tabs,
  Textarea,
  toast,
  useApi,
} from "@/components/AdminUI";
import { Plus, Save } from "lucide-react";

type Settings = Record<string, any>;
type MediaRow = { id: number; name: string; url: string; type: string; size: number };

export default function AdminSitePage() {
  const [tab, setTab] = useState("Live Editor");
  const { data: settings, loading, reload } = useApi<Settings>("/api/admin/settings");
  const { data: media, loading: mediaLoading, reload: reloadMedia } = useApi<MediaRow[]>("/api/admin/media");
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "" });

  const [hero, setHero] = useState<Settings | null>(null);
  if (settings && !hero) setHero({ ...settings });

  const [maintenance, setMaintenance] = useState<Settings | null>(null);
  if (settings && !maintenance) setMaintenance({ maintenanceOn: settings.maintenanceOn, maintenanceMessage: settings.maintenanceMessage, maintenanceEndsAt: settings.maintenanceEndsAt });

  const [mediaForm, setMediaForm] = useState({ name: "", url: "", type: "image" });

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
      toast(maintenance.maintenanceOn ? "Maintenance mode ON — public site shows countdown" : "Maintenance mode OFF — site is live");
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  async function changePassword() {
    try {
      toast("Admin passwords change via env vars in production. Demo mode: no-op.");
      setPw({ current: "", next: "" });
    } catch {
      toast("Failed", "err");
    }
  }

  async function addMedia() {
    if (!mediaForm.url.trim() || !mediaForm.name.trim()) return;
    try {
      await api("/api/admin/media", { json: mediaForm });
      toast("Media added");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Site · Live editor</h1>
        <p className="text-sm text-slate-500">Edit page content without touching code — changes go live instantly</p>
      </div>

      <Tabs tabs={["Live Editor", "Maintenance", "Media Library", "Account & Data"]} active={tab} onChange={setTab} />

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
                  <Field label="Instagram"><Input value={hero.instagram} onChange={(e) => set("instagram", e.target.value)} /></Field>
                  <Field label="YouTube"><Input value={hero.youtube} onChange={(e) => set("youtube", e.target.value)} /></Field>
                  <Field label="X / Twitter"><Input value={hero.x} onChange={(e) => set("x", e.target.value)} /></Field>
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
                <div className="glass mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-cyan-300">
                  <span className="animate-pulseglow h-1.5 w-1.5 rounded-full bg-cyan-400" />
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

      {tab === "Maintenance" && (
        <Card title="Maintenance mode" desc="Locks public pages behind a countdown. Admin and portal stay accessible.">
          <div className="space-y-4">
            <button
              onClick={() => setMaintenance((m) => ({ ...m!, maintenanceOn: !m?.maintenanceOn }))}
              className={`relative h-8 w-14 rounded-full transition-colors ${maintenance.maintenanceOn ? "bg-emerald-500" : "bg-white/10"}`}
              aria-label="Toggle maintenance"
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${maintenance.maintenanceOn ? "left-7" : "left-1"}`} />
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
              <Textarea rows={3} value={maintenance.maintenanceMessage} onChange={(e) => setMaintenance((m) => ({ ...m!, maintenanceMessage: e.target.value }))} />
            </Field>
            <Button onClick={saveMaintenance}>Save maintenance settings</Button>
          </div>
        </Card>
      )}

      {tab === "Media Library" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Add media">
            <div className="space-y-4">
              <Field label="Name">
                <Input value={mediaForm.name} onChange={(e) => setMediaForm((f) => ({ ...f, name: e.target.value }))} placeholder="hero-frame.jpg" />
              </Field>
              <Field label="URL">
                <Input value={mediaForm.url} onChange={(e) => setMediaForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://…" />
              </Field>
              <Button onClick={addMedia}>
                <Plus size={14} /> Add to library
              </Button>
            </div>
          </Card>
          <Card title="Library">
            {mediaLoading ? (
              <Spinner />
            ) : !media || media.length === 0 ? (
              <Empty title="Empty library" desc="Add images and links you reuse across posts and portfolio." />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {media.map((m) => (
                  <div key={m.id} className="group overflow-hidden rounded-xl border border-white/8">
                    <div className="h-24 overflow-hidden bg-panel2">
                      {m.type === "image" ? (
                        <img src={m.url} alt={m.name} className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")} />
                      ) : (
                        <div className="grid h-full place-items-center text-xs text-slate-600">{m.type}</div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2">
                      <p className="truncate text-[11px] text-slate-400">{m.name}</p>
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
                <Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
              </Field>
              <Field label="New password">
                <Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
              </Field>
              <Button onClick={changePassword} disabled={!pw.current || pw.next.length < 6}>Update password</Button>
              <p className="text-xs text-slate-600">
                Bootstrap admin credentials come from <code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code> env vars
                (defaults: <code>visionfoldcreative@gmail.com</code> / <code>aliasgar134</code>).
              </p>
            </div>
          </Card>

          <Card title="Danger zone">
            <p className="text-sm text-slate-400">
              Reset wipes all data and reseeds the original demo dataset (clients, projects, leads, posts…).
            </p>
            <div className="mt-4">
              <Button variant="danger" onClick={resetDemo}>Reset demo data</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
