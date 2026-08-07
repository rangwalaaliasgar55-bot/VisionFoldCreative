import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, PrimaryButton, GhostButton } from '../ui';

type AddonRates = { render4k: number; multiFormat: number; customSound: number };

type FormState = {
  baselineRate: number;
  addonRates: AddonRates;
  currency: string;
  siteName: string;
  tagline: string;
  metaDescription: string;
  accent: string;
  background: string;
};

const DEFAULTS: FormState = {
  baselineRate: 700,
  addonRates: { render4k: 100, multiFormat: 150, customSound: 200 },
  currency: 'INR',
  siteName: 'VisionFold Creative',
  tagline: 'Premium short-form & brand films',
  metaDescription: 'Retention-first video editing studio in India.',
  accent: '#D4AF37',
  background: '#0A0A0B',
};

function money(n: number, currency: string) {
  if (currency === 'USD') return `$${n}`;
  if (currency === 'EUR') return `€${n}`;
  return `₹${n}`;
}

function MoneyField({
  label,
  value,
  onChange,
  currency,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  currency: string;
  hint?: string;
}) {
  const prefix = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-[#B8B3AA]">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#666]">
          {prefix}
        </span>
        <input
          type="number"
          min={0}
          step={1}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n) || n < 0) return;
            onChange(Math.floor(n));
          }}
          className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pl-8 pr-3 text-sm text-white outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/40"
        />
      </div>
      {hint ? <span className="text-[10px] text-[#666]">{hint}</span> : null}
    </label>
  );
}

export const PricingSettingsPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [saved, setSaved] = useState<FormState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState<{ type: 'ok' | 'err' | 'warn'; text: string } | null>(null);
  const [calc, setCalc] = useState({
    minutes: 1,
    render4k: false,
    multiFormat: false,
    customSound: false,
  });

  const showToast = (type: 'ok' | 'err' | 'warn', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const s = await adminApi.get<any>('/api/settings');
      const rates = s?.rates || {};
      const addons = rates.addonRates || rates.addons || DEFAULTS.addonRates;
      const identity = s?.siteIdentity || {};
      const theme = s?.theme || {};
      const appearance = s?.appearance || {};
      const next: FormState = {
        baselineRate: Number(rates.baselineRate ?? rates.baseline ?? DEFAULTS.baselineRate) || 700,
        addonRates: {
          render4k: Number(addons.render4k ?? 100) || 0,
          multiFormat: Number(addons.multiFormat ?? 150) || 0,
          customSound: Number(addons.customSound ?? 200) || 0,
        },
        currency: rates.currency === 'USD' || rates.currency === 'EUR' ? rates.currency : 'INR',
        siteName: String(identity.name || identity.siteTitle || s?.siteName || DEFAULTS.siteName),
        tagline: String(identity.tagline || s?.tagline || DEFAULTS.tagline),
        metaDescription: String(
          identity.metaDescription || s?.advanced?.metaDescription || DEFAULTS.metaDescription
        ),
        accent: String(appearance.primary || theme.accent || DEFAULTS.accent),
        background: String(appearance.secondary || theme.background || DEFAULTS.background),
      };
      setForm(next);
      setSaved(JSON.parse(JSON.stringify(next)));
    } catch (e: any) {
      setLoadError(e?.message || 'Could not load settings. Sign out and sign in as admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  const calcTotal = useMemo(() => {
    let t = form.baselineRate * Math.max(1, calc.minutes);
    if (calc.render4k) t += form.addonRates.render4k;
    if (calc.multiFormat) t += form.addonRates.multiFormat;
    if (calc.customSound) t += form.addonRates.customSound;
    return t;
  }, [form, calc]);

  const save = async () => {
    if (form.baselineRate < 0) {
      showToast('err', 'Baseline rate cannot be negative');
      return;
    }
    setSaving(true);
    try {
      const server = await adminApi.get<any>('/api/settings').catch(() => ({}));
      const payload = {
        ...server,
        rates: {
          ...(server.rates || {}),
          baselineRate: form.baselineRate,
          addonRates: form.addonRates,
          currency: form.currency,
        },
        siteIdentity: {
          ...(server.siteIdentity || {}),
          name: form.siteName,
          siteTitle: form.siteName,
          tagline: form.tagline,
          metaDescription: form.metaDescription,
        },
        appearance: {
          ...(server.appearance || {}),
          primary: form.accent,
          secondary: form.background,
          accent: form.accent,
        },
        theme: {
          ...(server.theme || {}),
          accent: form.accent,
          background: form.background,
          text: '#EDEDED',
        },
      };
      const result = await adminApi.put<any>('/api/settings', payload);
      const confirmed = { ...form };
      setForm(confirmed);
      setSaved(JSON.parse(JSON.stringify(confirmed)));
      const rate = result?.rates?.baselineRate ?? form.baselineRate;
      showToast('ok', `Saved · baseline ${money(Number(rate) || form.baselineRate, form.currency)}/min`);
    } catch (e: any) {
      showToast('err', e?.message || 'Save failed. Check admin session + Supabase settings.data SQL.');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setForm(JSON.parse(JSON.stringify(saved)));
    showToast('warn', 'Changes discarded');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#8A857C]">Loading settings…</p>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl space-y-6 pb-28">
      <div className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2.5 text-xs text-[#D4AF37]">
        Pricing & Settings · live preview · durable save
      </div>

      {loadError ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>{loadError}</p>
            <button type="button" className="mt-2 underline" onClick={() => void load()}>
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Pricing & Settings</h2>
          <p className="text-xs text-[#8A857C]">Rates, identity, colors — preview updates as you type</p>
        </div>
        <div className="flex gap-2">
          {dirty ? (
            <GhostButton type="button" onClick={discard}>
              <RotateCcw className="h-4 w-4" /> Discard
            </GhostButton>
          ) : null}
          <PrimaryButton type="button" onClick={() => void save()} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </PrimaryButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card className="space-y-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Pricing rates</h3>
                <p className="text-xs text-[#8A857C]">Used on services page and proposal drafts</p>
              </div>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white"
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>

            <MoneyField
              label="Base rate (per minute)"
              value={form.baselineRate}
              currency={form.currency}
              onChange={(n) => setForm((f) => ({ ...f, baselineRate: n }))}
              hint="Main short-form rate shown on the public site"
            />

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#666]">Add-ons</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <MoneyField
                  label="4K render"
                  value={form.addonRates.render4k}
                  currency={form.currency}
                  onChange={(n) =>
                    setForm((f) => ({ ...f, addonRates: { ...f.addonRates, render4k: n } }))
                  }
                  hint="per video"
                />
                <MoneyField
                  label="Multi-format"
                  value={form.addonRates.multiFormat}
                  currency={form.currency}
                  onChange={(n) =>
                    setForm((f) => ({ ...f, addonRates: { ...f.addonRates, multiFormat: n } }))
                  }
                  hint="per delivery set"
                />
                <MoneyField
                  label="Custom sound"
                  value={form.addonRates.customSound}
                  currency={form.currency}
                  onChange={(n) =>
                    setForm((f) => ({ ...f, addonRates: { ...f.addonRates, customSound: n } }))
                  }
                  hint="per track"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Quote calculator
              </p>
              <div className="flex flex-wrap items-end gap-4">
                <label className="block space-y-1">
                  <span className="text-[10px] text-[#888]">Minutes</span>
                  <input
                    type="number"
                    min={1}
                    value={calc.minutes}
                    onChange={(e) =>
                      setCalc((c) => ({ ...c, minutes: Math.max(1, Math.floor(Number(e.target.value) || 1)) }))
                    }
                    className="w-20 rounded-lg border border-white/10 bg-black/50 px-2 py-2 text-sm text-white"
                  />
                </label>
                {(
                  [
                    ['render4k', '4K'],
                    ['multiFormat', 'Multi-format'],
                    ['customSound', 'Sound'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-xs text-[#B8B3AA]">
                    <input
                      type="checkbox"
                      checked={calc[key]}
                      onChange={(e) => setCalc((c) => ({ ...c, [key]: e.target.checked }))}
                      className="rounded border-white/20"
                    />
                    {label}
                  </label>
                ))}
                <p className="ml-auto text-lg font-black text-white">
                  {money(calcTotal, form.currency)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <h3 className="text-base font-bold text-white">Site identity</h3>
            <label className="block space-y-1.5">
              <span className="text-xs text-[#B8B3AA]">Site name</span>
              <input
                value={form.siteName}
                onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-[#B8B3AA]">Tagline</span>
              <input
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-[#B8B3AA]">
                Meta description ({form.metaDescription.length}/160)
              </span>
              <textarea
                value={form.metaDescription}
                onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value.slice(0, 200) }))}
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs text-[#B8B3AA]">Accent color</span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.accent}
                    onChange={(e) => setForm((f) => ({ ...f, accent: e.target.value }))}
                    className="h-10 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
                  />
                  <input
                    value={form.accent}
                    onChange={(e) => setForm((f) => ({ ...f, accent: e.target.value }))}
                    className="flex-1 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
                  />
                </div>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs text-[#B8B3AA]">Background</span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.background}
                    onChange={(e) => setForm((f) => ({ ...f, background: e.target.value }))}
                    className="h-10 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
                  />
                  <input
                    value={form.background}
                    onChange={(e) => setForm((f) => ({ ...f, background: e.target.value }))}
                    className="flex-1 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
                  />
                </div>
              </label>
            </div>
          </Card>
        </div>

        <aside className="order-first space-y-4 lg:order-none lg:sticky lg:top-6 lg:self-start">
          <div
            className="overflow-hidden rounded-2xl border border-white/10 shadow-xl"
            style={{ background: form.background, color: '#EDEDED' }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#888]">Live preview</span>
              {dirty ? (
                <span className="text-[10px] text-amber-300">unsaved</span>
              ) : (
                <span className="text-[10px] text-emerald-400">synced</span>
              )}
            </div>
            <div className="p-4">
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-black text-black"
                  style={{ background: form.accent }}
                >
                  VF
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{form.siteName || 'Site name'}</p>
                  <p className="truncate text-[10px] opacity-60">{form.tagline || 'Tagline'}</p>
                </div>
              </div>
              <p className="line-clamp-3 text-xs opacity-70">{form.metaDescription || 'Meta…'}</p>
              <div className="mt-4 rounded-xl p-4" style={{ border: `1px solid ${form.accent}55` }}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: form.accent }}>
                  Services
                </p>
                <p className="mt-1 text-xl font-black">
                  Starting at {money(form.baselineRate, form.currency)}/min
                </p>
                <div
                  className="mt-3 inline-block rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-black"
                  style={{ background: form.accent }}
                >
                  Get a quote
                </div>
              </div>
              <p className="mt-3 text-[10px] text-[#666]">Calc total: {money(calcTotal, form.currency)}</p>
            </div>
          </div>
          <p className="text-[10px] text-[#666]">Preview updates as you type. Click Save to persist.</p>
        </aside>
      </div>

      {dirty ? (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#D4AF37]/40 bg-black/95 px-4 py-2 shadow-2xl">
          <AlertCircle className="h-4 w-4 text-amber-300" />
          <span className="text-xs text-white">Unsaved changes</span>
          <GhostButton type="button" onClick={discard}>
            Discard
          </GhostButton>
          <PrimaryButton type="button" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </PrimaryButton>
        </div>
      ) : null}

      {toast ? (
        <div
          className={`fixed right-4 top-4 z-50 flex max-w-sm items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            toast.type === 'ok'
              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
              : toast.type === 'err'
                ? 'border-red-500/40 bg-red-500/15 text-red-100'
                : 'border-amber-500/40 bg-amber-500/15 text-amber-100'
          }`}
        >
          {toast.type === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.text}
        </div>
      ) : null}
    </div>
  );
};

export default PricingSettingsPage;
