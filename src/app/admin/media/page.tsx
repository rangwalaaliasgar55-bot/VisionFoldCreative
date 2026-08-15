"use client";

import { useMemo, useState } from "react";
import {
  api,
  Badge,
  Button,
  Card,
  ConfirmButton,
  Empty,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  toast,
  useApi,
} from "@/components/AdminUI";
import { Check, Clipboard, ExternalLink, File, FileImage, Film, Grid2X2, List, Plus, Search, UploadCloud } from "lucide-react";

type MediaRow = {
  id: number;
  name: string;
  url: string;
  type: string;
  size: number | string;
  createdAt?: string;
};

const EMPTY = { name: "", url: "", type: "image", size: "150000" };

function prettyBytes(value: number | string) {
  const bytes = Number(value || 0);
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function MediaIcon({ type, size = 18 }: { type: string; size?: number }) {
  if (type === "video") return <Film size={size} />;
  if (type === "image") return <FileImage size={size} />;
  return <File size={size} />;
}

export default function AdminMediaPage() {
  const { data: items, loading, reload } = useApi<MediaRow[]>("/api/admin/media");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<MediaRow | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [copied, setCopied] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => (items || []).filter((item) => {
    const matchesType = filter === "all" || item.type === filter;
    const q = query.toLowerCase();
    return matchesType && (!q || item.name.toLowerCase().includes(q) || item.url.toLowerCase().includes(q));
  }), [items, filter, query]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/media", { json: { ...form, size: Number(form.size) || 0 } });
      toast("Asset added to the media library");
      setForm(EMPTY);
      setShowAdd(false);
      reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not add asset", "err");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: MediaRow) {
    try {
      await api(`/api/admin/media/${item.id}`, { method: "DELETE" });
      toast("Asset removed");
      setSelected(null);
      reload();
    } catch {
      toast("Could not remove asset", "err");
    }
  }

  async function copy(item: MediaRow) {
    await navigator.clipboard.writeText(item.url);
    setCopied(item.id);
    toast("Asset URL copied");
    setTimeout(() => setCopied(null), 1800);
  }

  const totalSize = (items || []).reduce((sum, item) => sum + Number(item.size || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-brand-300"><UploadCloud size={13} /> Content library</div>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Media library</h2>
          <p className="mt-1 text-sm text-slate-500">One place for images, videos, documents and reusable URLs.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus size={15} /> Add asset</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["All assets", items?.length || 0, "items"],
          ["Images", items?.filter((x) => x.type === "image").length || 0, "visuals"],
          ["Videos", items?.filter((x) => x.type === "video").length || 0, "clips"],
          ["Library size", prettyBytes(totalSize), "referenced"],
        ].map(([label, value, sub]) => <div key={String(label)} className="rounded-2xl border border-white/[0.07] bg-panel/70 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</p><p className="mt-2 font-display text-xl font-bold text-white">{value}</p><p className="text-[10px] text-slate-600">{sub}</p></div>)}
      </div>

      <Card className="!p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files and URLs…" className="!pl-9" /></div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="!w-auto"><option value="all">All types</option><option value="image">Images</option><option value="video">Videos</option><option value="document">Documents</option></Select>
          <div className="flex rounded-xl border border-white/10 p-1"><button onClick={() => setView("grid")} aria-label="Grid view" className={`rounded-lg p-2 ${view === "grid" ? "bg-white/10 text-white" : "text-slate-600"}`}><Grid2X2 size={14} /></button><button onClick={() => setView("list")} aria-label="List view" className={`rounded-lg p-2 ${view === "list" ? "bg-white/10 text-white" : "text-slate-600"}`}><List size={14} /></button></div>
        </div>
      </Card>

      {loading ? <Spinner /> : filtered.length === 0 ? <Empty title="No assets found" desc={items?.length ? "Try another search or file type." : "Add an image, video, or document URL to build your reusable library."} action={!items?.length ? <Button onClick={() => setShowAdd(true)}><Plus size={14} /> Add first asset</Button> : undefined} /> : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <article key={item.id} className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-panel transition hover:-translate-y-0.5 hover:border-brand-400/30 hover:shadow-xl hover:shadow-black/20">
              <button onClick={() => setSelected(item)} className="relative block aspect-[16/10] w-full overflow-hidden bg-black/20 text-left">
                {item.type === "image" ? <img src={item.url} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand-500/10 to-amber/5 text-brand-300"><MediaIcon type={item.type} size={32} /></span>}
                <span className="absolute left-3 top-3"><Badge tone={item.type === "video" ? "review" : "published"}>{item.type}</Badge></span>
              </button>
              <div className="flex items-center gap-3 p-3.5"><span className="text-slate-500"><MediaIcon type={item.type} /></span><button onClick={() => setSelected(item)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold text-white">{item.name}</span><span className="block text-[10px] text-slate-600">{prettyBytes(item.size)}</span></button><button onClick={() => copy(item)} title="Copy URL" className="rounded-lg p-2 text-slate-600 hover:bg-white/5 hover:text-white">{copied === item.id ? <Check size={14} className="text-emerald-400" /> : <Clipboard size={14} />}</button></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-panel">
          {filtered.map((item) => <div key={item.id} className="flex items-center gap-3 border-b border-white/[0.06] p-3 last:border-0 hover:bg-white/[0.025]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-brand-300"><MediaIcon type={item.type} /></span><button onClick={() => setSelected(item)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold text-white">{item.name}</span><span className="block truncate text-[10px] text-slate-600">{item.url}</span></button><Badge tone={item.type === "video" ? "review" : "published"}>{item.type}</Badge><span className="hidden w-20 text-right text-xs text-slate-500 sm:block">{prettyBytes(item.size)}</span><button onClick={() => copy(item)} className="rounded-lg p-2 text-slate-500 hover:text-white"><Clipboard size={14} /></button></div>)}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add media asset">
        <form onSubmit={save} className="space-y-4">
          <div className="rounded-xl border border-dashed border-brand-400/25 bg-brand-500/[0.05] p-4 text-center"><UploadCloud className="mx-auto text-brand-300" size={24} /><p className="mt-2 text-xs font-semibold text-white">Connect a hosted asset</p><p className="mt-1 text-[10px] text-slate-500">Paste a public CDN, Supabase, Cloudinary or video URL.</p></div>
          <Field label="Asset name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Homepage showreel cover" /></Field>
          <Field label="Public URL" hint="Use HTTPS so the asset loads securely on your site."><Input required type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://cdn.example.com/asset.jpg" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="File type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="image">Image</option><option value="video">Video</option><option value="document">Document</option></Select></Field><Field label="Size in bytes"><Input type="number" min="0" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} /></Field></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add to library"}</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Asset details">
        {selected && <div className="space-y-4">{selected.type === "image" && <div className="aspect-video overflow-hidden rounded-xl bg-black/20"><img src={selected.url} alt={selected.name} className="h-full w-full object-contain" /></div>}<div><p className="font-display text-lg font-bold text-white">{selected.name}</p><div className="mt-2 flex items-center gap-2"><Badge tone="published">{selected.type}</Badge><span className="text-xs text-slate-500">{prettyBytes(selected.size)}</span></div></div><div className="break-all rounded-xl border border-white/8 bg-black/15 p-3 text-xs leading-relaxed text-slate-400">{selected.url}</div><div className="flex flex-wrap justify-between gap-2"><ConfirmButton title="Delete asset" confirm="Delete?" onConfirm={() => remove(selected)} /><div className="flex gap-2"><Button variant="outline" onClick={() => copy(selected)}><Clipboard size={14} /> Copy URL</Button><a href={selected.url} target="_blank" rel="noreferrer"><Button><ExternalLink size={14} /> Open</Button></a></div></div></div>}
      </Modal>
    </div>
  );
}
