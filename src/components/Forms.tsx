"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, LogOut, Send } from "lucide-react";

export function LoginForm({
  role,
  next,
}: {
  role: "admin" | "client";
  next?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Login failed");
        setLoading(false);
        return;
      }
      window.location.href = next || (role === "admin" ? "/admin" : "/portal");
    } catch {
      setError("Network error — try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" className="field" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="field" />
      </div>
      <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7357FF] hover:bg-[#6346E8] py-3 text-sm font-semibold text-white shadow-lg shadow-[#7357FF]/30 transition-transform hover:scale-[1.02] disabled:opacity-60">
        {loading ? <Loader2 className="animate-spin" size={16} /> : null}
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function ClientRegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }
      window.location.href = "/portal";
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <input required minLength={2} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" className="field col-span-2" autoComplete="name" />
        <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email" className="field col-span-2" autoComplete="email" />
        <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Company" className="field" autoComplete="organization" />
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone" className="field" autoComplete="tel" />
        <input required minLength={8} maxLength={128} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Password · 8+ characters" className="field col-span-2" autoComplete="new-password" />
        <input required minLength={8} maxLength={128} type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} placeholder="Confirm password" className="field col-span-2" autoComplete="new-password" />
      </div>
      <label className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500"><input required type="checkbox" className="mt-0.5 accent-brand-500" />I agree to use the portal for legitimate project collaboration and accept the site policies.</label>
      <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7357FF] py-3 text-sm font-semibold text-white shadow-lg shadow-[#7357FF]/30 transition hover:bg-[#6346E8] disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={16} />}{loading ? "Creating workspace…" : "Create client workspace"}</button>
    </form>
  );
}

export function LogoutButton({ label = "Sign out" }: { label?: string }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <button onClick={logout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
      <LogOut size={15} />
      {label}
    </button>
  );
}

const SERVICES = ["Brand Film", "YouTube Editing", "Commercials", "Music Video", "Wedding / Event", "Podcast Editing", "Other"];
const BUDGETS = ["Under $1k", "$1k–$2k", "$2k–$4k", "$4k–$8k", "$8k+"];

/** Quote-builder ids -> the labels this form actually offers. */
const SERVICE_FROM_QUERY: Record<string, string> = {
  short: "Other",
  brand: "Brand Film",
  youtube: "YouTube Editing",
  commercial: "Commercials",
  music: "Music Video",
  podcast: "Podcast Editing",
  wedding: "Wedding / Event",
};

export function ContactForm() {
  // Derived at first render (no effect, no state sync): a spec built in the
  // quote calculator arrives as query params and lands straight in the brief.
  const params = useSearchParams();

  const [form, setForm] = useState(() => {
    const base = {
      name: "",
      email: "",
      phone: "",
      service: SERVICES[0],
      budget: BUDGETS[2],
      message: "",
    };
    const service = params.get("service");
    const mapped = service
      ? SERVICE_FROM_QUERY[service] || (SERVICES.includes(service) ? service : "")
      : "";

    const spec: string[] = [];
    const videos = params.get("videos");
    const hours = params.get("hours");
    if (videos) spec.push(`${videos} deliverable ${Number(videos) === 1 ? "video" : "videos"}`);
    if (hours) spec.push(`~${hours} hrs of raw footage`);
    if (params.get("gfx") === "1") spec.push("custom 2D/3D motion graphics");
    if (params.get("rush") === "1") spec.push("priority 48-hour delivery");

    return {
      ...base,
      service: mapped || base.service,
      message: spec.length ? `Project spec from the quote builder:\n· ${spec.join("\n· ")}\n\n` : "",
    };
  });
  const prefilled = Boolean(params.get("service") || params.get("videos"));
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      // Attribution: where this brief actually came from. Read at submit time
      // so a campaign link is captured even if they browsed around first.
      const attribution = {
        utmSource: params.get("utm_source") || undefined,
        utmMedium: params.get("utm_medium") || undefined,
        utmCampaign: params.get("utm_campaign") || undefined,
        referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        landing: typeof window !== "undefined" ? window.location.pathname : undefined,
      };
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, attribution }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="glass-bright rounded-3xl p-10 text-center">
        <CheckCircle2 className="mx-auto text-emerald-400" size={44} />
        <h3 className="font-display mt-4 text-2xl font-bold text-white">Brief received 🎬</h3>
        <p className="mt-2 text-sm text-slate-400">Thanks, {form.name.split(" ")[0] || "friend"} — our team reviews every brief and replies within 24 hours with next steps and a quote.</p>
        <button onClick={() => setStatus("idle")} className="mt-6 rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-brand-400 hover:text-white">Send another brief</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-bright space-y-4 rounded-3xl p-6 sm:p-8">
      {prefilled && (
        <p className="rounded-2xl border border-brand-400/25 bg-brand-500/10 px-4 py-3 text-xs text-brand-200">
          We carried your quote-builder spec across — edit anything below before sending.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Name *</label>
          <input required className="field" placeholder="Jordan Reyes" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Email *</label>
          <input required type="email" className="field" placeholder="you@brand.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Phone</label>
          <input className="field" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Service</label>
          <select className="field" value={form.service} onChange={(e) => set("service", e.target.value)}>{SERVICES.map((s) => (<option key={s}>{s}</option>))}</select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Budget</label>
        <div className="flex flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <button key={b} type="button" onClick={() => set("budget", b)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${form.budget === b ? "bg-brand-600 text-white shadow-[0_0_20px_-6px_rgba(139,92,246,0.9)]" : "glass text-slate-300 hover:text-white"}`}>{b}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Tell us about the project *</label>
        <textarea required rows={4} className="field resize-none" placeholder="What are you making? Timeline, footage, references — anything helps." value={form.message} onChange={(e) => set("message", e.target.value)} />
      </div>
      <button type="submit" disabled={status === "loading"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7357FF] hover:bg-[#6346E8] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#7357FF]/30 transition-transform hover:scale-[1.01] disabled:opacity-60">
        {status === "loading" ? <Loader2 className="animate-spin" size={16} /> : <Send size={15} />}
        {status === "loading" ? "Sending…" : "Send brief — get a quote in 24h"}
      </button>
      {status === "error" && <p className="text-center text-sm text-red-400">Something went wrong — please email us directly.</p>}
    </form>
  );
}

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "err">("idle");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/public/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setState(res.ok ? "done" : "err");
    } catch {
      setState("err");
    }
  }
  if (state === "done") return <p className="text-sm font-medium text-emerald-400">You&apos;re in! First cut lands in your inbox soon. ✂️</p>;
  return (
    <form onSubmit={submit} className={`flex gap-2 ${compact ? "" : "mt-3"}`}>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="field flex-1" />
      <button type="submit" disabled={state === "loading"} className="shrink-0 rounded-xl bg-[#7357FF] hover:bg-[#6346E8] px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60">{state === "loading" ? "…" : "Join"}</button>
    </form>
  );
}
