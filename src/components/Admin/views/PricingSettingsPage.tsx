import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Globe,
  Palette,
  Share2,
  Key,
  Code,
  Database,
  Save,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Bell,
  Plus,
  Trash2,
  Link2,
} from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, PrimaryButton, GhostButton, Input, Textarea } from '../ui';

type TierId = 'short' | 'long' | 'commercial';

type RateTier = Record<
  TierId,
  { baseline: number; addons: { render4k: number; multiFormat: number; customSound: number } }
>;

type SettingsShape = {
  rates: {
    currency: string;
    tiers: RateTier;
    baselineRate: number;
    addonRates: { render4k: number; multiFormat: number; customSound: number };
  };
  siteIdentity: {
    name: string;
    tagline: string;
    logoUrl: string;
    faviconUrl: string;
    metaDescription: string;
  };
  appearance: {
    primary: string;
    secondary: string;
    accent: string;
    fontPair: string;
    density: 'compact' | 'comfortable';
  };
  social: Array<{ id: string; platform: string; url: string }>;
  integrations: Record<string, unknown>;
  advanced: {
    env: 'staging' | 'production';
    webhookUrl: string;
    customCss: string;
  };
  rateHistory: Array<{ at: string; field: string; from: string; to: string; by: string }>;
};

const DEFAULT_TIERS: RateTier = {
  short: { baseline: 700, addons: { render4k: 100, multiFormat: 150, customSound: 200 } },
  long: { baseline: 1200, addons: { render4k: 200, multiFormat: 250, customSound: 300 } },
  commercial: { baseline: 2500, addons: { render4k: 400, multiFormat: 350, customSound: 500 } },
};

const DEFAULTS: SettingsShape = {
  rates: {
    currency: 'INR',
    tiers: DEFAULT_TIERS,
    baselineRate: 700,
    addonRates: DEFAULT_TIERS.short.addons,
  },
  siteIdentity: {
    name: 'VisionFold Creative',
    tagline: 'Premium short-form & brand films',
    logoUrl: '',
    faviconUrl: '',
    metaDescription: 'Retention-first video editing studio in India.',
  },
  appearance: {
    primary: '#D4AF37',
    secondary: '#0A0A0B',
    accent: '#E8B923',
    fontPair: 'Inter / system-ui',
    density: 'comfortable',
  },
  social: [
    { id: '1', platform: 'Instagram', url: 'https://instagram.com/' },
    { id: '2', platform: 'YouTube', url: 'https://youtube.com/' },
  ],
  integrations: {},
  advanced: { env: 'production', webhookUrl: '', customCss: '' },
  rateHistory: [],
};

const TABS = [
  { id: 'identity', label: 'Site Identity', icon: Globe },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'social', label: 'Social Links', icon: Share2 },
  { id: 'integrations', label: 'Integrations', icon: Key },
  { id: 'advanced', label: 'Advanced', icon: Code },
  { id: 'system', label: 'System', icon: Database },
] as const;

type TabId = (typeof TABS)[number]['id'];

function money(n: number, currency: string) {
  if (currency === 'USD') return `$${n}`;
  if (currency === 'EUR') return `€${n}`;
  return `₹${n}`;
}

function MoneyInput({
  value,
  onChange,
  currency,
  onReset,
}: {
  value: number;
  onChange: (n: number) => void;
  currency: string;
  onReset?: () => void;
}) {
  const prefix = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3 z-10 text-sm text-[#666]">{prefix}</span>
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
        className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-8 pr-10 text-sm text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
      />
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="absolute right-2 rounded p-1 text-[#666] hover:text-[#D4AF37]"
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export const PricingSettingsPage: React.FC = () => {
  const [data, setData] = useState<SettingsShape>(DEFAULTS);
  const [saved, setSaved] = useState<SettingsShape>(DEFAULTS);
  const [tier, setTier] = useState<TierId>('short');
  const [tab, setTab] = useState<TabId>('identity');
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aiOk, setAiOk] = useState(false);
  const [dbOk, setDbOk] = useState(false);

  const showToast = (type: 'ok' | 'err' | 'warn', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const s = await adminApi.get<any>('/api/settings');
      const shortBaseline = Number(s?.rates?.baselineRate ?? s?.rates?.tiers?.short?.baseline ?? 700);
      const shortAddons = s?.rates?.addonRates || s?.rates?.tiers?.short?.addons || DEFAULT_TIERS.short.addons;

      const merged: SettingsShape = {
        ...DEFAULTS,
        rates: {
          currency: s?.rates?.currency || 'INR',
          tiers: {
            short: {
              baseline: shortBaseline,
              addons: {
                render4k: Number(shortAddons.render4k ?? 100),
                multiFormat: Number(shortAddons.multiFormat ?? 150),
                customSound: Number(shortAddons.customSound ?? 200),
              },
            },
            long: s?.rates?.tiers?.long || DEFAULT_TIERS.long,
            commercial: s?.rates?.tiers?.commercial || DEFAULT_TIERS.commercial,
          },
          baselineRate: shortBaseline,
          addonRates: {
            render4k: Number(shortAddons.render4k ?? 100),
            multiFormat: Number(shortAddons.multiFormat ?? 150),
            customSound: Number(shortAddons.customSound ?? 200),
          },
        },
        siteIdentity: {
          name: s?.siteIdentity?.name || s?.siteIdentity?.siteTitle || DEFAULTS.siteIdentity.name,
          tagline: s?.siteIdentity?.tagline || DEFAULTS.siteIdentity.tagline,
          logoUrl: s?.siteIdentity?.logoUrl || s?.theme?.logoUrl || '',
          faviconUrl: s?.siteIdentity?.faviconUrl || s?.theme?.faviconUrl || '',
          metaDescription:
            s?.siteIdentity?.metaDescription ||
            s?.advanced?.metaDescription ||
            DEFAULTS.siteIdentity.metaDescription,
        },
        appearance: {
          primary: s?.appearance?.primary || s?.theme?.accent || '#D4AF37',
          secondary: s?.appearance?.secondary || s?.theme?.background || '#0A0A0B',
          accent: s?.appearance?.accent || s?.theme?.accent || '#E8B923',
          fontPair: s?.appearance?.fontPair || 'Inter / system-ui',
          density: s?.appearance?.density === 'compact' ? 'compact' : 'comfortable',
        },
        social: Array.isArray(s?.social) && s.social.length ? s.social : DEFAULTS.social,
        integrations: s?.integrations || {},
        advanced: {
          env: s?.advanced?.env === 'staging' ? 'staging' : 'production',
          webhookUrl: s?.advanced?.webhookUrl || '',
          customCss: s?.advanced?.customCss || s?.advanced?.customCSS || '',
        },
        rateHistory: Array.isArray(s?.rateHistory) ? s.rateHistory : [],
      };

      setData(merged);
      setSaved(JSON.parse(JSON.stringify(merged)));

      try {
        const h = await adminApi.get<any>('/api/health');
        setAiOk(Boolean(h?.checks?.ai && h.checks.ai !== 'not_configured'));
        setDbOk(h?.checks?.database === 'ok' || h?.checks?.storage === 'supabase');
      } catch {
        /* */
      }
    } catch (e: any) {
      setLoadError(e?.message || 'Could not load /api/settings — sign in again as admin');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(saved), [data, saved]);
  const currentTier = data.rates.tiers[tier];

  const calcTotal = useMemo(() => {
    let t = currentTier.baseline * Math.max(1, calc.minutes);
    if (calc.render4k) t += currentTier.addons.render4k;
    if (calc.multiFormat) t += currentTier.addons.multiFormat;
    if (calc.customSound) t += currentTier.addons.customSound;
    return t;
  }, [currentTier, calc]);

  const updateTier = (patch: Partial<typeof currentTier>) => {
    setData((d) => {
      const nextTier = { ...d.rates.tiers[tier], ...patch, addons: { ...d.rates.tiers[tier].addons, ...(patch.addons || {}) } };
      const tiers = { ...d.rates.tiers, [tier]: nextTier };
      return {
        ...d,
        rates: {
          ...d.rates,
          tiers,
          baselineRate: tiers.short.baseline,
          addonRates: tiers.short.addons,
        },
      };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      // Merge onto latest server settings so we never wipe unrelated keys
      const server = await adminApi.get<any>('/api/settings').catch(() => ({}));
      const history = [...(data.rateHistory || [])];
      const prev = saved.rates.tiers[tier];
      const next = data.rates.tiers[tier];
      if (prev.baseline !== next.baseline) {
        history.unshift({
          at: new Date().toISOString(),
          field: `${tier} baseline`,
          from: String(prev.baseline),
          to: String(next.baseline),
          by: 'Admin',
        });
      }

      const payload = {
        ...server,
        ...data,
        rateHistory: history.slice(0, 20),
        rates: {
          ...(server.rates || {}),
          ...data.rates,
          baselineRate: data.rates.tiers.short.baseline,
          addonRates: data.rates.tiers.short.addons,
          tiers: data.rates.tiers,
          currency: data.rates.currency,
        },
        siteIdentity: data.siteIdentity,
        appearance: data.appearance,
        social: data.social,
        advanced: data.advanced,
        theme: {
          ...(server.theme || {}),
          accent: data.appearance.primary,
          background: data.appearance.secondary,
          text: '#EDEDED',
          logoUrl: data.siteIdentity.logoUrl,
          faviconUrl: data.siteIdentity.faviconUrl,
        },
      };

      const result = await adminApi.put<any>('/api/settings', payload);
      const confirmed = { ...data, rateHistory: history.slice(0, 20) };
      setData(confirmed);
      setSaved(JSON.parse(JSON.stringify(confirmed)));
      showToast('ok', `Saved ${new Date().toLocaleTimeString()} — rates ${result?.rates?.baselineRate ?? data.rates.baselineRate}/min`);
    } catch (e: any) {
      showToast(
        'err',
        e?.message || 'Save failed. Confirm settings.data SQL + admin login + redeploy.'
      );
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setData(JSON.parse(JSON.stringify(saved)));
    showToast('warn', 'Discarded');
  };

  const metaLen = data.siteIdentity.metaDescription.length;

  // Live preview block — shared top (mobile) + sticky side (desktop)
  const Preview = (
    <div
      className="overflow-hidden rounded-2xl border border-white/10"
      style={{ background: data.appearance.secondary, color: '#EDEDED' }}
    >
      <div className="border-b border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#8A857C]">
        Live preview · updates as you type
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-black text-black"
            style={{ background: data.appearance.primary }}
          >
            VF
          </div>
          <div>
            <p className="text-sm font-bold">{data.siteIdentity.name || 'Site name'}</p>
            <p className="text-[10px] opacity-60">{data.siteIdentity.tagline || 'Tagline'}</p>
          </div>
        </div>
        <p className="text-xs opacity-70">{data.siteIdentity.metaDescription || 'Meta description…'}</p>
        <div
          className="mt-4 rounded-xl p-4"
          style={{ border: `1px solid ${data.appearance.primary}55` }}
        >
          <p className="text-[10px] uppercase tracking-wider" style={{ color: data.appearance.primary }}>
            Services
          </p>
          <p className="mt-1 text-xl font-black">
            Starting at {money(data.rates.tiers.short.baseline, data.rates.currency)}/min
          </p>
          <div
            className="mt-3 inline-block rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-black"
            style={{ background: data.appearance.primary }}
          >
            Get a quote
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {[data.appearance.primary, data.appearance.secondary, data.appearance.accent].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setTab('appearance')}
              className="h-8 w-8 rounded-full border border-white/20"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#8A857C]">Loading settings…</p>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative pb-28">
      <div className="mb-2 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
        Pricing & Settings · redesigned UI (if you still see the old tabs-only page, hard-refresh or Redeploy on Vercel)
      </div>

      {loadError ? (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>{loadError}</p>
            <button type="button" className="mt-2 underline" onClick={() => void load()}>
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Pricing & Settings</h2>
          <p className="text-xs text-[#8A857C]">Settings / {TABS.find((t) => t.id === tab)?.label}</p>
        </div>
        <PrimaryButton type="button" onClick={() => void save()} disabled={saving || !dirty}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save now
        </PrimaryButton>
      </div>

      {/* Preview always on top on small screens */}
      <div className="mb-6 xl:hidden">{Preview}</div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="mx-auto w-full max-w-[900px] space-y-8">
          <Card className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Pricing rates</h3>
                <p className="text-sm text-[#8A857C]">Used on services page and proposals</p>
              </div>
              <select
                value={data.rates.currency}
                onChange={(e) => setData((d) => ({ ...d, rates: { ...d.rates, currency: e.target.value } }))}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white"
              >
                <option value="INR">INR ₹</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['short', 'Short-form'],
                  ['long', 'Long-form'],
                  ['commercial', 'Commercial'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTier(id)}
                  className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    tier === id ? 'bg-[#D4AF37] text-black' : 'border border-white/10 text-[#8A857C]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#8A857C]">Base rate / min</label>
              <div className="mt-2 max-w-xs">
                <MoneyInput
                  value={currentTier.baseline}
                  currency={data.rates.currency}
                  onChange={(n) => updateTier({ baseline: n })}
                  onReset={() => updateTier({ baseline: saved.rates.tiers[tier].baseline })}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8A857C]">Add-ons</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ['render4k', '4K render', 'per video'],
                    ['multiFormat', 'Multi-format', 'per package'],
                    ['customSound', 'Custom sound', 'per track'],
                  ] as const
                ).map(([key, label, unit]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-xs text-[#B8B3AA]">
                      <span>{label}</span>
                      <span className="text-[#555]">{unit}</span>
                    </div>
                    <MoneyInput
                      value={currentTier.addons[key]}
                      currency={data.rates.currency}
                      onChange={(n) => updateTier({ addons: { ...currentTier.addons, [key]: n } })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Quote calculator</p>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                <label className="text-xs text-[#8A857C]">
                  Minutes
                  <Input
                    type="number"
                    min={1}
                    className="mt-1 w-24"
                    value={calc.minutes}
                    onChange={(e) => setCalc((c) => ({ ...c, minutes: Math.max(1, Number(e.target.value) || 1) }))}
                  />
                </label>
                {(
                  [
                    ['render4k', '4K'],
                    ['multiFormat', 'Multi'],
                    ['customSound', 'Sound'],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-xs text-[#B8B3AA]">
                    <input
                      type="checkbox"
                      checked={calc[k]}
                      onChange={(e) => setCalc((c) => ({ ...c, [k]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
                <div className="ml-auto text-right">
                  <p className="text-[10px] uppercase text-[#8A857C]">Total</p>
                  <p className="text-2xl font-black text-white">{money(calcTotal, data.rates.currency)}</p>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setHistoryOpen((v) => !v)} className="text-xs text-[#8A857C] underline">
              {historyOpen ? 'Hide' : 'Show'} rate history
            </button>
            {historyOpen ? (
              <ul className="max-h-36 space-y-1 overflow-y-auto text-xs text-[#8A857C]">
                {data.rateHistory.length === 0 ? (
                  <li>No history yet</li>
                ) : (
                  data.rateHistory.slice(0, 5).map((h, i) => (
                    <li key={i}>
                      {new Date(h.at).toLocaleString()} · {h.field}: {h.from} → {h.to}
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </Card>

          <div className="flex flex-wrap gap-1 rounded-full border border-white/10 bg-black/30 p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
                    tab === t.id ? 'bg-[#D4AF37] text-black' : 'text-[#8A857C]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          <Card className="p-6">
            {tab === 'identity' && (
              <div className="space-y-4">
                <label className="block text-xs text-[#8A857C]">
                  Site name
                  <Input
                    className="mt-1"
                    value={data.siteIdentity.name}
                    onChange={(e) =>
                      setData((d) => ({ ...d, siteIdentity: { ...d.siteIdentity, name: e.target.value } }))
                    }
                  />
                </label>
                <label className="block text-xs text-[#8A857C]">
                  Tagline
                  <Input
                    className="mt-1"
                    value={data.siteIdentity.tagline}
                    onChange={(e) =>
                      setData((d) => ({ ...d, siteIdentity: { ...d.siteIdentity, tagline: e.target.value } }))
                    }
                  />
                </label>
                <label className="block text-xs text-[#8A857C]">
                  Meta description
                  <Textarea
                    className="mt-1 min-h-24"
                    value={data.siteIdentity.metaDescription}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        siteIdentity: { ...d.siteIdentity, metaDescription: e.target.value },
                      }))
                    }
                  />
                  <span className={`text-xs ${metaLen > 160 ? 'text-red-400' : 'text-[#8A857C]'}`}>
                    {metaLen}/160
                  </span>
                </label>
              </div>
            )}

            {tab === 'appearance' && (
              <div className="space-y-4">
                {(['primary', 'secondary', 'accent'] as const).map((key) => (
                  <label key={key} className="block text-xs text-[#8A857C]">
                    {key}
                    <div className="mt-1 flex gap-2">
                      <input
                        type="color"
                        value={data.appearance[key]}
                        onChange={(e) =>
                          setData((d) => ({
                            ...d,
                            appearance: { ...d.appearance, [key]: e.target.value },
                          }))
                        }
                        className="h-10 w-12 rounded border border-white/10 bg-transparent"
                      />
                      <Input
                        value={data.appearance[key]}
                        onChange={(e) =>
                          setData((d) => ({
                            ...d,
                            appearance: { ...d.appearance, [key]: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </label>
                ))}
              </div>
            )}

            {tab === 'social' && (
              <div className="space-y-3">
                {data.social.map((row, i) => (
                  <div key={row.id} className="flex flex-wrap gap-2">
                    <Input
                      className="w-28"
                      value={row.platform}
                      onChange={(e) => {
                        const social = [...data.social];
                        social[i] = { ...row, platform: e.target.value };
                        setData((d) => ({ ...d, social }));
                      }}
                    />
                    <Input
                      className="min-w-[180px] flex-1"
                      value={row.url}
                      onChange={(e) => {
                        const social = [...data.social];
                        social[i] = { ...row, url: e.target.value };
                        setData((d) => ({ ...d, social }));
                      }}
                    />
                    <button
                      type="button"
                      className="p-2 text-red-400"
                      onClick={() => setData((d) => ({ ...d, social: d.social.filter((s) => s.id !== row.id) }))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <GhostButton
                  type="button"
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      social: [...d.social, { id: String(Date.now()), platform: 'Link', url: 'https://' }],
                    }))
                  }
                >
                  <Plus className="h-4 w-4" /> Add
                </GhostButton>
              </div>
            )}

            {tab === 'integrations' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">Supabase</p>
                    <span className={`h-2.5 w-2.5 rounded-full ${dbOk ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  </div>
                  <p className="mt-2 text-xs text-[#8A857C]">{dbOk ? 'Connected' : 'Check env vars'}</p>
                </div>
                <div className="rounded-xl border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">NVIDIA AI</p>
                    <span className={`h-2.5 w-2.5 rounded-full ${aiOk ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </div>
                  <p className="mt-2 text-xs text-[#8A857C]">{aiOk ? 'Configured' : 'Set NVIDIA_API_KEY'}</p>
                </div>
              </div>
            )}

            {tab === 'advanced' && (
              <div className="space-y-4">
                <label className="block text-xs text-[#8A857C]">
                  Webhook URL
                  <div className="mt-1 flex gap-2">
                    <Input
                      value={data.advanced.webhookUrl}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          advanced: { ...d.advanced, webhookUrl: e.target.value },
                        }))
                      }
                    />
                    <GhostButton type="button" onClick={() => showToast('warn', 'Ping needs a live URL')}>
                      <Link2 className="h-4 w-4" /> Test
                    </GhostButton>
                  </div>
                </label>
                <label className="block text-xs text-[#8A857C]">
                  Custom CSS
                  <textarea
                    className="mt-1 min-h-28 w-full rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-xs text-white"
                    value={data.advanced.customCss}
                    onChange={(e) =>
                      setData((d) => ({
                        ...d,
                        advanced: { ...d.advanced, customCss: e.target.value },
                      }))
                    }
                  />
                </label>
              </div>
            )}

            {tab === 'system' && (
              <div className="space-y-3 text-sm text-[#B8B3AA]">
                <p>Use <strong className="text-white">Media</strong> for uploads and <strong className="text-white">Frame Review</strong> for client notes on cuts.</p>
                <PrimaryButton
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `visionfold-settings.json`;
                    a.click();
                  }}
                >
                  Export JSON
                </PrimaryButton>
              </div>
            )}
          </Card>
        </div>

        <aside className="hidden xl:block xl:sticky xl:top-6 xl:self-start">{Preview}</aside>
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
