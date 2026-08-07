import React, { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, PrimaryButton, Input } from '../ui';

type Theme = {
  accent: string;
  background: string;
  text: string;
  logoUrl: string;
  faviconUrl: string;
  fontSans: string;
};

const DEFAULT: Theme = {
  accent: '#D4AF37',
  background: '#0A0A0B',
  text: '#EDEDED',
  logoUrl: '',
  faviconUrl: '',
  fontSans: 'Inter, system-ui, sans-serif',
};

export const ThemeCustomizer: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    adminApi
      .get<any>('/api/settings')
      .then((s) => {
        if (s?.theme) setTheme({ ...DEFAULT, ...s.theme });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    // Live preview on admin document
    document.documentElement.style.setProperty('--vf-accent', theme.accent);
    document.documentElement.style.setProperty('--vf-bg', theme.background);
    document.documentElement.style.setProperty('--vf-text', theme.text);
  }, [theme]);

  const save = async () => {
    setSaving(true);
    try {
      const current = await adminApi.get<any>('/api/settings');
      await adminApi.put('/api/settings', { ...current, theme });
      setMsg(`Saved ${new Date().toLocaleTimeString()}`);
    } catch (e: any) {
      setMsg(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">CMS</p>
          <h2 className="text-xl font-black text-white">Theme</h2>
          <p className="text-sm text-[#8A857C]">Colors and brand assets — preview live, save to persist</p>
        </div>
        <PrimaryButton type="button" onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save theme
        </PrimaryButton>
      </div>
      {msg ? <p className="text-xs text-[#D4AF37]">{msg}</p> : null}
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        {(['accent', 'background', 'text'] as const).map((key) => (
          <label key={key} className="text-xs text-[#8A857C]">
            {key}
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                value={theme[key]}
                onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
              />
              <Input value={theme[key]} onChange={(e) => setTheme({ ...theme, [key]: e.target.value })} />
            </div>
          </label>
        ))}
        <label className="text-xs text-[#8A857C]">
          Logo URL
          <Input className="mt-1" value={theme.logoUrl} onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value })} />
        </label>
        <label className="text-xs text-[#8A857C]">
          Favicon URL
          <Input className="mt-1" value={theme.faviconUrl} onChange={(e) => setTheme({ ...theme, faviconUrl: e.target.value })} />
        </label>
        <label className="text-xs text-[#8A857C] sm:col-span-2">
          Font stack
          <Input className="mt-1" value={theme.fontSans} onChange={(e) => setTheme({ ...theme, fontSans: e.target.value })} />
        </label>
      </Card>
      <Card className="p-6" style={{ background: theme.background, color: theme.text }}>
        <p className="text-xs uppercase tracking-wider" style={{ color: theme.accent }}>
          Live preview
        </p>
        <h3 className="mt-2 text-2xl font-black">VisionFold Creative</h3>
        <p className="mt-2 text-sm opacity-80">Premium short-form and brand films.</p>
        <button
          type="button"
          className="mt-4 rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider text-black"
          style={{ background: theme.accent }}
        >
          Get a quote
        </button>
      </Card>
    </div>
  );
};

export default ThemeCustomizer;
