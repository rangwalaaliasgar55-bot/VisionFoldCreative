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
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Link2,
  Bell,
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
  integrations: {
    stripeKey: string;
    resendKey: string;
    nvidiaKeySet: boolean;
    supabaseSet: boolean;
  };
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
  integrations: {
    stripeKey: '',
    resendKey: '',
    nvidiaKeySet: false,
    supabaseSet: false,
  },
  advanced: {
    env: 'production',
    webhookUrl: '',
    customCss: '',
  },
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

function symbol(n: number, currency: string) {
  if (currency === 'USD') return `$${n}`;
  if (currency === 'EUR') return `€${n}`;
  return `₹${n}`;
}

function MoneyInput({
  value,
  onChange,
  currency,
  invalid,
  onReset,
}: {
  value: number;
  onChange: (n: number) => void;
  currency: string;
  invalid?: boolean;
  onReset?: () => void;
}) {
  const prefix = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
  return (
    <div className="relative flex items-center gap-1">
      <span className="pointer-events-none absolute left-3 text-sm text-[#666]">{prefix}</span>
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
        className={`w-full rounded-lg border bg-black/40 py-2 pl-8 pr-10 text-sm text-white outline-none focus:ring-2 focus:ring-[#D4AF37]/40 ${
          invalid ? 'border-red-500/60' : 'border-white/10'
        }`}
      />
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="absolute right-2 rounded p-1 text-[#666] hover:text-[#D4AF37]"
          title="Reset field"
          aria-label="Reset to last saved"
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
  const [toast, setToast] = useState<{ type: 'ok' | 'err' | 'warn'; text: string } | null>(null);
  const [calc, setCalc] = useState({ minutes: 1, render4k: false, multiFormat: false, customSound: false });
  const [showKeys, setShowKeys] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const showToast = (type: 'ok' | 'err' | 'warn', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await adminApi.get<any>('/api/settings');
      const merged: SettingsShape = {
        ...DEFAULTS,
        ...s,
        rates: {
          ...DEFAULTS.rates,
          ...(s.rates || {}),
          currency: s.rates?.currency || 'INR',
          tiers: s.rates?.tiers || {
            short: {
              baseline: s.rates?.baselineRate ?? 700,
              addons: s.rates?.addonRates || DEFAULT_TIERS.short.addons,
            },
            long: DEFAULT_TIERS.long,
            commercial: DEFAULT_TIERS.commercial,
          },
          baselineRate: s.rates?.baselineRate ?? 700,
          addonRates: s.rates?.addonRates || DEFAULT_TIERS.short.addons,
        },
        siteIdentity: { ...DEFAULTS.siteIdentity, ...(s.siteIdentity || s.theme || {}) },
        appearance: {
          ...DEFAULTS.appearance,
          ...(s.appearance || {}),
          primary: s.appearance?.primary || s.theme?.accent || '#D4AF37',
          secondary: s.appearance?.secondary || s.theme?.background || '#0A0A0B',
          accent: s.appearance?.accent || s.theme?.accent || '#E8B923',
        },
        social: Array.isArray(s.social) && s.social.length ? s.social : DEFAULTS.social,
        integrations: { ...DEFAULTS.integrations, ...(s.integrations || {}) },
        advanced: { ...DEFAULTS.advanced, ...(s.advanced || {}) },
        rateHistory: Array.isArray(s.rateHistory) ? s.rateHistory : [],
      };
      // health hints
      try {
        const h = await adminApi.get<any>('/api/health');
        merged.integrations.nvidiaKeySet = h?.checks?.ai && h.checks.ai !== 'not_configured';
        merged.integrations.supabaseSet = h?.checks?.storage === 'supabase' || h?.checks?.database === 'ok';
      } catch {
        /* */
      }
      setData(merged);
      setSaved(JSON.parse(JSON.stringify(merged)));
    } catch (e: any) {
      showToast('err', e.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(saved), [data, saved]);

  const currentTier = data.rates.tiers[tier];

  const ratesValid =
    currentTier.baseline >= 0 &&
    currentTier.addons.render4k >= 0 &&
    currentTier.addons.multiFormat >= 0 &&
    currentTier.addons.customSound >= 0;

  const calcTotal = useMemo(() => {
    let t = currentTier.baseline * Math.max(1, calc.minutes);
    if (calc.render4k) t += currentTier.addons.render4k;
    if (calc.multiFormat) t += currentTier.addons.multiFormat;
    if (calc.customSound) t += currentTier.addons.customSound;
    return t;
  }, [currentTier, calc]);

  const updateTier = (patch: Partial<typeof currentTier>) => {
    setData((d) => ({
      ...d,
      rates: {
        ...d.rates,
        tiers: {
          ...d.rates.tiers,
          [tier]: { ...d.rates.tiers[tier], ...patch },
        },
        // keep legacy keys in sync for public site
        baselineRate: tier === 'short' ? (patch.baseline ?? d.rates.tiers.short.baseline) : d.rates.baselineRate,
        addonRates:
          tier === 'short'
            ? { ...d.rates.tiers.short.addons, ...(patch.addons || {}) }
            : d.rates.addonRates,
      },
    }));
  };

  const save = async () => {
    if (!ratesValid) {
      showToast('err', 'Fix invalid rates before saving');
      return;
    }
    setSaving(true);
    try {
      const prev = saved.rates.tiers[tier];
      const next = data.rates.tiers[tier];
      const history = [...(data.rateHistory || [])];
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
        ...data,
        rateHistory: history.slice(0, 20),
        rates: {
          ...data.rates,
          baselineRate: data.rates.tiers.short.baseline,
          addonRates: data.rates.tiers.short.addons,
        },
        theme: {
          accent: data.appearance.accent,
          background: data.appearance.secondary,
          text: '#EDEDED',
          logoUrl: data.siteIdentity.logoUrl,
          faviconUrl: data.siteIdentity.faviconUrl,
        },
      };
      await adminApi.put('/api/settings', payload);
      setData(payload);
      setSaved(JSON.parse(JSON.stringify(payload)));
      showToast('ok', 'Settings saved');
    } catch (e: any) {
      showToast('err', e.message || 'Save failed — check Supabase settings.data');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setData(JSON.parse(JSON.stringify(saved)));
    showToast('warn', 'Changes discarded');
  };

  const metaLen = data.siteIdentity.metaDescription.length;
  const metaColor = metaLen > 160 ? 'text-red-400' : metaLen > 140 ? 'text-amber-300' : 'text-[#8A857C]';

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Admin</p>
          <h2 className="text-xl font-black text-white">Pricing & Settings</h2>
          <p className="text-xs text-[#8A857C]">
            Settings / {TABS.find((t) => t.id === tab)?.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative rounded-full border border-white/10 p-2 text-[#8A857C] hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#D4AF37]" />
          </button>
          <PrimaryButton type="button" onClick={() => void save()} disabled={saving || !dirty || !ratesValid}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </PrimaryButton>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="mx-auto w-full max-w-[900px] space-y-8">
          {/* Pricing card */}
          <Card className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Pricing rates</h3>
                <p className="text-sm text-[#8A857C]">Used on services page and proposal drafts</p>
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
                  className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                    tier === id
                      ? 'bg-[#D4AF37] text-black'
                      : 'border border-white/10 text-[#8A857C] hover:border-white/25'
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
                  invalid={currentTier.baseline < 0}
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
                    <div className="mb-1 flex items-center justify-between text-xs text-[#B8B3AA]">
                      <span>{label}</span>
                      <span className="text-[#555]">{unit}</span>
                    </div>
                    <MoneyInput
                      value={currentTier.addons[key]}
                      currency={data.rates.currency}
                      onChange={(n) =>
                        updateTier({ addons: { ...currentTier.addons, [key]: n } })
                      }
                      onReset={() =>
                        updateTier({
                          addons: {
                            ...currentTier.addons,
                            [key]: saved.rates.tiers[tier].addons[key],
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Live calculator */}
            <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
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
                    ['multiFormat', 'Multi-format'],
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
                  <p className="text-[10px] uppercase text-[#8A857C]">Client total</p>
                  <p className="text-2xl font-black text-white">{money(calcTotal, data.rates.currency)}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="text-xs text-[#8A857C] underline hover:text-[#D4AF37]"
            >
              {historyOpen ? 'Hide' : 'Show'} rate history ({data.rateHistory.length})
            </button>
            {historyOpen ? (
              <ul className="max-h-40 space-y-2 overflow-y-auto text-xs text-[#B8B3AA]">
                {data.rateHistory.length === 0 ? (
                  <li className="text-[#555]">No changes recorded yet</li>
                ) : (
                  data.rateHistory.slice(0, 5).map((h, i) => (
                    <li key={i} className="rounded-lg border border-white/5 px-3 py-2">
                      <span className="text-[#666]">{new Date(h.at).toLocaleString()}</span>
                      {' · '}
                      {h.field}: {h.from} → {h.to} · {h.by}
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </Card>

          {/* Settings tabs */}
          <div>
            <div className="mb-4 flex flex-wrap gap-1 rounded-full border border-white/10 bg-black/30 p-1">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition ${
                      active ? 'bg-[#D4AF37] text-black' : 'text-[#8A857C] hover:text-white'
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
                  <Field label="Site name">
                    <Input
                      value={data.siteIdentity.name}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          siteIdentity: { ...d.siteIdentity, name: e.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Tagline">
                    <Input
                      value={data.siteIdentity.tagline}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          siteIdentity: { ...d.siteIdentity, tagline: e.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Logo URL">
                    <Input
                      value={data.siteIdentity.logoUrl}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          siteIdentity: { ...d.siteIdentity, logoUrl: e.target.value },
                        }))
                      }
                      placeholder="https://…"
                    />
                  </Field>
                  <Field label="Favicon URL">
                    <Input
                      value={data.siteIdentity.faviconUrl}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          siteIdentity: { ...d.siteIdentity, faviconUrl: e.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Meta description">
                    <Textarea
                      value={data.siteIdentity.metaDescription}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          siteIdentity: { ...d.siteIdentity, metaDescription: e.target.value },
                        }))
                      }
                      className="min-h-24"
                    />
                    <p className={`mt-1 text-xs ${metaColor}`}>{metaLen}/160 characters (SEO)</p>
                  </Field>
                </div>
              )}

              {tab === 'appearance' && (
                <div className="space-y-4">
                  {(['primary', 'secondary', 'accent'] as const).map((key) => (
                    <Field key={key} label={key}>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={data.appearance[key]}
                          onChange={(e) =>
                            setData((d) => ({
                              ...d,
                              appearance: { ...d.appearance, [key]: e.target.value },
                            }))
                          }
                          className="h-10 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
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
                    </Field>
                  ))}
                  <Field label="Font pairing">
                    <select
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                      value={data.appearance.fontPair}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          appearance: { ...d.appearance, fontPair: e.target.value },
                        }))
                      }
                    >
                      <option>Inter / system-ui</option>
                      <option>Space Grotesk / Inter</option>
                      <option>Playfair Display / Inter</option>
                    </select>
                    <p className="mt-2 text-sm text-[#B8B3AA]" style={{ fontFamily: data.appearance.fontPair }}>
                      The quick brown fox jumps over VisionFold.
                    </p>
                  </Field>
                  <Field label="Density">
                    <div className="flex gap-2">
                      {(['comfortable', 'compact'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setData((x) => ({ ...x, appearance: { ...x.appearance, density: d } }))}
                          className={`rounded-full px-4 py-1.5 text-xs capitalize ${
                            data.appearance.density === d
                              ? 'bg-[#D4AF37] text-black'
                              : 'border border-white/10 text-[#8A857C]'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {tab === 'social' && (
                <div className="space-y-3">
                  {data.social.map((row, i) => (
                    <div key={row.id} className="flex flex-wrap gap-2">
                      <Input
                        className="w-32"
                        value={row.platform}
                        onChange={(e) => {
                          const social = [...data.social];
                          social[i] = { ...row, platform: e.target.value };
                          setData((d) => ({ ...d, social }));
                        }}
                      />
                      <Input
                        className="min-w-[200px] flex-1"
                        value={row.url}
                        onChange={(e) => {
                          const social = [...data.social];
                          social[i] = { ...row, url: e.target.value };
                          setData((d) => ({ ...d, social }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setData((d) => ({ ...d, social: d.social.filter((s) => s.id !== row.id) }))}
                        className="p-2 text-red-400"
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
                    <Plus className="h-4 w-4" /> Add link
                  </GhostButton>
                </div>
              )}

              {tab === 'integrations' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <IntegrationCard
                    name="Supabase"
                    status={data.integrations.supabaseSet ? 'ok' : 'err'}
                    detail={data.integrations.supabaseSet ? 'Connected' : 'Set SUPABASE_URL + service role'}
                  />
                  <IntegrationCard
                    name="NVIDIA AI"
                    status={data.integrations.nvidiaKeySet ? 'ok' : 'warn'}
                    detail={data.integrations.nvidiaKeySet ? 'Key detected' : 'Set NVIDIA_API_KEY on Vercel'}
                  />
                  <IntegrationCard name="Resend (email)" status="warn" detail="Optional — set RESEND_API_KEY" />
                  <IntegrationCard name="Stripe" status="warn" detail="Optional — billing later" />
                  <div className="sm:col-span-2 space-y-2 rounded-xl border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white">Masked secrets (local note only)</p>
                      <button type="button" onClick={() => setShowKeys((v) => !v)} className="text-[#8A857C]">
                        {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-[#666]">
                      Real keys live in Vercel env — never commit them. {showKeys ? 'Visible mode is for labels only.' : ''}
                    </p>
                  </div>
                </div>
              )}

              {tab === 'advanced' && (
                <div className="space-y-4">
                  <Field label="Environment">
                    <div className="flex gap-2">
                      {(['staging', 'production'] as const).map((env) => (
                        <button
                          key={env}
                          type="button"
                          onClick={() => {
                            if (env === 'production' && data.advanced.env !== 'production') {
                              if (!confirm('Mark environment as production?')) return;
                            }
                            setData((d) => ({ ...d, advanced: { ...d.advanced, env } }));
                          }}
                          className={`rounded-full px-4 py-1.5 text-xs capitalize ${
                            data.advanced.env === env
                              ? 'bg-[#D4AF37] text-black'
                              : 'border border-white/10 text-[#8A857C]'
                          }`}
                        >
                          {env}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Webhook URL">
                    <div className="flex gap-2">
                      <Input
                        value={data.advanced.webhookUrl}
                        onChange={(e) =>
                          setData((d) => ({
                            ...d,
                            advanced: { ...d.advanced, webhookUrl: e.target.value },
                          }))
                        }
                        placeholder="https://…"
                      />
                      <GhostButton
                        type="button"
                        onClick={() => showToast('warn', 'Webhook test requires a live endpoint')}
                      >
                        <Link2 className="h-4 w-4" /> Test
                      </GhostButton>
                    </div>
                  </Field>
                  <Field label="Custom CSS">
                    <textarea
                      className="min-h-32 w-full rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-xs text-[#EDEDED]"
                      value={data.advanced.customCss}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          advanced: { ...d.advanced, customCss: e.target.value },
                        }))
                      }
                      placeholder=".hero { /* … */ }"
                    />
                  </Field>
                </div>
              )}

              {tab === 'system' && (
                <div className="space-y-4">
                  <p className="text-sm text-[#8A857C]">Roles use your users table (admin / client / editor).</p>
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-[#8A857C]">
                        <tr>
                          <th className="px-3 py-2">Member</th>
                          <th className="px-3 py-2">Role</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#B8B3AA]">
                        <tr className="border-t border-white/5">
                          <td className="px-3 py-2">Studio admin</td>
                          <td className="px-3 py-2">Admin</td>
                        </tr>
                        <tr className="border-t border-white/5">
                          <td className="px-3 py-2">Portal clients</td>
                          <td className="px-3 py-2">Client (view own projects)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <PrimaryButton
                    type="button"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `visionfold-settings-${Date.now()}.json`;
                      a.click();
                      showToast('ok', 'Settings exported');
                    }}
                  >
                    Export settings JSON
                  </PrimaryButton>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Live preview */}
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#8A857C]">
              Live preview
            </div>
            <div
              className="p-4"
              style={{
                background: data.appearance.secondary,
                color: '#EDEDED',
              }}
            >
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
                {data.siteIdentity.logoUrl ? (
                  <img src={data.siteIdentity.logoUrl} alt="" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded text-[10px] font-black text-black"
                    style={{ background: data.appearance.primary }}
                  >
                    VF
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold">{data.siteIdentity.name}</p>
                  <p className="text-[10px] opacity-60">{data.siteIdentity.tagline}</p>
                </div>
              </div>
              <p className="text-xs opacity-70">{data.siteIdentity.metaDescription.slice(0, 120)}</p>
              <div
                className="mt-4 rounded-xl p-4"
                style={{ border: `1px solid ${data.appearance.primary}44` }}
              >
                <p className="text-[10px] uppercase tracking-wider" style={{ color: data.appearance.primary }}>
                  Services
                </p>
                <p className="mt-1 text-lg font-black">
                  Starting at {money(data.rates.tiers.short.baseline, data.rates.currency)}/min
                </p>
                <button
                  type="button"
                  className="mt-3 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-black"
                  style={{ background: data.appearance.primary }}
                >
                  Get a quote
                </button>
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
          </Card>
        </aside>
      </div>

      {/* Unsaved bar */}
      {dirty ? (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#D4AF37]/40 bg-black/95 px-4 py-2 shadow-2xl backdrop-blur">
          <AlertCircle className="h-4 w-4 text-amber-300" />
          <span className="text-xs text-[#EDEDED]">You have unsaved changes</span>
          <GhostButton type="button" onClick={discard}>
            Discard
          </GhostButton>
          <PrimaryButton type="button" onClick={() => void save()} disabled={saving || !ratesValid}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </PrimaryButton>
        </div>
      ) : null}

      {toast ? (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-xl ${
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-[#8A857C]">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function IntegrationCard({
  name,
  status,
  detail,
}: {
  name: string;
  status: 'ok' | 'warn' | 'err';
  detail: string;
}) {
  const color =
    status === 'ok' ? 'bg-emerald-400' : status === 'warn' ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-white">{name}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      </div>
      <p className="mt-2 text-xs text-[#8A857C]">{detail}</p>
    </div>
  );
}

export default PricingSettingsPage;
