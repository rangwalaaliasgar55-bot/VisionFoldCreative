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
  Modal,
  Spinner,
  Textarea,
  toast,
  useApi,
} from "@/components/AdminUI";
import { Pencil, Plus, Star } from "lucide-react";

type Item = {
  id: number;
  title: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  year: string;
  featured: boolean;
};

const EMPTY = { title: "", category: "Brand Film", description: "", thumbnailUrl: "", videoUrl: "", year: String(new Date().getFullYear()), featured: false };

export default function AdminPortfolioPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState(EMPTY);
  const { data: items, loading, reload } = useApi<Item[]>("/api/admin/portfolio");

  function openEdit(it: Item) {
    setEditing(it);
    setForm({ title: it.title, category: it.category, description: it.description, thumbnailUrl: it.thumbnailUrl, videoUrl: it.videoUrl, year: it.year, featured: it.featured });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await api(`/api/admin/portfolio/${editing.id}`, { method: "PATCH", json: form });
        toast("Item updated");
      } else {
        await api("/api/admin/portfolio", { json: form });
        toast("Item added to the reel");
      }
      setShowAdd(false);
      setEditing(null);
      setForm(EMPTY);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  async function toggleFeatured(it: Item) {
    try {
      await api(`/api/admin/portfolio/${it.id}`, { method: "PATCH", json: { featured: !it.featured } });
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  async function remove(it: Item) {
    try {
      await api(`/api/admin/portfolio/${it.id}`, { method: "DELETE" });
      toast("Item removed");
      reload();
    } catch {
      toast("Failed", "err");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Portfolio</h1>
          <p className="text-sm text-slate-500">Featured items power the homepage 3D reel</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add work
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : !items || items.length === 0 ? (
        <Empty title="Empty reel" desc="Add your first portfolio piece — it will appear on the homepage and work page." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((it) => (
            <div key={it.id} className="glass group overflow-hidden rounded-2xl">
              <div className="relative h-40 overflow-hidden bg-panel2">
                {it.thumbnailUrl ? (
                  <img src={it.thumbnailUrl} alt={it.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="grid h-full place-items-center text-slate-600">No image</div>
                )}
                <button
                  onClick={() => toggleFeatured(it)}
                  title="Toggle featured"
                  className={`absolute right-2 top-2 rounded-full p-1.5 backdrop-blur transition-all ${
                    it.featured ? "bg-amber-400/90 text-black" : "bg-black/50 text-slate-300 hover:text-amber-300"
                  }`}
                >
                  <Star size={14} className={it.featured ? "fill-black" : ""} />
                </button>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">{it.category}</p>
                <h3 className="mt-1 truncate text-sm font-semibold text-white">{it.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{it.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">{it.year}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(it)}>
                      <Pencil size={13} />
                    </Button>
                    <ConfirmButton onConfirm={() => remove(it)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd || Boolean(editing)} onClose={() => { setShowAdd(false); setEditing(null); }} title={editing ? "Edit work" : "Add portfolio piece"} wide>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title *">
              <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
            <Field label="Category">
              <Input list="cats" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
              <datalist id="cats">
                {["Brand Film", "YouTube", "Music Video", "Commercials", "Documentary", "Wedding", "Corporate"].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Thumbnail URL">
              <Input value={form.thumbnailUrl} onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))} placeholder="https://…" />
            </Field>
            <Field label="Video URL (optional)">
              <Input value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/…" />
            </Field>
            <Field label="Year">
              <Input value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
            </Field>
            <label className="flex items-center gap-2 pt-6 text-sm text-slate-300">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="accent-violet-500" />
              Featured (homepage reel)
            </label>
          </div>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          {form.thumbnailUrl && (
            <div className="overflow-hidden rounded-xl border border-white/8">
              <img src={form.thumbnailUrl} alt="preview" className="max-h-48 w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowAdd(false); setEditing(null); }}>Cancel</Button>
            <Button type="submit">{editing ? "Save changes" : "Add to reel"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
