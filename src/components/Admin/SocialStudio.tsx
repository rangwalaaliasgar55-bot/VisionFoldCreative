"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Image as ImageIcon, RefreshCcw, Sparkles } from "lucide-react";
import {
  LIMITS,
  checkThumbnail,
  generateCampaign,
  type PlatformDraft,
  type SocialInput,
  type ThumbCheck,
} from "@/lib/social/engine";
import { cx, toast } from "@/components/AdminUI";

/** lucide-react v1 dropped the brand glyphs, so these are inline. */
function Youtube({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" fill="currentColor" />
    </svg>
  );
}

function Linkedin({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function Instagram({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

const CATEGORIES = [
  "brand film",
  "commercial",
  "youtube",
  "music video",
  "wedding",
  "podcast",
  "shorts",
];

type PortfolioOption = { id: number; title: string; category: string; description: string };

function Counter({ value, max, ideal }: { value: number; max: number; ideal?: number }) {
  const over = value > max;
  const warn = ideal ? value > ideal : false;
  return (
    <span
      className={cx(
        "text-[10px] font-semibold tabular-nums",
        over ? "text-red-400" : warn ? "text-amber-300" : "text-slate-500"
      )}
    >
      {value}/{max}
    </span>
  );
}

function CopyBox({
  label,
  value,
  max,
  ideal,
  rows = 3,
  onChange,
}: {
  label: string;
  value: string;
  max: number;
  ideal?: number;
  rows?: number;
  onChange: (next: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("Clipboard blocked by the browser", "err");
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <Counter value={value.length} max={max} ideal={ideal} />
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition-colors hover:border-brand-400/60 hover:text-white"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="field resize-y font-mono text-[12px] leading-relaxed"
      />
    </div>
  );
}

export default function SocialStudio({
  portfolio,
  siteUrl,
  publishing,
}: {
  portfolio: PortfolioOption[];
  siteUrl: string;
  publishing: { youtube: boolean; instagram: boolean };
}) {
  const [input, setInput] = useState<SocialInput>({
    topic: "",
    brand: "VisionFold Creative",
    audience: "",
    category: "brand film",
    durationSec: 0,
    link: `${siteUrl}/work`,
    cta: "Got footage? Send a brief and we'll cut it.",
    keywords: [],
  });
  const [keywordText, setKeywordText] = useState("");
  const [variant, setVariant] = useState(0);
  const [thumb, setThumb] = useState<{ url: string; name: string; checks: ThumbCheck[] } | null>(
    null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  // Generated on every keystroke, entirely in the browser — no request, no key.
  const pack = useMemo(
    () =>
      generateCampaign({
        ...input,
        variant,
        keywords: keywordText
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      }),
    [input, keywordText, variant]
  );

  const [edited, setEdited] = useState<Record<string, string>>({});
  const field = (key: string, fallback: string) => edited[key] ?? fallback;
  const setField = (key: string, value: string) => setEdited((e) => ({ ...e, [key]: value }));

  const set = <K extends keyof SocialInput>(key: K, value: SocialInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    setEdited({}); // regenerate cleanly when the brief changes
  };

  const onThumb = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setThumb({
        url,
        name: file.name,
        checks: checkThumbnail({
          width: img.naturalWidth,
          height: img.naturalHeight,
          bytes: file.size,
          type: file.type,
        }),
      });
    };
    img.src = url;
  };

  const exportPack = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      brief: { ...input, keywords: keywordText },
      analysis: {
        intent: pack.analysis.intent,
        keyphrases: pack.analysis.keyphrases,
        tools: pack.analysis.tools,
        metrics: pack.analysis.metrics,
      },
      readiness: pack.score,
      youtube: {
        title: field("ytTitle", pack.youtube.title ?? ""),
        description: field("ytDesc", pack.youtube.body),
        tags: pack.youtube.tags,
        chapters: pack.youtube.chapters,
        titleAlternatives: pack.youtube.titleOptions,
      },
      instagram: {
        caption: field("igCaption", pack.instagram.body),
        firstComment: field("igTags", pack.instagram.firstComment ?? ""),
      },
      linkedin: {
        post: field("liBody", pack.linkedin.body),
        hashtags: pack.linkedin.hashtags,
      },
      shorts: { title: pack.shorts.title, caption: pack.shorts.body, hashtags: pack.shorts.hashtags },
      schedule: pack.schedule,
      thumbnail: thumb?.name ?? null,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `social-pack-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Metadata pack downloaded");
  };

  const prefill = (id: number) => {
    const item = portfolio.find((p) => p.id === id);
    if (!item) return;
    setInput((prev) => ({
      ...prev,
      topic: `${item.title}. ${item.description}`,
      category: CATEGORIES.includes(item.category.toLowerCase())
        ? item.category.toLowerCase()
        : prev.category,
      link: `${siteUrl}/work`,
    }));
    setEdited({});
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      {/* ---------------- Brief ---------------- */}
      <section className="glass h-fit space-y-4 rounded-3xl p-5">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-brand-300" />
          <h2 className="font-display text-sm font-bold text-white">The brief</h2>
          <span className="ml-auto rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
            Runs offline
          </span>
        </div>

        {portfolio.length > 0 && (
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Start from published work
            </label>
            <select
              className="field"
              defaultValue=""
              onChange={(e) => e.target.value && prefill(Number(e.target.value))}
            >
              <option value="">Write from scratch…</option>
              {portfolio.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            What is the video about? *
          </label>
          <textarea
            rows={5}
            value={input.topic}
            onChange={(e) => set("topic", e.target.value)}
            placeholder="A cinematic brand film for a robotics startup — colour graded in Resolve, motion graphics for the product HUD, cut for retention."
            className="field resize-y"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Plain sentences work best. Everything below is derived from this.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Category
            </label>
            <select
              className="field"
              value={input.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Duration (sec)
            </label>
            <input
              type="number"
              min={0}
              className="field"
              value={input.durationSec || ""}
              onChange={(e) => set("durationSec", Number(e.target.value) || 0)}
              placeholder="480"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Audience
            </label>
            <input
              className="field"
              value={input.audience}
              onChange={(e) => set("audience", e.target.value)}
              placeholder="startup founders"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Link
            </label>
            <input
              className="field"
              value={input.link}
              onChange={(e) => set("link", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Must-rank keywords (comma separated)
          </label>
          <input
            className="field"
            value={keywordText}
            onChange={(e) => setKeywordText(e.target.value)}
            placeholder="brand film editing, davinci resolve"
          />
        </div>

        {/* Thumbnail */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Thumbnail
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-3 text-left transition-colors hover:border-brand-400/50"
          >
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb.url} alt="" className="h-14 w-24 rounded-lg object-cover" />
            ) : (
              <span className="grid h-14 w-24 place-items-center rounded-lg bg-white/5 text-slate-500">
                <ImageIcon size={18} />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-white">
                {thumb ? thumb.name : "Choose an image"}
              </span>
              <span className="block text-[11px] text-slate-500">
                Checked against YouTube&rsquo;s rules instantly
              </span>
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onThumb(e.target.files[0])}
          />
          {thumb && (
            <ul className="mt-2 space-y-1">
              {thumb.checks.map((c) => (
                <li key={c.label} className="flex items-start gap-2 text-[11px]">
                  <span className={c.ok ? "text-emerald-400" : "text-amber-300"}>
                    {c.ok ? "✓" : "!"}
                  </span>
                  <span className="text-slate-400">{c.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ---------------- Output ---------------- */}
      <section className="space-y-5">
        {/* Score */}
        <div className="glass rounded-3xl p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-white">{pack.score}</span>
              <span className="text-xs text-slate-500">/100 SEO readiness</span>
            </div>
            <div className="h-2 min-w-[140px] flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-amber transition-[width] duration-500"
                style={{ width: `${pack.score}%` }}
              />
            </div>
            <button
              onClick={() => {
                setVariant((v) => v + 1);
                setEdited({});
              }}
              title="Deterministic alternates — same brief, different angle"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 px-3 py-2 text-xs font-bold text-slate-200 transition-colors hover:border-brand-400/60 hover:text-white"
            >
              <RefreshCcw size={13} /> Rewrite
            </button>
            <button
              onClick={exportPack}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-warm"
            >
              <Download size={13} /> Export pack
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="rounded-full border border-brand-400/25 bg-brand-500/10 px-2 py-0.5 font-bold uppercase tracking-wider text-brand-200">
              {pack.analysis.intent === "caseStudy" ? "case study" : pack.analysis.intent}
            </span>
            {pack.analysis.tools.map((t) => (
              <span key={t} className="rounded-full border border-white/10 px-2 py-0.5 text-slate-400">
                {t}
              </span>
            ))}
            {pack.analysis.keyphrases.slice(0, 5).map((k) => (
              <span key={k} className="rounded-full bg-white/5 px-2 py-0.5 text-slate-400">
                {k}
              </span>
            ))}
          </div>

          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {pack.checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2 text-[11px]">
                <span className={c.ok ? "text-emerald-400" : "text-amber-300"}>
                  {c.ok ? "✓" : "!"}
                </span>
                <span className="text-slate-400">
                  <span className="text-slate-300">{c.label}:</span> {c.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* YouTube */}
        <div className="glass space-y-4 rounded-3xl p-5">
          <div className="flex items-center gap-2">
            <Youtube size={16} className="text-red-400" />
            <h2 className="font-display text-sm font-bold text-white">YouTube</h2>
          </div>

          <CopyBox
            label="Title"
            value={field("ytTitle", pack.youtube.title ?? "")}
            onChange={(v) => setField("ytTitle", v)}
            max={LIMITS.ytTitle}
            ideal={LIMITS.ytTitleIdeal}
            rows={2}
          />

          {(pack.youtube.titleOptions?.length ?? 0) > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {pack.youtube.titleOptions!.slice(1).map((t) => (
                <button
                  key={t}
                  onClick={() => setField("ytTitle", t)}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-400 transition-colors hover:border-brand-400/50 hover:text-white"
                >
                  {t.length > 46 ? `${t.slice(0, 46)}…` : t}
                </button>
              ))}
            </div>
          )}

          <CopyBox
            label="Description"
            value={field("ytDesc", pack.youtube.body)}
            onChange={(v) => setField("ytDesc", v)}
            max={LIMITS.ytDescription}
            rows={12}
          />
          <CopyBox
            label={`Tags · ${pack.youtube.tags!.join(",").length}/${LIMITS.ytTagsTotal} chars`}
            value={field("ytTags", pack.youtube.tags!.join(", "))}
            onChange={(v) => setField("ytTags", v)}
            max={LIMITS.ytTagsTotal}
            rows={3}
          />
        </div>

        {/* Instagram */}
        <div className="glass space-y-4 rounded-3xl p-5">
          <div className="flex items-center gap-2">
            <Instagram size={16} className="text-pink-400" />
            <h2 className="font-display text-sm font-bold text-white">Instagram</h2>
          </div>
          <CopyBox
            label="Caption"
            value={field("igCaption", pack.instagram.body)}
            onChange={(v) => setField("igCaption", v)}
            max={LIMITS.igCaption}
            rows={8}
          />
          <CopyBox
            label={`First comment · ${pack.instagram.hashtags!.length}/${LIMITS.igHashtags} hashtags`}
            value={field("igTags", pack.instagram.firstComment ?? "")}
            onChange={(v) => setField("igTags", v)}
            max={LIMITS.igCaption}
            rows={3}
          />
          <p className="text-[11px] text-slate-500">
            Hashtags sit in the first comment so the caption reads clean — same reach, better copy.
          </p>
        </div>

        {/* LinkedIn */}
        <div className="glass space-y-4 rounded-3xl p-5">
          <div className="flex items-center gap-2">
            <Linkedin size={16} className="text-sky-400" />
            <h2 className="font-display text-sm font-bold text-white">LinkedIn</h2>
            <span className="ml-auto text-[10px] text-slate-500">
              Insight register · no “link in bio” · {pack.linkedin.hashtags?.length ?? 0}/
              {LIMITS.liHashtags} hashtags
            </span>
          </div>
          <CopyBox
            label="Post"
            value={field("liBody", pack.linkedin.body)}
            onChange={(v) => setField("liBody", v)}
            max={LIMITS.liPost}
            rows={14}
          />
          <div className="flex flex-wrap gap-1.5">
            {pack.linkedin.hashtags?.map((h) => (
              <span key={h} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* Shorts / Reels */}
        <div className="glass space-y-4 rounded-3xl p-5">
          <div className="flex items-center gap-2">
            <Youtube size={16} className="text-amber" />
            <h2 className="font-display text-sm font-bold text-white">Shorts / Reels</h2>
          </div>
          <CopyBox
            label="Title"
            value={field("shTitle", pack.shorts.title ?? "")}
            onChange={(v) => setField("shTitle", v)}
            max={LIMITS.shortsTitle}
            rows={2}
          />
          <CopyBox
            label="Caption"
            value={field("shBody", pack.shorts.body)}
            onChange={(v) => setField("shBody", v)}
            max={400}
            rows={4}
          />
        </div>

        {/* Rollout */}
        <div className="glass rounded-3xl p-5">
          <h2 className="font-display text-sm font-bold text-white">Suggested rollout</h2>
          <ol className="mt-3 space-y-2">
            {pack.schedule.map((slot) => (
              <li key={slot.when} className="flex gap-3 text-[11px]">
                <span className="w-28 shrink-0 font-mono text-slate-500">{slot.when}</span>
                <span className="text-slate-300">{slot.what}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Publishing reality check */}
        <div className="glass rounded-3xl p-5">
          <h2 className="font-display text-sm font-bold text-white">Direct publishing</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
              <p className="flex items-center gap-2 text-xs font-bold text-white">
                <Youtube size={13} className="text-red-400" /> YouTube
                <span
                  className={cx(
                    "ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    publishing.youtube
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-slate-500/10 text-slate-400"
                  )}
                >
                  {publishing.youtube ? "Credentials set" : "Not connected"}
                </span>
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                Needs a Google Cloud OAuth client and a one-time API audit — until Google approves
                it, uploads are forced to <em>private</em>. Each upload costs 1600 of the 10,000
                daily quota units (~6 videos/day).
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
              <p className="flex items-center gap-2 text-xs font-bold text-white">
                <Instagram size={13} className="text-pink-400" /> Instagram
                <span
                  className={cx(
                    "ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    publishing.instagram
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-slate-500/10 text-slate-400"
                  )}
                >
                  {publishing.instagram ? "Credentials set" : "Not connected"}
                </span>
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                Needs a Business/Creator account linked to a Facebook Page, a Meta app with
                <code className="mx-1 text-slate-300">instagram_content_publish</code>, and App
                Review. Media must be fetched by Meta from a public URL.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Until those are approved, use <span className="text-slate-300">Copy</span> or{" "}
            <span className="text-slate-300">Export pack</span> — everything above is already
            formatted to each platform&rsquo;s limits. See{" "}
            <code className="text-slate-400">docs/SOCIAL_PUBLISHING.md</code> for the full setup
            path.
          </p>
        </div>
      </section>
    </div>
  );
}
