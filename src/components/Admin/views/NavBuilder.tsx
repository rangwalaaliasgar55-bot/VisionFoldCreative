import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import type { CmsNavItem } from '../../../lib/cmsTypes';
import { Card, PrimaryButton, Input } from '../ui';

export const NavBuilder: React.FC = () => {
  const [nav, setNav] = useState<CmsNavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    adminApi
      .get<{ nav: CmsNavItem[] }>('/api/cms/nav')
      .then((d) => setNav(d.nav || []))
      .catch((e) => setMsg(e.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await adminApi.put<{ nav: CmsNavItem[] }>('/api/cms/nav', { nav });
      setNav(res.nav);
      setMsg(`Saved ${new Date().toLocaleTimeString()}`);
    } catch (e: any) {
      setMsg(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const add = () => {
    setNav([
      ...nav,
      {
        id: `nav_${Date.now()}`,
        label: 'New link',
        href: '/',
        order: nav.length,
      },
    ]);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= nav.length) return;
    const next = [...nav];
    [next[i], next[j]] = [next[j], next[i]];
    setNav(next.map((n, order) => ({ ...n, order })));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">CMS</p>
          <h2 className="text-xl font-black text-white">Navigation</h2>
          <p className="text-sm text-[#8A857C]">Reorder and edit header links — no redeploy</p>
        </div>
        <div className="flex gap-2">
          <PrimaryButton type="button" onClick={add}>
            <Plus className="h-4 w-4" /> Add
          </PrimaryButton>
          <PrimaryButton type="button" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </PrimaryButton>
        </div>
      </div>
      {msg ? <p className="text-xs text-[#D4AF37]">{msg}</p> : null}
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
      ) : (
        <div className="space-y-2">
          {nav.map((item, i) => (
            <Card key={item.id} className="flex flex-wrap items-center gap-2 p-3">
              <Input
                className="min-w-[120px] flex-1"
                value={item.label}
                onChange={(e) => {
                  const next = [...nav];
                  next[i] = { ...item, label: e.target.value };
                  setNav(next);
                }}
              />
              <Input
                className="min-w-[140px] flex-1"
                value={item.href}
                onChange={(e) => {
                  const next = [...nav];
                  next[i] = { ...item, href: e.target.value };
                  setNav(next);
                }}
              />
              <button type="button" onClick={() => move(i, -1)} className="p-1 text-[#8A857C]">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => move(i, 1)} className="p-1 text-[#8A857C]">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setNav(nav.filter((_, x) => x !== i).map((n, order) => ({ ...n, order })))}
                className="p-1 text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavBuilder;
