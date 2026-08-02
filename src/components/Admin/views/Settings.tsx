import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAdmin } from '../../../context/AdminContext';
import { Card, CardHeader, Input, PrimaryButton } from '../ui';

export const Settings: React.FC = () => {
  const { baselineRate, setBaselineRate, addonRates, setAddonRates, metrics, setMetrics } = useAdmin();
  const [localRate, setLocalRate] = useState(baselineRate.toString());
  const [localAddons, setLocalAddons] = useState(addonRates);
  const [localMetrics, setLocalMetrics] = useState(metrics);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalRate(baselineRate.toString());
    setLocalAddons(addonRates);
    setLocalMetrics(metrics);
  }, [baselineRate, addonRates, metrics]);

  const handleSave = () => {
    setBaselineRate(parseInt(localRate, 10) || 700);
    setAddonRates(localAddons);
    setMetrics(localMetrics);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Base Pricing" subtitle="Drives the live rate shown to prospects on your site" />
        <div className="p-6">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Baseline Rate (₹ per minute)</label>
          <Input type="number" value={localRate} onChange={(e) => setLocalRate(e.target.value)} className="max-w-xs text-xl font-black text-[#D4AF37]" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Add-On Rates" subtitle="Per-minute pricing for extra deliverables" />
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">4K Render Export</label>
            <Input type="number" value={localAddons.render4k} onChange={(e) => setLocalAddons({ ...localAddons, render4k: parseInt(e.target.value, 10) || 0 })} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Multi-Format Reframing</label>
            <Input type="number" value={localAddons.multiFormat} onChange={(e) => setLocalAddons({ ...localAddons, multiFormat: parseInt(e.target.value, 10) || 0 })} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Custom Sound Design & Foley</label>
            <Input type="number" value={localAddons.customSound} onChange={(e) => setLocalAddons({ ...localAddons, customSound: parseInt(e.target.value, 10) || 0 })} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Showcase Metrics" subtitle="The stat badges shown on your homepage case studies" />
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Split View Badge</label>
            <Input value={localMetrics.retentionSplit} onChange={(e) => setLocalMetrics({ ...localMetrics, retentionSplit: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Card 1 Metric</label>
            <Input value={localMetrics.card1Metric} onChange={(e) => setLocalMetrics({ ...localMetrics, card1Metric: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Card 2 Metric</label>
            <Input value={localMetrics.card2Metric} onChange={(e) => setLocalMetrics({ ...localMetrics, card2Metric: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]">Card 3 Metric</label>
            <Input value={localMetrics.card3Metric} onChange={(e) => setLocalMetrics({ ...localMetrics, card3Metric: e.target.value })} />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <PrimaryButton onClick={handleSave}><Save className="h-4 w-4" /> Save Changes</PrimaryButton>
        {saved ? <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Saved</span> : null}
      </div>
    </div>
  );
};
